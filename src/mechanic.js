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
  var settings = this.getSettings();
  var packet = {};
  var scene = this.getScene();
  var isWorker = false; //utils.isBrowserWorker();
  var objects = this.getObject();
  var _this = this;

  //pack position and rotation to send from worker to window
  function packPhysics(objs, pkt) {
    if (objs.system) {
      if (!pkt.system) pkt.system = {};
      _.each(objs.system, function (sys, id) {
        if (!pkt.system[id]) pkt.system[id] = {};
        packPhysics(sys, pkt.system[id]);
      });
    }
    if (objs.body) {
      if (!pkt.body) pkt.body = {};
      _.each(objs.body, function (body, id) {
        if (!pkt.body[id]) pkt.body[id] = {};
        if (!pkt.body[id].position) pkt.body[id].position = {};
        if (!pkt.body[id].quaternion) pkt.body[id].quaternion = {};
        pkt.body[id].position.x = body.position.x;
        pkt.body[id].position.y = body.position.y;
        pkt.body[id].position.z = body.position.z;
        pkt.body[id].quaternion.x = body.quaternion.x;
        pkt.body[id].quaternion.y = body.quaternion.y;
        pkt.body[id].quaternion.z = body.quaternion.z;
        pkt.body[id].quaternion.w = body.quaternion.w;
      });
    }
  }

  //simulation loop function, done with setTimeout
  function simulate() {
    if (scene._destroyed) return;
    //prepare next call
    scene._stid = setTimeout(simulate, 1000 / settings.simFrequency);
    //compute time since last call
    var curTime = (new Date()).getTime() / 1000;
    var dt = curTime - scene._lastTime;
    scene._lastTime = curTime;
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

    if (isWorker) {
      packPhysics(objects, packet);
      post(['transfer', packet], 'transfer physics');
    }
  }

  scene._lastTime = (new Date()).getTime() / 1000;
  //stopSimulation(); //make sure is stopped
  simulate(); //then go
};

Mecanica.prototype.startRender = function () {
  var settings = this.getSettings();
  var controller = require('./util/controller.js');
  var scene = this.getScene();
  var monitor = this.getObject('monitor', _.keys(this.objects['monitor'])[0]) || {};
  function render() {
    if (scene._destroyed) return;
    scene._rstid = setTimeout(function () {
      scene._rafid = requestAnimationFrame(render);
    }, 1000 / settings.renderFrequency);
    monitor.camera.move();
    monitor.renderer.three.render(scene.three, monitor.camera.three);
  }

  setTimeout(render, 1000 / settings.renderFrequency);
};

Mecanica.prototype.start = function () {
  this.startSimulation();
  this.startRender();
};


extend(Mecanica, System);
