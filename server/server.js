var config=require('../configuration.js'),
	port=config.port;

var fs=require('fs');

var express=require('express');
var session=require('express-session');

// var sessionStore=new session.MemoryStore();
var app=express();
var server=require('http').createServer(app);

// Session middleware
var sessionMiddleware=session({
	name:'AppCookie',
	secret:'aSdFgHjKlqWeRtYuIoPzXcVbNm456789123',
	cookie:{
		maxAge:3600000 //1 hour
	},
	unset:'destroy'
	});

// Body parsing middleware
var jsonParser = require('body-parser').json(),
	urlencodedParser = require('body-parser').urlencoded();

//Load our helper modules
var Users=require('./helpers/usersModel.js');
var socket=require('./helpers/socketEvents.js')(server,sessionMiddleware);

// Define app settings && middleware
app.disable('x-powered-by');
app.use('/public',express.static(__dirname+'/public'));
app.set('view engine','jade');
app.set('views',__dirname+'/views');
app.use(sessionMiddleware);

// Simple Helper function
var logMeIn = function (req, res ,userObj) {
			req.session.currentUser=userObj;
			var data={user:userObj};
			res.status(200);
			res.json(data);
			}

//Define Routes
app.get('/',function (req,res){
	res.render('home');
	});

app.get('/templates/:templateName',function (req,res,next) {

	var tpl=req.param('templateName');
	var relPath=__dirname+'/views/'+tpl+'.jade';
	var user=req.session.currentUser?
		req.session.currentUser:
		{username:'Guest'};

	//Validate view path
	fs.exists(relPath,function (exist) {
		exist ?
			res.render(tpl,{username:user.username}):
			next();		
	});
	});

app.get('/logout',function (req,res){
	req.session.currentUser=null;
	req.session.destroy(function (argument) {
		res.redirect('/');
	});
	req.session=null;
	});

app.post('/logout',function (req,res){
	req.session.currentUser=null;
	req.session.destroy(function (argument) {
		res.json({done:true});
	});
	req.session=null;
	});

app.post('/register',urlencodedParser,function (req,res) {

	if(req.body.username && req.body.user_email && req.body.password ){

		req.body.friends=[];
		
		req.body.username=='Guest'?
			req.body.username='':
			null;
		
		Users.saveUser(req.body,function ( err ,user) {
		
			if (err){
				if( err.code === 11000){
					res.status(400);
					return res.json({error:'Error: Please choose diferent username Or Login using your email registered',code:11000});
				}
		
				res.status(401);
		
				return res.json({error:err});
		
			}
			return logMeIn(req, res, user);
		});
	}
	else{
		res.status(400).json({error:'not enough info'});
	}
	});

app.post('/login',urlencodedParser,function (req ,res) {

	if(req.body.username && req.body.password ){
		
		Users.authenticate(req.body ,function ( err ,user) {

			if (err || !user){
				console.log(err);
				res.status(401);
				return res.json({error:"Invalid username/password"});
			}
			
			return logMeIn(req, res, user);

		});
	}

	else{
		res.status(400).json({error:'not enough info'});
	}
	});

app.post('/verify',function (req,res){
	if(req.session.currentUser){

		Users.reauthenticate(req.session.currentUser ,function ( err ,user) {

			if (err || !user){
				console.log(err);
				res.status(401).end();
			}

			return logMeIn(req, res, user);

		});


	}
	else{
		res.status(401).end('error');
	}
	});

app.post('/friendapi',jsonParser,function (req ,res) {
	if(!req.session.currentUser){
		res.json({});
	}
	else if(req.body.related === 'friendRequest' && req.body.sender && req.body.action){
		if(req.body.action === 'accept')
			return Users.accept(req.body.sender,req.session.currentUser.username,function (err, done) {
				if(err) return res.status(500).end();
				res.end();
			});

				Users.reject(req.body.sender,req.session.currentUser.username,function (err, done) {
					if(err) return res.status(500).end();
					res.end();
				});

	}
	else{
		Users.findFriend(req.body.friendname,req.body.action,function (err ,result) {
			if(err || !result)
				return res.json({friendname:''});
			else
				res.json({friendname:result});
		},req.session.currentUser.username);
	}
	});

app.get(['/chat','/chat/*'],function (req,res){
	res.render('home');
	});

	//Use custom 404 page;

app.use(function (req, res) {
	res.status(404);
    res.render('not_found.jade',{path:req.path});
	});

server.listen(port,function (err){
	if(err){
		console.error(err);
	}
	console.log('\x1b[47m\x1b[44m%s\x1b[0m','\nServer listening on port:'+port);
	});