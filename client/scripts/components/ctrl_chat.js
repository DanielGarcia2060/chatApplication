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