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