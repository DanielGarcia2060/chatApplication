
//Avoid polluting global scope wrapping app inside IIFE

(function(angular){

// Initialize our module
angular.module('chat_room',['ngRoute'])

.run(['userService',function (userService) {

	userService.auth({},'/verify');
	console.info('module initialized ok'); // If everything goes fine see feedback

}])
