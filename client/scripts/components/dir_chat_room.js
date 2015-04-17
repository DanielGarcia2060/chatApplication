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