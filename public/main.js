$(function() {
  var FADE_TIME = 150; // ms
  var TYPING_TIMER_LENGTH = 400; // ms
  var COLORS = [
    '#e21400', '#91580f', '#f8a700', '#f78b00',
    '#58dc00', '#287b00', '#a8f07a', '#4ae8c4',
    '#3b88eb', '#3824aa', '#a700ff', '#d300e7'
  ];

  // Initialize variables
  var $window = $(window);
  var $usernameInput = $('.usernameInput'); // Input for username
  var $messages = $('.messages'); // Messages area
  var $inputMessage = $('.inputMessage'); // Input message input box

  var $loginPage = $('.login.page'); // The login page
  var $chatPage = $('.chat.page'); // The chatroom page

  // Prompt for setting a username
  var username="";
  var connected = false;
  var typing = false;
  var lastTypingTime;
  var $currentInput = $usernameInput.focus();

  var socket = io();

  var $sendMsgBtn=$("input.sendMsgBtnCls");

  var $currentServerDatetime="";

  function addParticipantsMessage (data) {
    var message = '';
    if (data.numUsers === 1) {
      message += "At present there's 1 chat person.";
    } else {
      message += "At present there are " + data.numUsers + " chat persons.";
    }
    log(message);
  }
  
  /*
  // Sets the client's username
  function setUsername () {
    username = cleanInput($usernameInput.val().trim());

    // If the username is valid
    if (username) {
      $loginPage.fadeOut();
      $chatPage.show();
      $loginPage.off('click');
      $currentInput = $inputMessage.focus();

      // Tell the server your username
      socket.emit('add user', username);
    }
  }
  */
  
  function setUsername () {
    
    username = TrimWhiteSpace($usernameInput.val());

    if (username==""){
        alert("Nickname can't be empty.");
        $usernameInput.focus();
        return;
    }
    
    username = cleanInput(username);

    // If the username is valid
    if (username) {
      
      /*
      $loginPage.fadeOut();
      $chatPage.show();
      $loginPage.off('click');
      $currentInput = $inputMessage.focus();
      */

      var userObj={userid:userId, username:username};
      // Tell the server your username
      //socket.emit('add user', username);
      socket.emit('add user', userObj);
    }
  }
  
  /*
  // Sends a chat message
  function sendMessage () {
    var message = $inputMessage.val();
    // Prevent markup from being injected into the message
    message = cleanInput(message);
    // if there is a non-empty message and a socket connection
    if (message && connected) {
      $inputMessage.val('');
      addChatMessage({
        username: username,
        message: message
      });
      // tell server to execute 'new message' and send along one parameter
      socket.emit('new message', message);
    }
  }
  */ 
  
  function sendMessage () {
    var message = $inputMessage.val();
    // Prevent markup from being injected into the message
    message = cleanInput(message);
    // if there is a non-empty message and a socket connection
    if (message && connected) {
      $inputMessage.val('');

      var ifMsgFromLocal=true;

      var dataObj={username:username,userid:userId,msgdatetime:$currentServerDatetime,message:message};      
      addChatMessage(dataObj,ifMsgFromLocal);

      socket.emit('new message', {message:message,msgdatetime:$currentServerDatetime});
    }
  }
  
   
  // Log a message
  function log (message, options) {
    var $el = $('<li>').addClass('log').text(message);
    addMessageElement($el, options);
  }

  function showCurrentGMTDatetime(gmtDatetime){
    var $el = $("<li id='serverDatetimeLi'>").addClass('log').text(gmtDatetime);
    $messages.append($el);
  }

  function addWelcomeInfo(message){

     var $li=$("<li>");
     var $label = $("<label id='serverDatetimeLabel'>").text($currentServerDatetime);
     $li.addClass('log').append($label);
     $li.append("<br/>");
     var $label = $("<label>").text(message);
     $li.append($label);
     $messages.prepend($li);
  }
  
  /*
  // Adds the visual chat message to the message list
  function addChatMessage (data, options) {
    // Don't fade the message in if there is an 'X was typing'
    var $typingMessages = getTypingMessages(data);
    options = options || {};
    if ($typingMessages.length !== 0) {
      options.fade = false;
      $typingMessages.remove();
    }

    var $usernameDiv = $('<span class="username"/>')
      .text(data.username)
      .css('color', getUsernameColor(data.username));
    var $messageBodyDiv = $('<span class="messageBody">')
      .text(data.message);

    var typingClass = data.typing ? 'typing' : '';
    var $messageDiv = $('<li class="message"/>')
      .data('username', data.username)
      .addClass(typingClass)
      .append($usernameDiv, $messageBodyDiv);

    addMessageElement($messageDiv, options);
  }
  */

  // Adds the visual chat message to the message list
  function addChatMessage (data, ifMsgFromLocal, options) {
    // Don't fade the message in if there is an 'X was typing'
    var $typingMessages = getTypingMessages(data);
    options = options || {};
    if ($typingMessages.length !== 0) {
      options.fade = false;
      $typingMessages.remove();
    }

    if (ifMsgFromLocal==true){
        var msgHeadColor="green";
    } else {
        var msgHeadColor="blue";
    }

    if (data.typing){
        var $usernameDiv = $('<span class="username_typing"/>')
                           .text(data.username+"<"+data.userid+">");
    } else {
        var $usernameDiv = $('<span class="username"/>')
                           .text(data.username+"<"+data.userid+">"+" "+data.msgdatetime)
                           .css('color', msgHeadColor);
    }

    var $messageBodyDiv = $('<span class="messageBody">')
                          .text(data.message);


    var typingClass = data.typing ? 'typing' : '';

    var $messageDiv = $('<li class="message"/>')
                      .data('username', data.username)
                      .addClass(typingClass);

    if (data.typing){
        $messageDiv.append($usernameDiv, $messageBodyDiv);
    } else {
        $messageDiv.append($usernameDiv, $("<br/>"), $messageBodyDiv);
    }                 
      

    addMessageElement($messageDiv, options);
  }


  // Adds the visual chat typing message
  function addChatTyping (data) {
    data.typing = true;
    data.message = 'is typing';
    addChatMessage(data);
  }

  // Removes the visual chat typing message
  function removeChatTyping (data) {
    getTypingMessages(data).fadeOut(function () {
      $(this).remove();
    });
  }

  // Adds a message element to the messages and scrolls to the bottom
  // el - The element to add as a message
  // options.fade - If the element should fade-in (default = true)
  // options.prepend - If the element should prepend
  //   all other messages (default = false)
  function addMessageElement (el, options) {
    var $el = $(el);

    // Setup default options
    if (!options) {
      options = {};
    }
    if (typeof options.fade === 'undefined') {
      options.fade = true;
    }
    if (typeof options.prepend === 'undefined') {
      options.prepend = false;
    }

    // Apply options
    if (options.fade) {
      $el.hide().fadeIn(FADE_TIME);
    }
    if (options.prepend) {
      $messages.prepend($el);
    } else {
      $messages.append($el);
    }
    $messages[0].scrollTop = $messages[0].scrollHeight;
  }

  // Prevents input from having injected markup
  function cleanInput (input) {
    return $('<div/>').text(input).html();
  }

  // Updates the typing event
  function updateTyping () {
    if (connected) {
      if (!typing) {
        typing = true;
        socket.emit('typing');
      }
      lastTypingTime = (new Date()).getTime();

      setTimeout(function () {
        var typingTimer = (new Date()).getTime();
        var timeDiff = typingTimer - lastTypingTime;
        if (timeDiff >= TYPING_TIMER_LENGTH && typing) {
          socket.emit('stop typing');
          typing = false;
        }
      }, TYPING_TIMER_LENGTH);
    }
  }

  // Gets the 'X is typing' messages of a user
  function getTypingMessages (data) {
    return $('.typing.message').filter(function (i) {
      return $(this).data('username') === data.username;
    });
  }

  // Gets the color of a username through our hash function
  function getUsernameColor (username) {
    // Compute hash code
    var hash = 7;
    for (var i = 0; i < username.length; i++) {
       hash = username.charCodeAt(i) + (hash << 5) - hash;
    }
    // Calculate color
    var index = Math.abs(hash % COLORS.length);
    return COLORS[index];
  }

  // Keyboard events

  $window.keydown(function (event) {
    // Auto-focus the current input when a key is typed
    if (!(event.ctrlKey || event.metaKey || event.altKey)) {
      $currentInput.focus();
    }
    // When the client hits ENTER on their keyboard
    if (event.which === 13) {
      if (username) {
        sendMessage();
        socket.emit('stop typing');
        typing = false;
      } else {
        setUsername();
      }
    }
  });
   

  $sendMsgBtn.on("click",function(){
      if (username) {
          sendMessage();
          socket.emit('stop typing');
          typing = false;
      }
  });


  $inputMessage.on('input', function() {
    updateTyping();
  });

  // Click events

  // Focus input when clicking anywhere on login page
  $loginPage.click(function () {
    $currentInput.focus();
  });

  // Focus input when clicking on the message input's border
  $inputMessage.click(function () {
    $inputMessage.focus();
  });

  // Socket events

  // Whenever the server emits 'login', log the login message
  socket.on('login', function (data) {
    
    $loginPage.fadeOut();
    $chatPage.show();
    $loginPage.off('click');
    $currentInput = $inputMessage.focus();

    connected = true;
    // Display the welcome message
    //var message = "Welcome to Socket.IO Chat – ";
    
    //var message = "Welcome to game chatroom, "+data.username+"<"+data.userid+">.";
    var message = "Welcome to game chatroom, "+data.username+"<"+data.userid+">.";

    /*
    log(message, {
      prepend: true
    });
    
    showCurrentGMTDatetime($currentServerDatetime);
    */

    addWelcomeInfo(message);

    addParticipantsMessage(data);
  });

  // Whenever the server emits 'new message', update the chat body
  socket.on('new message', function (data) {
    if (username!=""){
        window.parent.postMessage('new message','*');
        addChatMessage(data);
    }
  });

  // Whenever the server emits 'user joined', log it in the chat body
  socket.on('user joined', function (data) {
    //log(data.username + ' joined');
    log(data.username + "<" + data.userid + ">" + ' joined');
    addParticipantsMessage(data);
  });

  // Whenever the server emits 'user left', log it in the chat body
  socket.on('user left', function (data) {
    //log(data.username + ' left');
    log(data.username + "<" + data.userid + ">" + ' left');
    addParticipantsMessage(data);
    removeChatTyping(data);
  });

  // Whenever the server emits 'typing', show the typing message
  socket.on('typing', function (data) {
    addChatTyping(data);
  });

  // Whenever the server emits 'stop typing', kill the typing message
  socket.on('stop typing', function (data) {
    removeChatTyping(data);
  });
  
  ////???
  socket.on('disconnect', function () {
    log('you have been disconnected');
  });
  
  socket.on("nickname existed", function(data){
      var nickname=data.username;
      handleNicknameExisted(nickname);
  });

  socket.on("server_datetime", function(data){
      $currentServerDatetime=data;
      $("label#serverDatetimeLabel").text(data);
  });
  
  
  socket.on("forced disconnect",function(){
      /*
      log('you have been disconnected');
      socket.emit("disconnect",{});
      */
      username="";
      window.parent.postMessage('forced disconnect','*');
      //window.location.reload();
  });
  
 
  ////???
  socket.on('reconnect', function () {
    log('you have been reconnected');
    if (username) {
      socket.emit('add user', username);
    }
  });
  
  ////???
  socket.on('reconnect_error', function () {
    log('attempt to reconnect has failed');
  });
  
  function TrimWhiteSpace(str)
  {

    return str.replace(/(^\s*)|(\s*$)/g, "");
  }

  function handleNicknameExisted(nickname){
    $("div#showErrorDiv").remove();
    var message="<label style='color:red;'> * The nickname '"+nickname+"' has existed in the chatroom, please try another one.</label>";
    var divObj=$("<div id='showErrorDiv'/>").append(message);
    $("div.form").append(divObj);
    $usernameInput.focus();
    username="";
  }

  /* 
  function getParamValueFromQueryString(paramName) {  
        var reg = new RegExp("(^|&)" + paramName + "=([^&]*)(&|$)");  
        var r = window.location.search.substr(1).match(reg);  
        if (r != null){
            return unescape(r[2]);
        }  
                          
        return '';  
  }
                
  var paramName="userid";

  var userId=getParamValueFromQueryString(paramName);
                
  alert("user id: "+userId);
  */
 
});
