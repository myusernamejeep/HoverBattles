var vec3 = require('../thirdparty/glmatrix').vec3;
var FiringController = require('./firingcontroller').FiringController;
var Missile = require('./missile').Missile;
var Hovercraft = require('./hovercraft').Hovercraft;


exports.MissileFirer = function(app, missileFactory) {
  var self = this;

  var onEntityFiredMissile = function(data) {
    var source = app.scene.getEntity(data.sourceid);
    var target = app.scene.getEntity(data.targetid);
   
    if(!source) { console.warn('Erk, could not find source of missile firing'); return; };
    if(!target) { console.warn('Erk, could not find target of missile firing'); return; };

    var missile = missileFactory.create(data.missileid);
    missile.position = vec3.create(source.position);
    app.scene.addEntity(missile);
    missile.go(data.sourceid, data.targetid, data.antiAccuracy);
  }; 

  var onTargetHit = function(data) {
    removeMissileFromScene(data.missileid);
  };

  var onMissileExpired = function(data) {
    removeMissileFromScene(data.missileid);
  };

  var removeMissileFromScene = function(id) {
    app.scene.withEntity(id, function(missile) {
	    app.scene.removeEntity(missile);
    });	
  };  
  

  app.scene.on('fireMissile', onEntityFiredMissile);
  app.scene.on('targetHit',  onTargetHit);
  app.scene.on('missileExpired', onMissileExpired);
};

exports.MissileFirer.Type = "MissileFirer";
