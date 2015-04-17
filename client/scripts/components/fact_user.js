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