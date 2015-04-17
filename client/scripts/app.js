
//Avoid polluting global scope wrapping app inside IIFE

(function(angular){

// Initialize our module
angular.module('chat_room',['ngRoute'])

.run(['userService',function (userService) {

	userService.auth({},'/verify');
	console.info('module initialized ok'); // If everything goes fine see feedback

}])

.config(['$routeProvider', '$locationProvider', '$compileProvider',
  function ($routeProvider, $locationProvider, $compileProvider) {
  $routeProvider
   .when('/chat', {
    templateUrl: '/templates/tpl_home'
  })
  .when('/chat/login', {
    templateUrl: '/templates/tpl_login',
    controller:'loginController'
  })
  .when('/chat/register', {
    templateUrl: '/templates/tpl_register',
    controller:'registerController'
  })
  .when('/chat/account', {
    templateUrl: '/templates/tpl_account',
    controller:'accountController'
  })
  .when('/chat/:type', {
    templateUrl: '/templates/tpl_chat',
    controller:'chatController',
    resolve: {
      // Cause a 0.3 second delay to show transition
      delay:['$q','$timeout', function($q, $timeout) {
        var delay = $q.defer();
        $timeout(delay.resolve, 300);
        return delay.promise;
      }]
    }

  })
  .when('/chat/:type/:friendname\/?', {
    templateUrl: '/templates/tpl_chat',
    controller:'chatController',
    resolve: {
      // Cause a 0.3 second delay to show transition
      delay:['$q','$timeout', function($q, $timeout) {
        var delay = $q.defer();
        $timeout(delay.resolve, 300);
        return delay.promise;
      }]
    }
  })
  .otherwise({
    redirectTo:'/chat'
  })
  ;

  //angular 1.3 new configuration --was-- .html5Mode(true);
  $locationProvider.html5Mode({
    enabled:true
  });

  $compileProvider.debugInfoEnabled(false);

}])

.controller('accountController'
	,['$scope','userService','User'
	,function ($scope , userService, User) {

	$scope.user=User.get();
	$scope.friendName='';
	$scope.foundFriend='';

	$scope.findFriend = function(){
		if($scope.findFriend)
		userService.find($scope.friendName)
		.then(function (result) {
			$scope.foundFriend=result;
		}
		,function (result) {
			$scope.foundFriend=result;
		});	
	}

	$scope.sendInvitation = function () {
		if( ($scope.foundFriend) &&
		 ($scope.foundFriend!== 'Oops, sorry!'))
		userService.invite($scope.foundFriend)
		.then(function ( ) {
			$scope.foundFriend='';
		}
		,function () {
			$scope.foundFriend='Oops, sorry!';
		});
	}

	$scope.accept=function (sender) {
		userService.handle(sender,'accept').then(function () {
			User.get().friends.push(sender);
			var index=User.get().requests.indexOf(sender);
			User.get().requests.splice(index,1);
		},function ( ) {
			$scope.foundFriend='Oops sorry!';
		});
	}
	$scope.reject=function (sender) {
		userService.handle(sender,'reject');
	}

}])
.controller('chatController',['$scope','socketService', 'User', 'MessagesCache','$routeParams',
	function ($scope,socketService, User, MessagesCache, $routeParams) {


	$scope.rooms = MessagesCache.keys();
	$scope.friends = User.get().friends;
	$scope.invite='';
	$scope.usersSubscribed=$routeParams.friendname || '';

	$scope.sendAs='txt';
	$scope.message={
		txt:'',
		scribble:'',
		initX:0,
		initY:0,
		type:$routeParams.type,
		friends:(  $routeParams.friendname ? 
				$routeParams.friendname+'/' : '' )+User.get().username
	}

	$scope.send=function () {
		if(/\+/g.test($routeParams.friendname)){
		var targets=$scope.usersSubscribed.split('+').sort().join('/')+'/'+User.get().username;
			$scope.message.friends=targets;
		}

		socketService.send($scope.message);
		$scope.message.scribble='';
		$scope.message.txt='';
	}

	$scope.isRoom=function (roomname){
		return(roomname === ('/chat/'+$routeParams.type+($routeParams.friendname?'/'+$routeParams.friendname:'')));
	}

	$scope.isActive = function (name) {
		return socketService.getFriends().indexOf(name) !== -1;
	}

	$scope.isJoined = function (name){
		return $scope.usersSubscribed.indexOf(name) !== -1;
	}

	$scope.$watch(MessagesCache.keys,function (newVal, oldVal) {
		$scope.rooms=newVal;
	});

	$scope.$watch(function () {
			$scope.usersSubscribed=$routeParams.friendname || '';
		return $routeParams.friendname;
	},function (newVal, oldVal) {
		if(newVal)
			return $scope.invite='+';			
		$scope.invite='';
	});

}])
.controller('headerController',
	['$scope','User','userService','$window',
	function ($scope , User, userService, $window) {

		//In case of error (i.e. Angular not loading)
		//Send user feedback
		$scope.SORRY_THERE_WAS_A_PROBLEM = 'Chat App :)';

		$scope.state=function(){
			return User.exists();
		}

		$scope.unauth=function () {
			userService.unauth()
			.then(function () {
				$window.location.reload();
			});
		}
}])
.controller('loginController',
	['$scope','userService'
	,function ($scope, userService) {
	
	//user model
	$scope.errorMsg=undefined;
	$scope.user={
		username:'',
		password:''
	}

	$scope.errorMsg=undefined;
	
	$scope.login=function () {
		var promise=userService.auth($scope.user,'/login');
		promise
		.then(
			function (msg) {
				userService.redirect('/chat/account');
			}
			,
			function (err) {
				$scope.errorMsg=err;
			}
			);
	}

}])
.controller('registerController',
	['$scope', 'userService'
	,function ($scope, userService) {

	//user model
	$scope.user={
		username:'',
		user_email:'',
		password:'',
		friends:[]
	};

	$scope.errorMsg=undefined;
	
	$scope.register=function () {
		var promise=userService.auth($scope.user,'/register');
		promise
		.then(
			function (msg) {
				userService.redirect('/chat/account');
			}
			,
			function (err) {
				$scope.errorMsg=err;
			}
			);
	}

}])
.directive('chatRoomWindow',['$window','MessagesCache', '$location',
	function ( $window, MessagesCache, $location){
		
	function linkFn (scope, element, attrs) {

		//	Chat window is resized proportional to window && scrolled
		function resizeWindow ( ) {
			var newHeight=Math.max($window.innerHeight-245,120)+'px';
			element.children().css({height:newHeight});
			element.children()[0].scrollTop=element.children()[0].scrollHeight;
			return 'a';
		}

		scope.$watch(resizeWindow,angular.noop);

		angular.element($window).bind('resize',resizeWindow);

		scope.$on('$routeChangeSuccess',function (ev, curr, prev) {
			setTimeout(function() {
				element.parent().removeClass('white');
			}, 300);
			var path=$location.path();
			var viewContent = MessagesCache.get(path);
			element.append(viewContent);
		});
		scope.$on('$routeChangeStart',function () {
			element.parent().addClass('white');
		});
	}

	return{
		restrict: 'A',
		link:linkFn,
		scope:false
	}

}])
.directive('writeScribble', function(){
  return {
    restrict: 'A',
    scope:false,
    link: function(scope, element){
        
      // canvas reset
      function reset(){
       deltas=[];
       scope.message.scribble='';
       element[0].width = element[0].width; 
      }
     
      var deltas = [];

      var ctx = element[0].getContext('2d');
      
      // variable that decides if something should be drawn on mousemove
      var drawing = false;
      
      // the last coordinates before the current move
      var lastX;
      var lastY;
      
      element.bind('mousedown', function(event){
        if(event.offsetX!==undefined){
          lastX = event.offsetX;
          lastY = event.offsetY;
        } else {
          lastX = event.layerX - event.currentTarget.offsetLeft;
          lastY = event.layerY - event.currentTarget.offsetTop;
        }

        scope.message.initX=lastX;
        scope.message.initY=lastY;
        reset();
        // begins new line
        ctx.beginPath();
        
        drawing = true;
      });

      element.bind('mousemove', function(event){
        if(drawing){
          // get current mouse position
          if(event.offsetX!==undefined){
            currentX = event.offsetX;
            currentY = event.offsetY;
          } else {
            currentX = event.layerX - event.currentTarget.offsetLeft;
            currentY = event.layerY - event.currentTarget.offsetTop;
          }
          
          draw(lastX, lastY, currentX, currentY);
          deltas.push(currentX-lastX,currentY-lastY);
          // set current coordinates to last one
          lastX = currentX;
          lastY = currentY;
        }
        
      });
      element.bind('mouseup', function(event){
        // stop drawing
        drawing = false;
          scope.message.scribble=deltas.join(',');
      });
      
      function draw(lX, lY, cX, cY){
        // line from
        ctx.moveTo(lX,lY);
        // to
        ctx.lineTo(cX,cY);
        // color
        ctx.strokeStyle = '#000';
        // draw it
        ctx.stroke();
      }
    }
  };
})
.directive('triggerMenu',function(argument) {
	return{
		restrict:'C',
		link:function (scope, elem) {
			var removing = undefined;

			elem.on('click',function(){
				
				if(elem.hasClass('open')){
					elem.removeClass('open');
				}
				else{
					scope.$digest();
					elem.addClass('open');
				}

			});
			
			elem.on('mouseleave',function () {
				removing=setTimeout(function () {
					elem.removeClass('open');
					removing = undefined;
				},800);
			});

			elem.on('mouseenter',function () {
				if(removing){
					clearTimeout(removing);
					removing=undefined;
				}
			})

		}
	}
})
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
.factory('userService',
	['$http' , '$location' ,'$templateCache', '$q', 'User', 'socketService',
	function ($http , $location , $templateCache, $q, User, socketService) {

	var config={
		headers: {
		'Content-Type':'application/x-www-form-urlencoded; charset=utf-8'
		}		
	};

	function transformRequest (data) {
            var buffer = [];

            // Serialize each key in the object.
            for ( var name in data ) {
                var value = data[ name ];
                buffer.push(
                    encodeURIComponent( name ) +
                    "=" +
                    encodeURIComponent( ( value == null ) ? "" : value )
                );
            }

            // Serialize the buffer and clean it up for transportation.
            var source = buffer
                .join( "&" )
                .replace( /%20/g, "+" );
            return source;
	}

	function login (obj,path) {
		var defered=$q.defer(),
		req=transformRequest(obj);

		$http.post(path,req,config)
		.success(
			function (data ,status ,headers, config) {
				User.set(data.user);
				$templateCache.removeAll();
				socketService.init();
				defered.resolve('Success '+path.replace('/',''));
			}
			)
		.error(
			function (data ,status ,headers, config) {
				defered.reject(data.error);
			}
			);

		return defered.promise;
	}

	function findFriend (name) {
		var defered=$q.defer();
		$http.post('/friendapi',{friendname:name,action:'find'})
		.success(function (data ,status ,headers, config) {
			defered.resolve(data.friendname || 'not Found');
		})
		.error(function (data ,status, headers, config) {
			defered.reject();
		});
		return defered.promise;
	}

	function inviteFriend (name) {
		var defered=$q.defer();
		$http.post('/friendapi',{friendname:name,action:'invite'})
		.success(function (data ,status ,headers, config) {
			defered.resolve('done');
		})
		.error(function (data ,status, headers, config) {
			defered.reject('error');
		});
		return defered.promise;
	}

	function logout () {
		var defered=$q.defer();

		$http.post('/logout')
		.success(
			function (data ,status ,headers ,config) {
				User.clear();
				$templateCache.removeAll();
				socketService.disconnect();
				defered.resolve('Successfull logout');
			}
			)
		.error(
			function (data ,status ,headers ,config) {
				console.warn('Error at logout',data);
				defered.reject('There was a problem at logout');
			}
			);
		return defered.promise;
	}

	function redir (newPath) {
		$location.path(newPath);
	}

	function handleRequest(from, actionToDo){
		var defered=$q.defer();
		$http.post('friendapi',{related:'friendRequest',action:actionToDo,sender:from})
		.success(function (data, status, headers, config) {
			defered.resolve();
		})
		.error(function (data, status, headers, config) {
			defered.reject();
		});
		return defered.promise;
	}
	return {
		auth:login,
		unauth:logout,
		redirect:redir,
		find:findFriend,
		invite:inviteFriend,
		handle:handleRequest
	};
}])
.filter('prettyRoute',function () {
	return function (route) {
		return route.replace(/\/chat|\/private|\//gim,'');
	}
})
.service('MessagesCache',['$cacheFactory',function ($cacheFactory) {

	var MessagesCache=$cacheFactory('MessagesCache');
	var allKeys=[];

	return {
		put:function (key, val) {
			var index = allKeys.indexOf(key);
			if(index === -1){
				allKeys.push(key);
				return MessagesCache.put(key, val);
			}
			return MessagesCache.get(key);
		}
		,get:function (key) {
			return MessagesCache.get(key)||this.put(key,angular.element('<div id="chat_window"></div>'));
		}
		,remove:function (key) {
			var index = allKeys.indexOf(key);
			if(index !== -1){
				allKeys.splice(index,1);
				return MessagesCache.remove(key);
			}
		}
		,keys:function () {
			return allKeys;
		}
	};
}])
.service('User',function User () {

	var user={friends:[]};

	this.set=function (newUser) {
		user=newUser;
		return true;
	}

	this.get=function ( ) {
		return user;
	}

	this.clear=function () {
		this.set(null);
	}

	this.exists=function () {
		return !!user.username;
	}

})

// send angular as parameter of our IIFE declared inside app.js
})(angular);