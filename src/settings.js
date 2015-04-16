function Settings(options, system) {
  this.construct(options, system, 'global');
}

Settings.prototype.types = {
  global: function(options){
    this.include(options, {
      wireframe: false, //show wireframes
      axisHelper: 0, //show an axis helper in the scene and all bodies
      connectorHelper: 0,
      canvasContainer: 'body', //container for renderer,
      uiContainer: 'body',
      reuseCanvas: true,
      webWorker: true, //use webworker if available
      autoStart: true, //auto start simulation and rendering
      simSpeed: 1, //simulation speed factor, 1 is normal, 0.5 is half, 2 is double...
      renderFrequency: 30, //frequency to render canvas
      simFrequency: 30, //frequency to run a simulation cycle,
      castShadow: true, //light cast shadows,
      shadowMapSize: 1024 //shadow map width and height
    });
  },
  local: function(options){
    this.include(options, {
      wireframe: false, //show wireframes
      axisHelper: 0, //show an axis helper
      connectorHelper: 0
    });
  }
};

extend(Settings, Component);
Component.prototype.maker.settings = Settings;