function Settings(options, system) {
  this.construct(options, system, system.isRoot() ? 'global' : 'local');
}

Settings.prototype.types = {
  global: function (options) {
    this.include(options, {
      gravity: {y: -9.81},
      wireframe: false, //show wireframes
      axisHelper: 0, //show an axis helper in the scene and all bodies
      connectorHelper: 0,
      connectorColor: 0x888822,
      canvasContainer: 'body', //container for renderer,
      uiContainer: 'body',
      reuseCanvas: true,
      webWorker: true, //use webworker if available
      autoStart: true, //auto start simulation and rendering
      simSpeed: 1, //simulation speed factor, 1 is normal, 0.5 is half, 2 is double...
      renderFrequency: 30, //frequency to render canvas
      simFrequency: 30, //frequency to run a simulation cycle,
      castShadow: true, //light cast shadows,
      shadowMapSize: 1024, //shadow map width and height,
      lengthUnits: 'cm' //cm as length unit provides a good balance between bullet/ammo characteristics and mechanical devices
    });
    this.notifyUndefined(['gravity']);
    this.assertOneOf('lengthUnits', _.keys(this.availableLengthUnits));
  },
  local: function (options) {
    this.include(options, {
      wireframe: undefined,
      axisHelper: undefined,
      connectorHelper: undefined,
      lengthUnits: undefined
    });
    this.assertOneOf('lengthUnits', _.keys(this.availableLengthUnits), undefined);
  }
};

Settings.prototype.availableLengthUnits = {
  'm': 1,
  'cm': 0.01,
  'mm': 0.001
};

Settings.prototype.availableForceUnits = {
  'N': 1,
  'Kg': 9.81
};

Settings.prototype.availableTorqueUnits = {
  'N.m': 1,
  'Kg.cm': 9.81
};

extend(Settings, Component);
Component.prototype.maker.settings = Settings;