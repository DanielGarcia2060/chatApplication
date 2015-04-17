var Server=require('socket.io');

var rooms={
		public:true,
		private:true,
		roomA:true
		},
	connectedClients={};

function authenticationInterceptor (socket) {
	var store=socket.request.sessionStore.sessions,
		id=socket.request.sessionID;
		if(!store[id]){
			socket.disconnect();
			socket=null;
		}
		else if(!(Date.parse(JSON.parse(store[id])['cookie']['expires']) > Date.now())){
			socket.emit('info','You have been logged out due to inactivity');
			socket.disconnect();
		}
 }

function getRoomsAndUsers (socket) {
	var user=socket.request.session.currentUser;
	var data={
		rooms:[],
		friends:[]};
		for (var i = 0; i < user.friends.length; i++) {
			if(connectedClients[user.friends[i]] !== undefined){
				data.friends.push(user.friends[i]);
				connectedClients[user.friends[i]].emit('friendConnected',user.username);
			}
		};
		for (var key in rooms) {
			if(key !== 'private'){
				data.rooms.push(key);
			}
		}
		return data;
 }

function suscribeTo (socket, roomReference ,roomName) {
	if( (rooms[roomName] !== undefined) && 
		( roomName !== roomReference.room ) 
		){
		var previousRoom=socket.rooms[socket.rooms.length-1];
		while (socket.rooms.length) {
			socket.leave(socket.rooms.pop());
		};
		socket.join(roomName);
		socket.emit('info','You\'re now in '+roomName);
		roomReference.room = roomName;
	}
	else if( (roomName !== 'public') && 
		( roomName !== roomReference.room ) ){
		socket.emit('info','No such room to subscribe');
	}
	}

module.exports = function (server, sessMiddleware){

io=Server(server);

//	Socket configuration
io.use(function (socket,next) {
	sessMiddleware(socket.request,{},next);
});

// If the user is not logged in, reject connection
io.use(function (socket,next) {
	if(!socket.request.session.currentUser){
		socket.disconnect();
		socket=null;
	}
	else next();
});


io.on('connection',function (socket){

	var username = socket.request.session.currentUser.username;
	var roomReference={room:''};

	connectedClients[username]=socket;
	suscribeTo(socket,roomReference,'public');
	socket.emit('initSocket',getRoomsAndUsers(socket));

	var handlers={
		disconnect:function () {
			
			var currentFriends = socket.request.session.currentUser.friends;

			for(var i=0; i<currentFriends.length ; i++){
				if(connectedClients[currentFriends[i]] !== undefined){
					connectedClients[currentFriends[i]].emit('friendDisconnected',username);
				}
			}
			
			delete connectedClients[username];
			
			io.to(roomReference.room).emit('info','user '+username+' has left');
			
			roomReference=null;
			username=null;
		},
		message:function (data) {
			
			authenticationInterceptor(socket);

			if(socket && data){
				data.from=username;

				if( data.type === 'public'){
					
					var friendsList = socket.request.session.currentUser.friends;

					for(var i=0; i<friendsList.length ; i++){
						if(connectedClients[friendsList[i]] !== undefined){
							//Emit message only to friends
							connectedClients[friendsList[i]].emit('message',data);
						}
					}
					socket.emit('message',data);
				}
				else if( data.type === 'private'){
					var friends = data.friends.split('/');

					// Emit message to connected friends
					for (var i = 0; i < friends.length; i++) {
						if( connectedClients[friends[i]] !== undefined ){
							connectedClients[friends[i]].emit('message',data);
						}
					};
				}
			}
		}
	};

	//Register our events and handler
	for (var key in handlers) {
		socket.on(key,handlers[key]);
	};

	});


}//end of exports function