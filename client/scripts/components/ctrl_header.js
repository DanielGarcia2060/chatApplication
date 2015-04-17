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