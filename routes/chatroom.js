
exports.showChatroomPage = function(req,res){
	/*
	var paramName="userid";
	var userId=req.param(paramName);
	*/
	var userId=req.query.userid;
	res.render("chatroomPage",{userid:userId});
}