var Explosion = require('../explosion').Explosion;

exports.ClientGameReceiver = function(app, server) {
  var self = this;

  var app = app;
  var server = server;
  var started = false;
  var craft = null;
  var playerId = null;
  var chaseCamera = null;
  var controller = null;
  var hovercraftFactory = new HovercraftFactory(app);
 
  self._init = function(data) {
	  playerId = data.id;
    craft = hovercraftFactory.create(data.id);   
    controller = new HovercraftController(data.id, server);
	  craft.attach(Smoother);
    craft.player = true;

    chaseCamera = new Entity("chaseCameraController");
    chaseCamera.attach(ChaseCamera);
    chaseCamera.setTrackedEntity(craft);
    app.scene.addEntity(chaseCamera);

    // Wait till we're actually ready before telling the server we are
	  app.resources.onAllAssetsLoaded(function() {
      
      var username = $.cookie('username');
      var sign = $.cookie('sign');

      server.sendMessage('ready', {
        username: username,
        sign: sign
      });    

    });
  };

  self._noauth = function(data) {
     document.location = 'login.html'; 
  };

  self._destroyTarget = function(data) {

	  if(craft.getId() === data.targetid) {    

      // Remove entity from scene
		  app.scene.removeEntity(craft);
		  app.scene.removeEntity(craft.emitter);

      app.scene.withEntity(data.sourceid, function(source) {

        // Set up the camera to do the zooming out thing
        chaseCamera.setMovementDelta(0.03);
        chaseCamera.setLookAtDelta(0.03);
        chaseCamera.fixLocationAt([craft.position[0], craft.position[1] + 100, craft.position[1]]);

        setTimeout(function() {
          chaseCamera.setTrackedEntity(source);
        }, 1500);        

        setTimeout(function() {
            chaseCamera.fixLocationAt([craft.position[0], craft.position[1] + 300, craft.position[1]]);
        }, 5000);
      });

      // Disable input
		  controller.disable();   
		
	  }
	  else {
		  removeHovercraftFromScene(data.targetid);
	  }	
  };

    self._reviveTarget = function(data) {
	  if(data.id === craft.getId()) {

		  // Re-add entity to scene
		  app.scene.addEntity(craft);
		  app.scene.addEntity(craft.emitter);
		  craft.setSync(data.sync);

      // Reset camera
      chaseCamera.setMovementDelta(0.2);
      chaseCamera.setLookAtDelta(0.7);
		  chaseCamera.setTrackedEntity(craft);
      chaseCamera.unfixLocation();

      // Re-add input control
		  controller.enable();
	  }
	  else {

		  // Re-add entity to scene
		  addHovercraftToScene(data.id, data.sync);
	  }
  };  
  

  self._syncscene = function(data) {

	  for(i in data.craft) {
		  var serverCraft = data.craft[i];
		
		  var clientCraft = 
		  serverCraft.id === playerId 
					  ? craft
					  : app.scene.getEntity(serverCraft.id);

		  if(!clientCraft) {
      		clientCraft = addHovercraftToScene(serverCraft.id, serverCraft.sync);
		  }
		  clientCraft.setSync(serverCraft.sync);		
	  }

	  if(!started) {
		  started = true;
		  app.scene.addEntity(craft);
		  attachEmitterToCraft(craft);
	  }
  };

  self._sync = function(data) {
      var entity = app.scene.getEntity(data.id);

	  if(!entity) {
		  console.log('Message received to sync entity that does not exist: ' + data.id);
		  return;
	  }
      entity.setSync(data.sync);
  };

  var removeCraftEmitter = function(craft) {
    app.scene.removeEntity(craft.emitter);
  };  

  var terrain = app.scene.getEntity('terrain');
  var attachEmitterToCraft = function(craft) {
    var emitter = new ParticleEmitter(craft.getId() + 'trail', 250, app,
    {
        maxsize: 50,
        maxlifetime: 0.3,
        rate: 10,
        scatter: vec3.create([1.2, 0.001, 1.2]),
        particleOutwardVelocityMin: vec3.create([-0.9,-50.0,-0.9]),
        particleOutwardVelocityMax: vec3.create([0.9, -4.0,0.9]),
        track: function(){
            this.position = vec3.create([craft.position[0], craft.position[1] - 0.3 , craft.position[2]]);
        },
        textureName: '/data/textures/trail.png'
    });
    craft.emitter = emitter;
    app.scene.addEntity(emitter);
   };

  self._updateplayer = function(data) {
    var entity = app.scene.getEntity(data.id);
    if(!entity)
	    addHovercraftToScene(data.id, data.sync);
    else
      entity.setSync(data.sync);
  };

  self._removeplayer = function(data) {
      removeHovercraftFromScene(data.id);
  };

  var removeHovercraftFromScene = function(id) {
      app.scene.withEntity(id, function(craftToRemove) {
        removeCraftEmitter(craftToRemove);
        app.scene.removeEntity(craftToRemove);
      });
  };

  var addHovercraftToScene = function(id, sync) {
      var craftToAdd = hovercraftFactory.create(id);
	    craftToAdd.attach(Smoother);
      craftToAdd.setSync(sync);
      app.scene.addEntity(craftToAdd);
      attachEmitterToCraft(craftToAdd);
	    return craftToAdd;
  };
};

