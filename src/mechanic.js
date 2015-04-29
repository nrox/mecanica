function Mecanica(options) {
  if (!options) options = {};

  if (options.runsPhysics !== undefined) {
    Component.prototype.RUNS_PHYSICS = !!options.runsPhysics;
  }

  this.objects = {
    settings: {}, //preferences
    scene: {}, //three scene + ammo world
    system: {}, //high level structure of objects, identified by keys
    light: {},
    monitor: {}, //set of camera + renderer
    method: {}
  };
  this.rootSystem = this;
  if (this.runsPhysics()) this.ammoTransform = new Ammo.btTransform;
  this.construct(options, this, 'empty');
}

Mecanica.prototype.types = {
  empty: function (options) {
    this.include(options, {
      id: 'root'
    });
  }
};

Mecanica.prototype.isRoot = function () {
  return true;
};

Mecanica.prototype.useMonitor = function (json) {
  if (this.getSome('monitor')) return;
  json = json || {};
  json.id = 'use';
  this.make('monitor', json);
};

Mecanica.prototype.startSimulation = function () {
  if (!this.runsPhysics()) return false;
  if (this._simulationRunning) return true;
  this._simulationRunning = true;
  this._physicsDataReceived = false;

  var settings = this.getSettings();
  this.physicsPack = {};
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
    _this._totalTime += dt * settings.simSpeed;
    _this._lastTime = curTime;

    _this.callBeforeStep();

    //maxSubSteps > timeStep / fixedTimeStep
    //so, to be safe maxSubSteps = 2 * speed * 60 * dt + 2
    var maxSubSteps = ~~(2 * settings.simSpeed * 60 * dt + 2);
    if (_this.runsPhysics()) scene.ammo.stepSimulation(settings.simSpeed / settings.simFrequency, maxSubSteps);

    _this.syncPhysics();

    _this.callAfterStep();

    if (utils.isBrowserWorker() || utils.isNode()) {
      _this.packPhysics(_this.physicsPack);
      _this.physicsPack.time = _this._totalTime;
    }
    _this._physicsDataReceived = true;

  }

  _this._totalTime = _this._totalTime || 0;
  _this._lastTime = (new Date()).getTime() / 1000;
  //stopSimulation(); //make sure is stopped
  simulate(); //then go
};

Mecanica.prototype.stopSimulation = function () {
  clearTimeout(this._stid);
  this._simulationRunning = false;
};

Mecanica.prototype.startRender = function () {

  if (!this.runsRender()) return false;
  if (this._renderRunning) return true;

  var settings = this.getSettings();
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
  if (!this.runsRender()) return;
  clearTimeout(this._rstid);
  cancelAnimationFrame(this._rafid);
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

Mecanica.prototype.physicsDataReceived = function (arg) {
  if (arg !== undefined) this._physicsDataReceived = !!arg;
  return !!this._physicsDataReceived;
};

Mecanica.prototype.isSimulationRunning = function () {
  return !!this._simulationRunning;
};

extend(Mecanica, System);
