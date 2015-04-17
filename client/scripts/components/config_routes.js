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
