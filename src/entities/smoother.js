var vec3 = require('../thirdparty/glmatrix').vec3;

var Smoother = function() {
  var self = this;
  self.hasInitialState = false;
	
	var oldpositionDelta = vec3.create([0,0,0]);
	var networkpositionDelta = vec3.create([0,0,0]);
	
	var smoothPositionOfEntity = function() {
	  
		vec3.subtract(self.position, self.oldposition, oldpositionDelta);
  	vec3.add(self.networkposition, oldpositionDelta);
    vec3.lerp(self.position, self.networkposition, 0.007);
	};
	
	var smoothRotationOfEntity = function() {
	  if(self.networkrotationY === undefined) return;
	  
		var oldrotationDelta = self.rotationY - self.oldrotationy;	
		self.networkrotationY += oldrotationDelta;
			
		var networkrotationDelta = self.networkrotationY - self.rotationY;
		networkrotationDelta *= 0.025;
		
		self.rotationY += networkrotationDelta;
	};
	
	self.doLogic = function() {
		if(!self.hasInitialState) return;

    smoothPositionOfEntity();
		smoothRotationOfEntity();

    vec3.set(self.position, self.oldposition);
		self.oldrotationy = self.rotationY;		
		        
    // If we nearly fall off the edge of the world and the client thinks we survived
    // The terrain clipping behaviour will get in the way of smoothing, so let's force it    
    var differenceBetweenVerticals = self.position[1] - self.networkposition[1];
    
    if(differenceBetweenVerticals > 5 && self.networkposition[1] < -5)
      self.position[1] = self.networkposition[1];
		

	};

	self.setSync = function(sync) {
    if(!self.hasInitialState || sync.force) {
	  		self.position = sync.position;
	  		self.rotationY = sync.rotationY;
	  	  self.oldposition = vec3.create(self.position);
	      self.oldrotationy = self.rotationY; 
			  self.hasInitialState = true;
		}

	  self.networkposition = sync.position;
	  self.networkrotationY = sync.rotationY;
	};
};
Smoother.Type = "Smoother";
exports.Smoother = Smoother;
