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