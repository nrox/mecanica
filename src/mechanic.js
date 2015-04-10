function Mecanica(options) {
  if (!options) options = {};
  this.construct(options, this, 'main');
}

Mecanica.prototype.types = {
  main: function (options) {
    this.include(options, {
      settings: { use: {type: 'global'} },
      scene: { use: {} },
      light: { use: {} },
      system: {},
      monitor: { use: {} }
    });
    this.objects = {
      settings: {}, //preferences
      scene: {}, //three scene + ammo world
      system: {}, //high level structure of objects, identified by keys
      light: {},
      monitor: {} //set of camera + renderer
    };
    this.notifyUndefined(_.keys(this.objects));
    this.init(this.options());
  }
};

Mecanica.prototype.init = function (json) {
  var _this = this;
  //for each already key in objects, check if that type exists in json and build its contents
  _.each(_this.objects, function (groupObject, groupName) {
    groupObject = json[groupName];
    _.each(groupObject, function (objectOptions, objectId) {
      objectOptions.id = objectId;
      _this.make(groupName, objectOptions);
    });
  });

  var settings = this.getSettings();
  var scene = this.getScene();

  if (settings.axisHelper) {
    if (this.runsWebGL()) scene.three.add(new THREE.AxisHelper(settings.axisHelper));
  }

  if (_this.runsWebGL()) {
    _.each(_this.objects.light, function (light) {
      if (!light._added && (light._added = true)) {
        scene.three.add(light.three);
      }
    });
  }
  _.each(this.objects.system, function (sys) {
    sys.loadIntoScene();
  });
};

Mecanica.prototype.import = function (url, id) {
  var json = require(url);
  this.load(json, id);
};

Mecanica.prototype.load = function (json, id) {
  try {
    var sys = this.make('system', 'basic', {id: id});
    sys.loadJSON(json);
  } catch (e) {
    console.error('caught', e);
  }
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
    //_.each(this.objects.constraint, function (c) {
    //  if (c.beforeStep) c.beforeStep.call(c);
    //});
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
  var monitor = this.getObject('monitor', _.keys(this.objects['monitor'])[0]) || {};
  var _this = this;

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
