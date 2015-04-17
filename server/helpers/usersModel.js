
var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    bcrypt = require('bcrypt'),

    /*
	TODO: Move folowing constants to config file && import
    */
    CONNECTION_STRING = 'mongodb://localhost/chatApp',
    SALT_WORK_FACTOR = 10;

//connect to database

mongoose.connect(CONNECTION_STRING,function (err) {
		if(err){
			console.log('Error while connecting to database',err);
		}
	 });

var db=mongoose.connection;

//We now need to get notified if we connect successfully or if a connection error occurs:
db.on('error',function(err){
	if(err){
		throw err;
	}
 });

//With Mongoose, everything is derived from a Schema, so create ours
var UserSchema = new Schema({
    username: { type: String, required: true, index: { unique: true } },
    user_email: { type: String, required: true, index: { unique: true } },
    password: { type: String, required: true },
	friends:{type:[String], 'default':[]},
	requests:{type:[String], required:false}
 });

//	Add mongoose middleware to automatically hash the password saved.

//	WARNING !!! : This only works invoking _save_ method, so avoid using _update_

UserSchema.pre('save', function(next) {
    var user = this;

	// only hash the password if it has been modified (or is new)
	if (!user.isModified('password')) return next();

	// generate a salt
	bcrypt.genSalt(SALT_WORK_FACTOR, function(err, salt) {
	    if (err) return next(err);

	    // hash the password using our new salt
	    bcrypt.hash(user.password, salt, function(err, hash) {
	        if (err) return next(err);

	        // override the cleartext password with the hashed one
	        user.password = hash;
	        next();
	    });
	});
 });

// Add some behavior to our users via UserSchema.methods object
// before compilation into Model

UserSchema.methods.comparePassword = function(candidatePassword, cb) {
    bcrypt.compare(candidatePassword, this.password, function(err, isMatch) {
        
        if (err)
        	return cb(err);
        cb(null, isMatch);
    });
 };

UserSchema.methods.hasFriend = function (friend) {
		return (!!friend) && (this.friends.indexOf(friend) !== -1);
 }

UserSchema.methods.getFriends = function () {
	return this.friends;
 }

// We've got a schema. The next step is compile it into a Model.
var User=mongoose.model('User',UserSchema);

db.once('open',function () {
	console.log('Conected to Db');

	/*
	TODO: Remove hardcoded testUsers
	*/
	var testUsers=[
		new User({
			username:'alejandro',
			user_email:'alejandro@chatapp.com',
			password:'1234',
			friends:['miguel','roberto']
		})
		,new User({
			username:'miguel',
			user_email:'miguel@chatapp.com',
			password:'1234',
			friends:['roberto','alejandro']
		})
		,new User({
			username:'roberto',
			user_email:'roberto@chatapp.com',
			password:'1234',
			friends:['miguel','alejandro']
		})
		,new User({
			username:'najash',
			user_email:'najash@chatapp.com',
			password:'1234',
			friends:['daniel']
		})
		,new User({
			username:'daniel',
			user_email:'daniel@chatapp.com',
			password:'1234',
			friends:['najash']
		})
	 ];

	for (var i = 0; i < testUsers.length; i++) {
		testUsers[i].save();
	 };
});


// Define API to work with our chat app:

function saveNewUser ( obj, cb ) {
	userToSave = new User(obj);
	userToSave.save(function (err , us) {
		if(err)
			return cb(err);
		else
			cb(null,{	// do not return password
			username:us.username,
			user_email:us.user_email,
			friends:us.friends
			});
	});
 }

function authenticateUser (obj, cb) {
	User.findOne({username:obj.username},function (err , res) {
		if(err) 
			return cb(err);
		if(!res) 
			return cb({error:'Invalid username/psw'},false);
		res.comparePassword(obj.password,function (err , match) {
			if(err) 
				return cb(err);
			if(!match) 
				return cb(null,match);
			cb(null,{
				username:res.username,
				friends:res.friends,
				requests:res.requests||[]
			});
		});
	});
 }

function reAuthenticate (obj ,cb) {
	User.findOne({username:obj.username},function (err, result) {
		if(err)
			return cb(err);
		cb(null,{
			username:result.username,
			friends:result.friends,
			requests:result.requests||[]
		})
	})
 }

function findFriendByName (friendname, action, cb, sender) {
	if(friendname && action)
	User.find({username:friendname},function (err ,res) {
		if (err || res.length===0){
			return cb(null , '');
		}
		if(action === 'invite' && sender){
			var newRequests = res[0].requests;
			if(newRequests.indexOf(sender) === -1)
			newRequests.push(sender);
			return User.findOneAndUpdate({username:friendname},{requests:newRequests},{},function (err ,res) {
				cb(null , 'invitation sent!');
			});
		}
		cb(null,res[0].username);
	});
 }

function removeRequest (sender , target, cb) {
	User.find({username:target},function (err, result) {
		if(err)
			return cb(err);
		var updatedRequests=result[0].requests;
		var index = updatedRequests.indexOf(sender);
		if(index !== -1)
			updatedRequests.splice(index,1);
		User.findOneAndUpdate({username:target},{requests:updatedRequests},{},function (err, result) {
			if(err)
				return cb(err);
			cb(null);
		});
	});
 }

function addFriend (target, newFriend, cb) {
	User.find({username:target},function (err, result) {
		if(err) return cb(err);
		var friendsArray = result[0].friends;
		var index = friendsArray.indexOf(newFriend);
		if(index === -1){
			friendsArray.push(newFriend);
			User.findOneAndUpdate({username:target},{friends:friendsArray},{},function (err, updated) {
				if(err) return cb(err);
				cb(null);
			});
		}
	});
 }

function acceptRequest (sender, target, cb) {
	removeRequest(sender,target,function (err) {
		if(err)	return cb(err);

		addFriend(sender,target,function(err){
			if(err) return cb(err);

			addFriend(target,sender,function (err) {
				if (err) return cb(err);
				cb(null);
			});

		});

	});
 }

function rejectRequest (sender ,target, cb) {
	removeRequest(sender,target,cb);
 }

//API of Users 

module.exports = {
	saveUser:saveNewUser,
	authenticate:authenticateUser,
	findFriend:findFriendByName,
	reauthenticate:reAuthenticate,
	accept:acceptRequest,
	reject:rejectRequest
};