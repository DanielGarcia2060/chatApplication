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