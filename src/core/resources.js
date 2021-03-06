var DefaultModelLoader = require('./defaultmodelloader').DefaultModelLoader;
var DefaultTextureLoader = require('./defaulttextureloader').DefaultTextureLoader;


var ResourceManager = function(app){
    this._app = app;
    this._modelLoaders = [];
    
    this._textureLoader = null;
    
    this._textures = {};
    this._models = {};
    
    this._pendingTextureCount = 0;
    this._pendingModelCount = 0;
};

ResourceManager.prototype.getTexture = function(path){
    if(this._textures[path]) return this._textures[path];   
    
    var resources = this;
    resources._pendingTextureCount++;
    var texture = this._textureLoader.load(path, function(){
            resources._pendingTextureCount--;
            resources.registerForActivation(texture);
        });

    this._textures[path] = texture;
    return texture;    
};

ResourceManager.prototype.onAllAssetsLoaded = function(callback){
    var resources = this;
    var intervalId = setInterval(function(){      
      if( resources._pendingTextureCount == 0 &&
          resources._pendingModelCount == 0)
      {          
        clearInterval(intervalId);
        callback();
      }      
  }, 100);
    
};

ResourceManager.prototype.setTextureLoader = function(loader){
  this._textureLoader = loader;
};

ResourceManager.prototype.addModelLoader = function(loader) {
  this._modelLoaders.push(loader);  
};

ResourceManager.prototype.registerForActivation = function(resource) {
    if(this._app.context)
        resource.activate(this._app.context);
};

ResourceManager.prototype.getModel = function(path) {
    if(this._models[path]) return this._models[path];
    var resources = this;
    for(var i in this._modelLoaders){
        var loader = this._modelLoaders[i];
        if(loader.handles(path)){
            resources._pendingModelCount++;
            var model = loader.load(path, function() {
                  resources._pendingModelCount--;
                  resources.registerForActivation(model);  
                });
            this._models[path] = model;
            return model;
        }
    }
};

exports.ResourceManager = ResourceManager;
