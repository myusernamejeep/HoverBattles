var vec3 = require('./glmatrix').vec3;
var mat4 = require('./glmatrix').mat4;
var mat3 = require('./glmatrix').mat3;

function cloneObject(obj) {
    var clone = {};
    for(var i in obj) {
        if(typeof(obj[i])=="object")
            clone[i] = cloneObject(obj[i]);
        else
            clone[i] = obj[i];
    }
    return clone;
}

var Entity = function(id){
    this._model = null;
	this._id = id;
	this.position = vec3.create([0,0,0]);
    this.rotationY = 0;
	this._scene = null;
};

Entity.prototype.getId = function(){
	return this._id;
};

Entity.prototype.setModel = function(model) {
   this._model = model;  
};

Entity.prototype.getModel = function(){
	return this._model;
};

Entity.prototype.attach = function(component) {
    for(i in component){
        if(i == "doLogic"){
            var newLogic = component[i];
            var oldLogic = this.doLogic;
            this.doLogic = function(){
              oldLogic.call(this);
              newLogic.call(this);
            };
        }
        else {
            if(typeof component[i] == "object"){
                this[i] = cloneObject(component[i]);
            }
            else
            {
                this[i] = component[i];
            }
        }
    }
};

Entity.prototype.doLogic = function() { };

Entity.prototype.setScene = function(scene) {
	this._scene = scene;
};

Entity.prototype.render = function(context){
    if(!this._model) { return; }
	var gl = context.gl;

	var viewMatrix = this._scene.camera.getViewMatrix();
	var projectionMatrix = this._scene.camera.getProjectionMatrix();
    
	var worldMatrix = mat4.create();
    mat4.identity(worldMatrix);
    mat4.translate(worldMatrix, this.position);
    mat4.rotateY(worldMatrix, this.rotationY);
    
    var modelViewMatrix = mat4.create();
    mat4.multiply(viewMatrix, worldMatrix, modelViewMatrix);
    
    var normalMatrix = mat3.create();
    mat3.identity(normalMatrix);
    mat4.toInverseMat3(modelViewMatrix, normalMatrix);
    mat3.transpose(normalMatrix);
    
	var program = context.setActiveProgram(this._model.getProgram());
    
	this._model.upload(context);

	gl.uniformMatrix4fv(gl.getUniformLocation(program, "uProjection"), false, projectionMatrix);
	gl.uniformMatrix4fv(gl.getUniformLocation(program, "uView"), false, viewMatrix);
	gl.uniformMatrix4fv(gl.getUniformLocation(program, "uWorld"), false, worldMatrix);
    gl.uniformMatrix3fv(gl.getUniformLocation(program, "uNormalMatrix"), false, normalMatrix);

	this._model.render(context);
};

exports.Entity = Entity;
