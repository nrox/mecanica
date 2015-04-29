function Settings(options, system) {
  this.construct(options, system, system.isRoot() ? 'global' : 'local');
}

Settings.prototype.types = {
  global: function (options) {
    this.include(options, {
      lengthUnits: 'm', //cm as length unit provides a good balance between bullet/ammo characteristics and mechanical devices
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
      shadowMapSize: 1024 //shadow map width and height,
    });
    this.assertOneOf('lengthUnits', _.keys(this.CONVERSION.LENGTH));
  },
  local: function (options) {
    this.include(options, {
      wireframe: undefined,
      axisHelper: undefined,
      connectorHelper: undefined,
      lengthUnits: undefined
    });
    this.assertOneOf('lengthUnits', _.keys(this.CONVERSION.LENGTH), undefined);
  }
};


Settings.prototype.toJSON = function () {
  var json = utils.deepCopy(this._options);
  delete json.id;
  delete json.group;
  //lengths are converted on Component.construct, so this system is already converted to root units
  json.lengthUnits = this.rootSystem.globalSettings().lengthUnits;
  return json;
};

extend(Settings, Component);
Component.prototype.maker.settings = Settings;