
/*
// Setup basic express server
var express = require('express');
var app = express();
var path = require('path');
var server = require('http').createServer(app);
var io = require('../..')(server);
var port = process.env.PORT || 3000;
server.listen(port, function () {
  console.log('Server listening at port %d', port);
});
*/

var express = require("express");
var app = express();
var path = require("path");
var http = require("http");
var socketIo = require("socket.io");
var chatroom = require("./routes/chatroom");

var httpServer= http.createServer(app);
var socketIoServer = socketIo.listen(httpServer);
app.set("port",3060);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.get("/", chatroom.showChatroomPage);

httpServer.listen(app.get("port"), function () {
    console.log('Server listening at port %d now.', app.get("port"));
});

// Routing
app.use(express.static(path.join(__dirname, 'public')));

// Chatroom

var numUsers = 0;

var nickNamesUsed=[];

var userIds=[];

var sockets={};


socketIoServer.on('connection', function (socket) {
  var addedUser = false;
  
  /*
  // when the client emits 'new message', this listens and executes
  socket.on('new message', function (data) {
    // we tell the client to execute 'new message'
    socket.broadcast.emit('new message', {
      username: socket.username,
      message: data
    });
  });
  */
 
  socket.on('new message', function (data) {
      // we tell the client to execute 'new message'
      socket.broadcast.emit('new message', {
         username: socket.username,
         userid: socket.userid,
         msgdatetime: data.msgdatetime,
         message: data.message
      });
  });
  
  /*
  // when the client emits 'add user', this listens and executes
  socket.on('add user', function (username) {
    if (addedUser) return;

    // we store the username in the socket session for this client
    socket.username = username;
    ++numUsers;
    addedUser = true;
    socket.emit('login', {
      numUsers: numUsers
    });
    // echo globally (all clients) that a person has connected
    socket.broadcast.emit('user joined', {
      username: socket.username,
      numUsers: numUsers
    });
  });
  */
 
  socket.on('add user', function (userObj) {
    if (addedUser) return;

    // we store the username in the socket session for this client
    
    var userName = userObj.username;
    var userId = userObj.userid;
    
    if (nickNamesUsed.indexOf(userName) != -1){
        socket.emit('nickname existed', {
            username: userName
        });
    } else {

        /*
        socket.username = userName;
        socket.userid = userId;
        ++numUsers;
        addedUser = true;
        
        nickNamesUsed.push(userName);
        userIds.push(userId);
        
        sockets[userId]=socket;
        */
        
        socket.username = userName;
        socket.userid = userId;
        addedUser = true;
        ++numUsers;
        
        if (userIds.indexOf(userId) != -1){
            var previousUserIdIndex = userIds.indexOf(userId);
            delete userIds[previousUserIdIndex];
            
            var previousSocket=sockets[userId];
            previousSocket.emit("forced disconnect",{});
        }
        
        nickNamesUsed.push(userName);
        userIds.push(userId);
        
        sockets[userId]=socket;
        

        socket.emit('login', {
           username: userName,
           userid: userId,
           numUsers: numUsers
        });

        
        // echo globally (all clients) that a person has connected
        socket.broadcast.emit('user joined', {
           username: socket.username,
           userid: socket.userid,
           numUsers: numUsers
        });
    }

  });

  /*
  // when the client emits 'typing', we broadcast it to others
  socket.on('typing', function () {
    socket.broadcast.emit('typing', {
      username: socket.username
    });
  });
  */
 
  // when the client emits 'typing', we broadcast it to others
  socket.on('typing', function () {
    socket.broadcast.emit('typing', {
      userid: socket.userid,
      username: socket.username
    });
  });

  // when the client emits 'stop typing', we broadcast it to others
  socket.on('stop typing', function () {
    socket.broadcast.emit('stop typing', {
      username: socket.username
    });
  });

  // when the user disconnects.. perform this
  socket.on('disconnect', function () {
    if (addedUser) {
      --numUsers;
      
      var userName=socket.username;
      var userNameIndex=nickNamesUsed.indexOf(userName);
      delete nickNamesUsed[userNameIndex];
      
      /*
      var userId=socket.userid;
      var userIdIndex=userIds.indexOf(userId);
      delete userIds[userIdIndex];
      */

      // echo globally that this client has left
      socket.broadcast.emit('user left', {
        username: socket.username,
        userid: socket.userid,
        numUsers: numUsers
      });
    }
  });
   
  function tick() {
    /*
    var now = new Date().toUTCString();
    socket.emit("server_datetime",now);
    */
   
    var year =  new Date().getUTCFullYear();    
    var month = new Date().getUTCMonth() ;
    var day = new Date().getUTCDate();
    var hour = new Date().getUTCHours();
    var minute = new Date().getUTCMinutes();
    var second = new Date().getUTCSeconds();
    
    month=month+1;
    if (month<10){
        month="0"+month;
    }

    if (hour<10){
        hour="0"+hour;
    }

    if (minute<10){
        minute="0"+minute;
    }

    if (second<10){
        second="0"+second;
    }

    var gmtDatetime= year+"/"+month+"/"+day+" "+hour+":"+minute+":"+second + " GMT";

    socket.emit("server_datetime",gmtDatetime);
  }

  setInterval(tick, 1000);

});
