.factory('socketService',['$rootScope', 'User', 'MessagesCache','$timeout',
	function ($rootScope, User, MessagesCache, $timeout){

	// Socket Lazy Initialization
	var socket=null,
	activeRooms=[];
	friendsConnected=[];

	function handleEvent (type, data) {
			// Callback when a message from server has arrived
		if(type==='msgFromServer'){

			var target = (data.type === 'public')?
						 '/chat/public' :
						 (function (friends) {
						 	var result=friends.split('/');
						 	var index =result.indexOf(User.get().username);
						 	result.splice(index,1);
								return '/chat/private/'+result.sort().join('+');
							})(data.friends);

			var viewContent=MessagesCache.get(target);

			var newScribble;
			
			// create new element
			var msg=angular.element('<div></div>')
				.addClass('msg')
				.addClass('justDisplayed');

				msg.append(angular.element('<span class="from">'+data.from+'</span>'));

			// add class (needed to make transition)
			if(data.txt){
				var newText = angular.element('<p></p>')
					.text(data.txt);
				msg.append(newText);
			}


			if( data.scribble ){
				var lastX=data.initX || 0,
					lastY=data.initY || 0,
					deltas=data.scribble.split(','),
					newScribble = angular.element('<canvas></canvas>');
				var ctx = newScribble[0].getContext('2d');
				ctx.moveTo(lastX,lastY);
				ctx.beginPath();
				while (deltas.length) {
					lastX += parseInt(deltas.shift());
					lastY += parseInt(deltas.shift());
					ctx.lineTo(lastX,lastY);
				}
				ctx.strokeStyle = '#000';
				ctx.stroke();
				msg.append(newScribble);
			}

			if(data.from == User.get().username){
				msg.addClass('mine');
			}
			
			// append it to chat window 
			viewContent.append(msg);
			
			// schedule animation
			$timeout(function () {
				msg.removeClass('justDisplayed');
				msg=null; 
				scribble=null; // ...clean up
			},10);
		}

		/*$rootScope.$on('info',function (ev, data) {
				var info=angular.element('<div></div>')
					.addClass('chat-info')
					.text(data);
				viewContent.append(info);
		});*/

	}

	// define service API

	function initializeSocket () {
		
		socket=io();

		//define our handlers
		var handlers={
			message:function (data) {
					handleEvent('msgFromServer',data);
				},
			info:function (txt) {
					handleEvent('info',txt);
			},
			disconnect:function (){
					console.warn('socket out');
					handleEvent('info','Connection has finished');
				},
			initSocket:function (data) {
					activeRooms=data.rooms;
					friendsConnected=data.friends;
				},
			friendConnected:function ( friend ) {
				if(friendsConnected.indexOf(friend) === -1)
				friendsConnected.push(friend);
			},
			friendDisconnected:function ( friend ) {
				var index = friendsConnected.indexOf(friend);
				if( index !== -1)
				friendsConnected.splice(index,1);
			}
		};
		

		for (var key in handlers) {
			socket.on(key,handlers[key]);
		};

	}

	function sendMessagge ( message ) {

		if(socket && (message.scribble || message.txt)){
			socket.emit('message',message);
		}

	}
	
	function disconnectSocket () {
		if(socket){
			socket.disconnect();
		}
		socket=null;
	}

	function createNewRoom ( roomName ){
		socket.emit('createRoom',roomName);
	}

	function getActiveRooms ( ) {
		return activeRooms;
	}

	function getActiveFriends ( ) {
		return friendsConnected;
	}

	return {
		init:initializeSocket,
		send:sendMessagge,
		disconnect:disconnectSocket,
		createRoom:createNewRoom,
		getRooms:getActiveRooms,
		getFriends:getActiveFriends
	}

}])