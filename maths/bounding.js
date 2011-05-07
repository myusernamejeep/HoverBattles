vec3 = require('../shared/glmatrix').vec3;

var Sphere = function(radius, centre) {
  this.radius = radius;
  this.centre = centre;
};

var Box = function(min, max) {
    this.min = min;
    this.max = max;
};

Sphere.Create = function(vertices, box) {
   var centre = vec3.create([0,0,0]);
   centre[0] = (box.min[0] + box.max[0]) / 2.0;
   centre[1] = (box.min[1] + box.max[1]) / 2.0;
   centre[2] = (box.min[2] + box.max[2]) / 2.0;
   
   var radiusSquared = 0.0;
   
  for(var i = 0 ; i < vertices.length / 3 ; i++){
    var index = i * 3;
    var difference = 
        [   vertices[index] - centre[0], 
            vertices[index+1] - centre[1],
            vertices[index+2] - centre[2]
        ];
    var magnitudeSquared =  difference[0] * difference[0] + 
                            difference[1] * difference[1] +
                            difference[2] * difference[2];
                            
    if(radiusSquared < magnitudeSquared) radiusSquared = magnitudeSquared;
  }   
    
  return new Sphere(Math.sqrt(radiusSquared), centre);    
};

Box.Create = function(vertices) {   
    var min = vec3.create([999,999,999]);
    var max = vec3.create([-999,-999,-999]);
   for(var i = 0 ; i < vertices.length / 3 ; i++){
       var index = i * 3;
       
       min[0] = Math.min(vertices[index], min[0]);
       min[1] = Math.min(vertices[index+1], min[1]);
       min[2] = Math.min(vertices[index+2], min[2]);
       
       max[0] = Math.max(vertices[index], max[0]);
       max[1] = Math.max(vertices[index+1], max[1]);
       max[2] = Math.max(vertices[index+2], max[2]);       
   }   
  return new Box(min, max);  
};

exports.Box = Box;
exports.Sphere = Sphere;