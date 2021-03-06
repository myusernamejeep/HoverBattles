path = require('path');
fs = require('fs');
querystring = require('querystring');
vec3 = require('../shared/glmatrix').vec3;

exports.Chunk = function(width, height, startX, startY, scale, maxHeight) {
  var self = this;
  var heightMap = new Array(width * height);

  for(var x = 0; x < width ; x++){
		for(var y = 0; y < height; y++) {
			var terrainHeight = (Math.sin((x + startX) / 32) + Math.sin((y + startY) / 32));
			heightMap[x + (y * width)] = Math.min(1.0, (terrainHeight + 1.0) / 2) * maxHeight;			
		}
	}

  self.create = function() {
    var data = generateTerrainData();
	  return {
      heights: heightMap,
      normals: data.normals,
      vertices: data.vertices,
      indices: data.indices,
      texturecoords: data.texturecoords
	  };
  };

  var generateTerrainData = function() {
    
    var indexCount = (height - 1) * width * 2;
    var vertices = new Array(width* height * 3);
    var vertexNormals = new Array(width * height * 3);
    var texturecoords = new Array(width * height * 2);
    var colours = new Array(width * height * 4);
    var indices = new Array(indexCount);
     
    for(var y = 0 ; y < height ; y++ ) {
      for(var x = 0 ; x < width ; x++ ) {
      	var index = (x + y * width);
  
    		var vertexIndex = index * 3;
    		var colourIndex = index * 4;
    		var texcoordsIndex = index * 2;    
        	    		
    		vertices[vertexIndex] = (startX + x) * scale;
    		vertices[vertexIndex+1] = heightMap[index];
    		vertices[vertexIndex+2] = (startY + y) * scale;
            
            vertexNormals[vertexIndex] = 0.0;
    		vertexNormals[vertexIndex+1] = 0.0;
    		vertexNormals[vertexIndex+2] = 0.0;
    
    		texturecoords[texcoordsIndex] = x / width;
    		texturecoords[texcoordsIndex+1] = y / height;
  	  }
    }
    
    var topRowIndex = 0;
    var bottomRowIndex = width;
    
    var goingRight = true;
    var i = 0;
    
    // Trying to do an indexed triangle strip...
    // We go right until we reach the end of a row
    // And then come back again on the next row
    // And repeat until we run out of vertices
    while(i < indexCount)
    {
    	if(goingRight) {
    		indices[i++] = topRowIndex++;
    		indices[i++] = bottomRowIndex++;
    		
    		if(topRowIndex % width == 0){
    			goingRight = false;
    			topRowIndex = bottomRowIndex-1;
    			bottomRowIndex = topRowIndex + width;				
    		}
    	} else {
    		indices[i++] = topRowIndex--;
    		indices[i++] = bottomRowIndex--;
    
    		if((topRowIndex+1) % width == 0){
    			goingRight = true;
    			topRowIndex = bottomRowIndex+1;
    			bottomRowIndex = topRowIndex + width;				
    		}
    	}
    }	
    
    /*
    AB=B-A;
    AC=C-A;
    N=normalize(AB cross AC); */
    
    
    // Now calculate the face normals
    i = 0;
    var zeroVector = vec3.create([0,0,0]);
    while(i + 2 < indexCount) {      
        var iOne = indices[i];
        var iTwo = indices[i+1];
        var iThree = indices[i+2];
    
        var vOne = iOne * 3;
        var vTwo = iTwo * 3;
        var vThree = iThree * 3;
        
        var a = vec3.create([vertices[vOne], vertices[vOne+1], vertices[vOne+2]]);
        var b = vec3.create([vertices[vTwo], vertices[vTwo+1], vertices[vTwo+2]]);
        var c = vec3.create([vertices[vThree], vertices[vThree+1], vertices[vThree+2]]);
        
        var ab = vec3.create([0,0,0]);
        var ac = vec3.create([0,0,0]);
        var cross = vec3.create([0,0,0]);
        var normal = vec3.create([0,0,0]);
        
        vec3.subtract(a, b, ab);
        vec3.subtract(a, c, ac);
        vec3.cross(ac, ab, cross);
        vec3.normalize(cross, normal);
        
        // Cos we're doing a indexed triangle strip, it goes odd/even/odd/even
        // But to make thing worse, because we double back on ourselves this flips every row
        // Rather than do complicated logic to sort this out, it's gonna be easier to just check the y direction
        // And invert the normal for the 'odd' faces
        if(normal[1] < 0){
            vec3.negate(normal);
        }
            
        for(var x = 0; x < 3 ; x++){
            vertexNormals[vOne + x] += normal[x];
            vertexNormals[vTwo + x] +=  normal[x];
            vertexNormals[vThree + x] += normal[x];   
        }     
        
                
        i++;
    }

    return {
      normals: vertexNormals,
      vertices: vertices,
      indices: indices,
      texturecoords: texturecoords     
    };
  }; 
};
