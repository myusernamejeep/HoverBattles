var Hovercraft = require('./hovercraft').Hovercraft;

var WarningEntity = function(app, sourceid, targetid) {
  var self = this;
  var firedMissileId = null;
  var isLocked = false;
  
  self.notifyHasFired = function(missileid) {
    firedMissileId = missileid;
  };
  
  self.notifyIsLocked = function() {
    isLocked = true;
  };

  self.updateHudItem = function() {

  };
  
  self.hudItem = function(item) {
    
  };

  self.clearHud = function() {

  };
};

var TargettingEntity = function(app, sourceid, targetid) {
  var self = this;
  var scene = scene;
  var sourceid = sourceid;
  var targetid = targetid;
  var firedMissileId = null;
  var isLocked = false;
  var hudItem = null;
  var textItem = null;
  var rotation = 0;
  var isPlayer = isPlayer;
  
  self.notifyHasFired = function(missileid) {
    firedMissileId = missileid;
  };
  
  self.notifyIsLocked = function() {
    isLocked = true;
    app.overlay.removeItem(hudItem);
    hudItem = app.overlay.addItem('lock-' + sourceid, '/data/textures/locked.png');
    self.updateHudItem();
  };

  self.targetid = function() {
    return targetid;
  };
  
  self.hudItem = function(item) {
    return hudItem = item || hudItem;
  };

  self.clearHud = function() {
    if(hudItem)
       app.overlay.removeItem(hudItem);
    if(textItem)
       app.overlay.removeItem(textItem);
  };

  self.updateHudItem = function() {
   app.scene.withEntity(targetid, function(entity) {    

        var camera = app.scene.camera;

        var worldSphere = entity.getSphere();
        var transformedSphere = camera.transformSphereToScreen(worldSphere);

        var radius = transformedSphere.radius;
        var centre = transformedSphere.centre;
      
        var min = [centre[0] - radius, centre[1] - radius];
        var max = [centre[0] + radius, centre[1] + radius];

        hudItem.left(min[0]);
        hudItem.top(min[1]);
        hudItem.width(max[0] - min[0]);
        hudItem.height(max[1] - min[1]);   
        hudItem.rotation(rotation += 0.03);

        var textLeft = min[0] + (max[0] - min[0]) + 5.0;
        var textTop = min[1] - 48;

        textItem.left(textLeft);
        textItem.top(textTop);
        textItem.width(128);
        textItem.height(128);   
      });
  };

  app.scene.withEntity(targetid, function(entity) {    
    hudItem = app.overlay.addItem('track-' + sourceid, '/data/textures/targeting.png');
    textItem = app.overlay.addTextItem('text-' + sourceid, entity.displayName(), 128, 128, 'red');
  });
  
  self.updateHudItem();  
};

// TODO: Turn off when locked
// TODO: Turn into a green triangle
// TODO: Stop it rendering when behind the camera!

var OtherPlayer = function(app, entity) {
 // var hudItem = app.overlay.addItem('trace-' + entity.getId(), '/data/textures/targeting.png');
  /*
  entity.addEventHandler('tick', function() {
      var camera = app.scene.camera;

      var worldSphere = entity.getSphere();
      var transformedSphere = camera.transformSphereToScreen(worldSphere);

      if(transformedSphere[2] < 0) 
        transformedSphere.radius *= 0.1;
      var radius = transformedSphere.radius * 5.0;
      var centre = transformedSphere.centre;
    
      var min = [centre[0] - radius, centre[1] - radius];
      var max = [centre[0] + radius, centre[1] + radius];

      hudItem.left(min[0]);
      hudItem.top(min[1]);
      hudItem.width(max[0] - min[0]);
      hudItem.height(max[1] - min[1]);   
  }); */
};

exports.Hud = function(app) {
  var self = this;
  var app = app;
  var playerId = null;

  var trackedEntities = {};

  self.setPlayerId = function(id) {
    playerId = id;
  };

  var hookHovercraftEvents = function(entity) {
    if(!entity.is(Hovercraft)) return;
    entity.addEventHandler('trackingTarget', onEntityTrackingTarget);
    entity.addEventHandler('cancelledTrackingTarget', onEntityCancelledTrackingTarget);

    if(entity.getId() !== playerId)
      var tracker = new OtherPlayer(app, entity);
  };

  var unHookHovercraftEvents = function(entity) {
    if(!entity.is(Hovercraft)) return;
    clearTrackedEntity(entity.getId());
  };

 var createTrackedEntity = function(sourceid, targetid) {
   if(sourceid === playerId) {
      trackedEntities[sourceid] = new TargettingEntity(app, sourceid, targetid);
    } else if(targetid === playerId){ 
      trackedEntities[sourceid] = new WarningEntity(app, sourceid, targetid);
    }
  };    

  var clearTrackedEntity = function(sourceid) {
    var entity = trackedEntities[sourceid];
    if(entity) {
      delete trackedEntities[sourceid];
      entity.clearHud();
    }

    if(trackedEntities[playerId] && trackedEntities[playerId].targetid() === sourceid)
      clearTrackedEntity(playerId);
  };

  var onEntityTrackingTarget = function(data) {
      createTrackedEntity(this.getId(), data.target.getId());
  };

  var onEntityCancelledTrackingTarget = function(data) {
    clearTrackedEntity(this.getId());
  };

  var withTrackedEntity = function(sourceid, callback) {
    if(trackedEntities[sourceid])
      callback(trackedEntities[sourceid]);
    else {
      console.log('Something went a tad wrong as we\'re not able to find a previously tracked entity');
      console.trace();
    }
  };

  self.notifyOfMissileFiring = function(data) {
    withTrackedEntity(data.sourceid, function(trackedEntity) {
      trackedEntity.notifyHasFired(data.missidleid);
    });
  };

  self.notifyOfMissileLock = function(data) {
    withTrackedEntity(data.sourceid, function(trackedEntity) {
      trackedEntity.notifyIsLocked();
    });
  };   

  self.notifyOfMissileDestruction = function(data) {
     clearTrackedEntity(data.sourceid);
  };

  self.notifyOfLockLost = function(data) {
    clearTrackedEntity(data.sourceid);
  };

  self.notifyOfHovercraftDestruction = function(data) {
    clearTrackedEntity(data.sourceid);
  };

  var skipLogicCount = 0;
  self.doLogic = function() {

    for(var i in trackedEntities) {
      var entity = trackedEntities[i];

      // This means that we'll be able to see other players locking onto us
      entity.updateHudItem();
    }
   
  };

  app.scene.onEntityAdded(hookHovercraftEvents);
  app.scene.onEntityRemoved(unHookHovercraftEvents);
};

exports.Hud.ID = "HUDEntity";
exports.Hud.create = function(app) {
  var hudEntity = new Entity(exports.Hud.ID);
  hudEntity.attach(exports.Hud, [app]);

  app.scene.addEntity(hudEntity);
  return hudEntity;
};



