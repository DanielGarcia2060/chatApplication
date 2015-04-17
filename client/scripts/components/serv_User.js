.service('User',function User () {

	var user={friends:[]};

	this.set=function (newUser) {
		user=newUser;
		return true;
	}

	this.get=function ( ) {
		return user;
	}

	this.clear=function () {
		this.set(null);
	}

	this.exists=function () {
		return !!user.username;
	}

})

// send angular as parameter of our IIFE declared inside app.js
})(angular);