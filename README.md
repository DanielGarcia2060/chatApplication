Chat Room
=========

This is a simple chat application project to integrate a broad set of technologies:

Including

1. AngularJS
1. NodeJS
1. MongoDB

As well as different modules, including:

1. Express
1. Socket.IO
1. Jade
1. LESS
1. Bcrypt
1. Grunt
1. Mongoose

## Features

* Allows a browser to connect as a chat client.
* Allows users to communicate in real-time.
* Allow users to identify themselves uniquely (have an account).
* Allow users to hold a list of other users that mutually wish to keep track of each other. 
* Send text messages.
* Send *scribbles* (messages in image form)
* Allow users to communicate in groups or one-on-one.
* User is logged out after 1 hour being idle.
* Passwords are encripted.
* A connection from unauthenticaded user is rejected.

## Strucure and Description

The folder structure is the following

```
├───client
│   ├───less
│   └───scripts
│       └───components
├───database
│
├───node_modules
│
└───server
    ├───helpers
    ├───public
    │   └───images
    └───views

```

* `client` contains front end code (application and styles)
  * Angular application, the components are in different files using prefixes.
    The app is merged in a single file > app.js
    The app.js file is minified to `app.min.js` to `server/public` folder
  * LESS styles that are built to `global.css` inside `server/public` folder
* `server` contains the `server.js` file, and subfolders.
  * `server.js`: Includes the express sever
  * `helpers`: contains two helper modules
    * `usersModel`: Database layer, including password encryption
    * `socketEvens`: Socket management
  * `views`: Includes `.jade` files
  * `public`: Includes all public assets `images|css|js`

### Prerequisites

To run this project you will need to have installed:
 
[NodeJs]("//nodejs.org/download") & npm (_node package manager_ that comes with NodeJs)
[Grunt]("//gruntjs.com/getting-started") & Grunt CLI (_Grunt command line interface_)  Both installed via npm
[MongoDB]("//www.mongodb.org")


##Startup

Once you have NodeJs & npm installed, you'll have to:
 
1. Clone this project to your local machine

		git clone "https://github.com/DanielGarcia2060/chatApplication.git"

2. Install modules and dependencies using

		npm install

3. Make shure you have a mongoDB running

4. Run Grunt to start the process

		grunt