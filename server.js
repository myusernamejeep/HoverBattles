startup = require('./startup');

DB_CONFIG_FILE = "config/db.json"
KEYS_CONFIG_FILE = "config/keys.json"
ENV = startup.get_env();

http = require('http'),  
path = require('path'),
io = require('socket.io'), 
fs = require('fs');

paperboy = require('paperboy');

Services = require('./src/server/services').Services;
LandscapeHandler = require('./src/server/landscapehandler').LandscapeHandler;

startup.check_config_exists(DB_CONFIG_FILE);
startup.check_config_exists(KEYS_CONFIG_FILE);

var serviceHandler = new Services();
var landscapeHandler = new LandscapeHandler();

ROOT = path.dirname(__filename) +  '/site/app/';

server = http.createServer(function(req, res){    
  if(serviceHandler.handle(req, res)) return;
  if(landscapeHandler.handle(req, res)) return;

	paperboy
	.deliver(ROOT, req, res)
	.otherwise(function(){
		res.writeHead(404, "Content-Type: text/plain");
		res.write("Not found and all that");
		res.end();		
	});
});

server.listen(1222);
console.log("Listening on port 1222");

var Controller = require('./src/core/controller').Controller;
var ServerApp = require('./src/server/application').ServerApp;
var ServerCommunication = require('./src/server/communication').ServerCommunication;
var LandscapeController = require('./src/entities/landscapecontroller').LandscapeController;

var app = new ServerApp();
var controller = new Controller(app.scene);
var game = new ServerCommunication(app, server);
var landscape = new LandscapeController.Create(app);

app.resources.onAllAssetsLoaded(function(){
       
    setInterval(function(){
        controller.tick();
    }, 1000 / 30);
    
    setInterval(function(){    
        game.synchronise();
    }, 500); 
});
