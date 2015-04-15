function Mecanica(options) {
  if (!options) options = {};
  this.objects = {
    settings: {}, //preferences
    scene: {}, //three scene + ammo world
    system: {}, //high level structure of objects, identified by keys
    light: {},
    monitor: {} //set of camera + renderer
  };
  this.rootSystem = this;
  this.construct(options, this, 'complete');
}

Mecanica.prototype.types = {
  empty: function (options) {
    this.include(options, {});
  },
  complete: function (options) {
    this.include(options, {
      settings: undefined,
      scene: undefined,
      light: undefined,
      system: undefined,
      monitor: undefined
    });
    this.useSettings(this.settings);
    this.useScene(this.scene);

    var scene = this.getScene();

    //load all systems
    var _this = this;
    _.each(this.system, function (sys, id) {
      _this.loadSystem(sys, id);
    });
    this.useLight(this.light);

    _.each(this.objects.system, function (sys) {
      sys.addToScene(scene);
    });
  }
};

Mecanica.prototype.useSettings = function (json) {
  json = json || {};
  json.id = 'use';
  json.type = 'global';
  this.make('settings', json);
};

Mecanica.prototype.useMonitor = function (json) {
  if (this.getSome('monitor')) return;
  json = json || {};
  json.id = 'use';
  this.make('monitor', json);
};

Mecanica.prototype.useScene = function (json) {
  json = json || {};
  json.id = 'use';
  this.make('scene', json);
};

Mecanica.prototype.useLight = function (json) {
  var _this = this;
  _.each(json, function (light, id) {
    if (_this.getObject('light', id)) return;
    light = light || {};
    light.id = id;
    _this.make('light', light);
  });
};

Mecanica.prototype.startSimulation = function () {
  if (!this.runsPhysics()) return false;
  if (this._simulationRunning) return true;
  this._simulationRunning = true;
  this._physicsDataReceived = false;

  var settings = this.getSettings();
  var physicsPack = {};
  var scene = this.getScene();
  var _this = this;

  //simulation loop function, done with setTimeout
  function simulate() {
    if (scene._destroyed) return;
    //prepare next call
    _this._stid = setTimeout(simulate, 1000 / settings.simFrequency);
    //compute time since last call
    var curTime = (new Date()).getTime() / 1000;
    var dt = curTime - _this._lastTime;
    _this._lastTime = curTime;
    //callbacks beforeStep
    _this.callBeforeStep();
    //_.each(objects.method, function (m) {
    //  if (m.type == 'beforeStep') m.beforeStep.execute();
    //});
    //maxSubSteps > timeStep / fixedTimeStep
    //so, to be safe maxSubSteps = 2 * speed * 60 * dt + 2
    var maxSubSteps = ~~(2 * settings.simSpeed * 60 * dt + 2);
    if (_this.runsPhysics()) scene.ammo.stepSimulation(settings.simSpeed / settings.simFrequency, maxSubSteps);
    _this.syncPhysics();
    //_.each(objects.method, function (m) {
    //  if (m.type == 'afterStep') m.afterStep.execute();
    //});

    if (_this.runsInWorker()) {
      _this.packPhysics(physicsPack);
      post(['transfer', physicsPack], 'transfer physics');
    } else {
      _this._physicsDataReceived = true;
    }
  }

  _this._lastTime = (new Date()).getTime() / 1000;
  //stopSimulation(); //make sure is stopped
  simulate(); //then go
};

Mecanica.prototype.stopSimulation = function () {
  clearTimeout(this._stid);
  this._simulationRunning = false;
};

Mecanica.prototype.startRender = function () {

  if (!this.runsWebGL()) return false;
  if (this._renderRunning) return true;

  var settings = this.getSettings();
  var controller = require('./util/controller.js');
  var scene = this.getScene();
  this.useMonitor(this.monitor);
  var monitor = this.getSome('monitor');
  var _this = this;
  _.each(this.objects.light, function (light) {
    light.addToScene(scene);
  });


  function render() {
    if (scene._destroyed) return;
    if (!_this._renderRunning) return;
    _this._rstid = setTimeout(function () {
      _this._rafid = requestAnimationFrame(render);
    }, 1000 / settings.renderFrequency);
    if (!_this.physicsDataReceived()) return;
    monitor.camera.move();
    monitor.renderer.three.render(scene.three, monitor.camera.three);
  }

  _this._renderRunning = true;
  render();
  return true;
};

Mecanica.prototype.stopRender = function () {
  clearTimeout(this._rstid);
  this._renderRunning = false;
};

Mecanica.prototype.start = function () {
  this.startSimulation();
  this.startRender();
};

Mecanica.prototype.stop = function () {
  this.stopSimulation();
  this.stopRender();
};

Mecanica.prototype.setSpeed = function (speed) {
  this.getSettings().simSpeed = Number(speed);
};

Mecanica.prototype.physicsDataReceived = function () {
  return !!this._physicsDataReceived;
};

extend(Mecanica, System);
