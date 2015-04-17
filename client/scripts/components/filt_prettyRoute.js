.filter('prettyRoute',function () {
	return function (route) {
		return route.replace(/\/chat|\/private|\//gim,'');
	}
})