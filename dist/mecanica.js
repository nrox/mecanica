(function(){
'use strict';


;// src/component.js begins

/**
 * component.js
 * super class
 */


var _ = require('./lib/underscore.js');
var ammoHelper = require('./lib/ammo.js');
var utils = require('../dist/utils.js');

var UNDEFINED = undefined;
var RUNS_PHYSICS = true;
var RUNS_RENDER = !utils.isNode();

var Ammo, THREE, jQuery;

if (RUNS_PHYSICS) {
  Ammo = ammoHelper;
}

if (RUNS_RENDER) {
  THREE = require('./lib/three.js');
  jQuery = require('./lib/jquery.js');
}

function extend(target, source) {
  _.defaults(target.prototype, source.prototype);
}

function Component() {
}

Component.prototype.runsPhysics = function () {
  if (this.rootSystem) return this.rootSystem.runsPhysics();
  return RUNS_PHYSICS;
};

Component.prototype.runsRender = function () {
  if (this.rootSystem) return this.rootSystem.runsRender();
  return RUNS_RENDER;
};

Component.prototype.runsInWorker = function () {
  return utils.isBrowserWorker();
};

Component.prototype.include = function (options, defaults) {
  var target = this;
  //target._originalOptions = options;
  options = _.extend(defaults, _.pick(options || {}, _.keys(defaults), [
    'id', 'group', 'type', 'debug', 'comment', 'lengthUnits'
  ]));
  _.extend(target, options);
  if (!target._options) target._options = {};
  _.defaults(target._options, options);
  return options;
};

Component.prototype.options = function () {
  return this._options;
};

Component.prototype.optionsWithoutId = function () {
  return _.omit(this._options, 'id');
};

Component.prototype.hasUndefined = function (keys) {
  var obj = this;
  if (!keys) keys = _.keys(obj._options);
  return _.some(keys, function (key) {
    return obj._options[key] === UNDEFINED;
  });
};

Component.prototype.notifyUndefined = function (keys) {
  var obj = this;
  if (this.hasUndefined(keys)) {
    console.error('object has undefined values:');
    console.warn(keys);
    console.warn(JSON.stringify(obj._options,
      function (k, v) {
        return v === undefined ? null : v;
      }, ' '));
    return true;
  }
  return false;
};

Component.prototype.assertOneOf = function (key, values, allowAlso) {
  if ((arguments.length === 3) && (this[key] === allowAlso)) return;
  if (values.indexOf(this[key]) < 0) {
    var msg = 'in ' + this.id + '.' + key + ' = ' + this[key] + ' but should be one of' + utils.stringify(values);
    console.log(msg);
    throw new Error(msg);
  }
};

Component.prototype.nextId = (function () {
  var index = 0;
  return function (prefix) {
    //use == here, never === because null values should be handled the same way
    if (prefix == undefined) {
      prefix = 'id';
    }
    return prefix + index++;
  };
})();

Component.prototype.construct = function (options, system, defaultType) {
  if (!options) options = {};
  if (!this.types[options.type]) options.type = defaultType;
  var cons = this.types[options.type];
  this.parentSystem = system;
  this.rootSystem = system.rootSystem;
  try {
    cons.call(this, options, system);
  } catch (e) {
    console.log('...................');
    console.log('error in Component.construct ', utils.argList(arguments));
    console.log(e.message);
    console.log(options);
    console.log(this);
    console.log('...................');
    throw e;
  }
};

Component.prototype.isRoot = function () {
  return false;
};

Component.prototype.types = {};

Component.prototype.maker = {};

Component.prototype.getSettings = function () {
  return this.globalSettings();
};

Component.prototype.globalSettings = function () {
  try {
    if (!this.rootSystem) return {};
    return this.rootSystem.getObject('settings', _.keys(this.rootSystem.objects['settings'])[0]) || {};
  } catch (e) {
    console.log('in globalSettings in ', this.group, this.id);
    console.log(e.message);
    throw e;
  }
};

Component.prototype.localSettings = function () {
  try {
    return this.parentSystem.getObject('settings', _.keys(this.parentSystem.objects['settings'])[0]) || {};
  } catch (e) {
    console.log('in globalSettings in ', this.group, this.id);
    console.log(e.message);
    throw e;
  }
};

Component.prototype.settingsFor = function (key) {
  var local = this.localSettings()[key];
  if (local !== undefined) {
    return local;
  } else {
    return this.globalSettings()[key];
  }
};

Component.prototype.getScene = function () {
  return this.rootSystem.getObject('scene', _.keys(this.objects['scene'])[0]);
};

Component.prototype.CONVERSION = {
  LENGTH: {
    'm': 1,
    'dm': 0.1,
    'in': 0.0254,
    'cm': 0.01,
    'mm': 0.001
  },
  FORCE: {
    'N': 1,
    'Kg': 9.81
  },
  TORQUE: {
    'N.m': 1,
    'Kg.m': 9.81,
    'Kg.cm': 9.81 / 100,
    'N.cm': 0.01
  }
};

Component.prototype.conversionRate = function (type, settingsProperty) {
  //TODO memoize
  var globalUnit = this.globalSettings()[settingsProperty];
  var localUnit = this[settingsProperty] || this.localSettings()[settingsProperty];
  if (globalUnit === localUnit) return 1;
  if (localUnit === undefined) return 1; //FIXME search parent ?
  return this.CONVERSION[type][localUnit] / this.CONVERSION[type][globalUnit];
};

Component.prototype.applyConversionRate = function (type, settingsProperty, target, rate) {
  rate = rate || this.conversionRate(type, settingsProperty);
  if (rate == 1) return target;
  //vectors
  if (target instanceof Vector) return target.setScale(rate);
  //numbers
  if (typeof(target) === 'number') return target * rate;
  //this numeric properties
  if ((typeof(target) === 'string') && (typeof(this[target]) === 'number')) return this[target] *= rate;
  //an array of objects: works just with properties and vectors, not useful with numbers
  if (target instanceof Array) {
    for (var i = 0; i < target.length; i++) target[i] = this.applyConversionRate(null, null, target[i], rate);
    return target;
  }
  return target;
};

Component.prototype.applyLengthConversionRate = function (target, rate) {
  return this.applyConversionRate('LENGTH', 'lengthUnits', target, rate);
};

Component.prototype.applyForceConversionRate = function (target, rate) {
  return this.applyConversionRate('FORCE', 'forceUnits', target, rate);
};

Component.prototype.applyTorqueConversionRate = function (target, rate) {
  return this.applyConversionRate('TORQUE', 'torqueUnits', target, rate);
};


Component.prototype.addPhysicsMethod = function (funName, reference) {
  if (this.runsPhysics()) {
    this[funName] = reference;
  } else {
    //let it be executed in worker
    this[funName] = function () {
      post(['execMethod', [this.group, this.id], funName, utils.argList(arguments) ]);
    }
  }
};

Component.prototype.addRenderMethod = function (funName, reference) {
  if (this.runsRender()) {
    this[funName] = reference;
  }
};

Component.prototype.toJSON = function () {
  var json = utils.deepCopy(this._options);
  delete json.id;
  delete json.group;
  return json;
};

Component.prototype.destroy = function () {
  try {
    if (this.ammo) Ammo.destroy(this.ammo);
  } catch (e) {
    console.log(this.group, this.id, e.message || e);
    throw e;
  }
};



// src/component.js ends

;// src/settings.js begins

function Settings(options, system) {
  this.construct(options, system, system.isRoot() ? 'global' : 'local');
}

Settings.prototype.types = {
  global: function (options) {
    this.include(options, {
      lengthUnits: 'm', //cm as length unit provides a good balance between bullet/ammo characteristics and mechanical devices
      wireframe: false, //show wireframes
      axisHelper: false, //show an axis helper in the scene and all bodies
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
      freeze: false //if override objects mass with 0
    });
    this.assertOneOf('lengthUnits', _.keys(this.CONVERSION.LENGTH));
  },
  local: function (options) {
    this.include(options, {
      wireframe: undefined,
      axisHelper: undefined,
      connectorHelper: undefined,
      lengthUnits: undefined,
      freeze: false
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
// src/settings.js ends

;// src/system.js begins

function System(options, system) {
  this.objects = {
    settings: {},
    shape: {}, //sphere, box, cylinder, cone ...
    material: {}, //basic, phong, lambert ? ...
    body: {}, //shape + mesh
    system: {}, //high level structure of objects, identified by keys
    constraint: {}, //point, slider, hinge ...
    method: {} //methods available to the system
  };
  this.construct(options, system, 'basic');
}

System.prototype.types = {
  //base and axis are specified in local coordinates
  basic: function (options) {
    this.include(options, {
      position: undefined,
      rotation: undefined
    });
    this.buildSystemPosition(options);
    this.load(options);
  },
  imported: function (options) {
    this.include(options, {
      url: undefined,
      position: undefined,
      rotation: undefined,
      importOptions: {}
    });
    this.notifyUndefined(['url']);
    this.buildSystemPosition(options);
    this.import(this.url, this.importOptions);
  },
  loaded: function (options) {
    this.include(options, {
      position: undefined,
      rotation: undefined,
      json: {}
    });
    this.buildSystemPosition(options);
    this.load(this.json);
  }
};

System.prototype.buildSystemPosition = function (options) {
  if (this.runsPhysics() && (this.rotation || this.position)) {
    this.quaternion = new Quaternion(this.rotation || this.quaternion || {w: 1});
    this.position = new Vector(options.position || {});
    //TODO check if this should be done with reference to local settings not from parent
    this.applyLengthConversionRate(this.position);
    this.ammoTransform = new Ammo.btTransform(this.quaternion.ammo, this.position.ammo);
  }
};

System.prototype.applyTransform = function (ammoTransform) {
  //FIXME: not working properly, just works for 1 level
  if (this.isRoot() || !this.ammoTransform) return;
  ammoTransform.mult(this.ammoTransform, ammoTransform);
  this.parentSystem.applyTransform(ammoTransform);
};

/**
 * arguments for this function are keys leading to the deep nested element in object
 * we want to retrieve (by reference)
 * example0: getObject()
 * return all objects
 * example1: getObject('body')
 * return a map with all bodies
 * example2: getObject('body','bodyId1')
 * return body with id bodyId1
 * example3: getObject('body','bodyId1', 'connector', 'connectorId1')
 * return connector with id connectorId1 in body with id bodyId1
 * @returns {*}
 */
System.prototype.getObject = function () {
  try {
    var arg0 = arguments[0];
    if (arg0 instanceof Array) {
      return this.getObject.apply(this, arg0);
    }
    if ((typeof arg0 == 'object') && arg0.group && arg0.id) {
      var sys = this;
      if (arg0.system) {
        if (typeof arg0.system == 'string') arg0.system = [arg0.system];
        for (var s = 0; s < arg0.system.length; s++) {
          sys = sys.getSystem(arg0.system[s]);
        }
      }
      return sys.getObject(arg0.group, arg0.id);
    }
    var obj = this.objects;
    for (var i = 0; i < arguments.length; i++) {
      if ((obj instanceof System) || (obj instanceof Mecanica)) {
        obj = obj.objects[arguments[i]];
      } else {
        obj = obj[arguments[i]];
      }
      if (!obj) break;
    }
    return obj;
  } catch (e) {
    console.log('error in system.', this.id, '.geObject with arguments', arguments);
    throw e;
  }
};

System.prototype.getSome = function (group) {
  var obj = this.getObject(group);
  return obj[_.keys(obj)[0]];
};

System.prototype.getSystem = function (id) {
  if (id == '.') return this;
  if (id == '..') return this.parentSystem;
  return this.getObject('system', id);
};

System.prototype.getBody = function (idOrMap) {
  return this.getObjectOfGroup('body', idOrMap);
};

System.prototype.getConstraint = function (idOrMap) {
  return this.getObjectOfGroup('constraint', idOrMap);
};

System.prototype.getObjectOfGroup = function (group, idOrMap) {
  if (typeof idOrMap == 'string') {
    idOrMap = {id: idOrMap};
  }
  idOrMap.group = group;
  idOrMap.system = idOrMap.system || [];
  return this.getObject(idOrMap);
};

/**
 * create objects using templates in constructor
 * usage:
 * make(group, type, options)
 * make(group, options) //options should have a type property
 * make(options) //options should have a group and type properties
 * example:
 * make('shape','box',{dx: 2, dy: 4, dz:3}) will return a box with those dimensions
 * make({group:'shape', type:'box', dx: 2, dy: 4, dz:3}) returns an identical object
 * @returns {object}
 */
System.prototype.make = function () {
  //TODO make this better
  var group, type, options;
  switch (arguments.length) {
    case 3:
      options = arguments[2];
      group = arguments[0];
      type = arguments[1];
      break;
    case 2:
      options = arguments[1];
      group = arguments[0];
      type = options.type;
      break;
    case 1:
      options = arguments[0];
      group = options.group;
      type = options.type;
      break;
  }
  if (!group) {
    console.log('make', utils.argList(arguments));
    throw new Error('group is not defined');
  }
  var cons = this.maker[group];
  var obj;
  if (typeof cons == 'function') {
    if (typeof(options) != 'object') options = {};
    if (!options.id) options.id = this.nextId(type);
    options.group = group;
    options.type = type;
    if (options.skip) {
      if (this.debug) console.warn('skip', group, options.id);
      return undefined;
    } else {
      if (this.debug) console.log('make ', group, options.id);
    }
    try {
      obj = new cons(options, this);
      if (!options._dontSave && this.objects[group]) {
        if (this.objects[group][obj.id]) throw group + '.' + obj.id + ' already exists';
        this.objects[group][obj.id] = obj;
      }
    } catch (e) {
      console.log(e.message);
      console.log('in system', this.id, '    during make ', group, options.id, '   with options:');
      console.log(options);
      throw e;
    }
  } else {
    console.log(JSON.stringify(arguments));
    throw new Error('incapable of making object');
  }
  return obj;
};


System.prototype.import = function (url, options) {
  try {
    var json = require(url).getObject(options);
    this.load(json);
  } catch (e) {
    console.log('in System.import: ' + url);
    console.log(e.message);
    throw e;
  }
};

System.prototype.load = function (json) {
  var _this = this;
  _.each(_this.objects, function (groupObject, groupName) {
    groupObject = json[groupName];
    _.each(groupObject, function (objectOptions, objectId) {
      objectOptions.id = objectId;
      _this.make(groupName, objectOptions);
    });
  });
};

System.prototype.importSystem = function (url, id, options) {
  try {
    console.log('System.importSystem: ' + id + ' @ ' + url);
    var json = require(url).getObject(options);
    return this.loadSystem(json, id);
  } catch (e) {
    console.log('in System.importSystem: ' + id + ' @ ' + url);
    console.log(e.message);
    throw e;
  }
};

System.prototype.loadSystem = function (json, id) {
  try {
    json = json || {};
    json.id = id;
    return this.make('system', json);
  } catch (e) {
    console.log('in System.loadSystem: ' + id);
    console.log(e.message);
    throw e;
  }
};

System.prototype.destroy = function (scene) {
  if (!scene) scene = this.rootSystem.getScene();
  _.each(_.keys(this.objects).reverse(), function (groupName) {
    var groupObjects = this.objects[groupName];
    _.each(groupObjects, function (obj, key) {
      obj.destroy(scene);
      delete groupObjects[key];
    });
  }, this);
  try {
    if (this.ammoTransform) {
      Ammo.destroy(this.ammoTransform);
      delete this.ammoTransform;
    }
    if (!this.isRoot()) {
      delete this.parentSystem.objects['system'][this.id];
    }
  } catch (e) {
    console.log(this.group, this.id, e.message || e);
    throw e;
  }
};

System.prototype.addToScene = function (scene) {
  if (!scene) scene = this.rootSystem.getScene();
  _.each(this.objects.system, function (sys) {
    sys.addToScene(scene);
  });
  _.each(this.objects.body, function (body) {
    body.addToScene(scene);
  });
  _.each(this.objects.constraint, function (cons) {
    cons.addToScene(scene);
  });
};

System.prototype.syncPhysics = function () {
  //sync all bodies
  _.each(this.objects.body, function (body) {
    body.syncPhysics();
  });
  //and all child systems
  _.each(this.objects.system, function (system) {
    system.syncPhysics();
  });
};

System.prototype.toJSON = function () {
  var json = {};
  _.each(this.objects, function (groupObjects, groupName) {
    _.each(groupObjects, function (object, objectId) {
      if (!json[groupName]) json[groupName] = {};
      json[groupName][objectId] = object.toJSON();
    });
  });
  //no need to set position and rotation as the system is already transformed
  return json;
};

/**
 * update myPack with all subsystems and bodies position and rotation
 * @param myPack
 */
System.prototype.packPhysics = function (myPack) {

  //for each body
  if (!myPack.body) myPack.body = {};
  _.each(this.objects.body, function (body, id) {
    if (!myPack.body[id]) myPack.body[id] = {};
    body.packPhysics(myPack.body[id]);
  });

  //for each child system
  if (!myPack.system) myPack.system = {};
  _.each(this.objects.system, function (sys, id) {
    if (!myPack.system[id]) myPack.system[id] = {};
    sys.packPhysics(myPack.system[id]);
  });
};

System.prototype.unpackPhysics = function (myPack) {

  _.each(this.objects.body, function (body, id) {
    body.unpackPhysics(myPack.body[id]);
  });

  _.each(this.objects.system, function (sys, id) {
    sys.unpackPhysics(myPack.system[id]);
  });
};

System.prototype.callBeforeStep = function () {
  _.each(this.objects.system, function (s) {
    s.callBeforeStep();
  });
  _.each(this.objects.constraint, function (c) {
    if (c.beforeStep) {
      c.beforeStep();
    }
  });
  if (this.beforeStep) {
    this.beforeStep();
  }
};

System.prototype.callAfterStep = function () {
  _.each(this.objects.system, function (s) {
    s.callAfterStep();
  });
  _.each(this.objects.constraint, function (c) {
    if (c.afterStep) {
      c.afterStep();
    }
  });
  if (this.afterStep) {
    this.afterStep();
  }
};

extend(System, Component);
Component.prototype.maker.system = System;
// src/system.js ends

;// src/mechanic.js begins

function Mecanica(options) {
  if (!options) options = {};

  if (options.runsPhysics !== undefined) {
    RUNS_PHYSICS = !!options.runsPhysics;
    this.RUNS_PHYSICS = RUNS_PHYSICS;
  }

  if (options.runsRender !== undefined) {
    RUNS_RENDER = !!options.runsRender;
    this.RUNS_RENDER = RUNS_RENDER;
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
      id: 'root',
      useDefaults: false
    });
    if (this.useDefaults) this.makeDefaults(this.useDefaults);
  },
  complete: function (options) {
    this.id = 'root';
    this.load(options);
  }
};


Mecanica.prototype.runsPhysics = function () {
  if (this.RUNS_PHYSICS !== undefined) return this.RUNS_PHYSICS;
  return RUNS_PHYSICS;
};

Mecanica.prototype.runsRender = function () {
  if (this.RUNS_RENDER !== undefined) return this.RUNS_RENDER;
  return RUNS_RENDER;
};


Mecanica.prototype.makeDefaults = function (options) {
  if (typeof options !== 'object') options = {};
  options.cameraDistance = options.cameraDistance || 20;
  var defaults = {
    settings: {
      global: {
        uiContainer: options.uiContainer || '#triggers',
        canvasContainer: options.canvasContainer || '#container',
        axisHelper: options.axisHelper !== undefined ? options.axisHelper : true,
        connectorHelper: options.connectorHelper !== undefined ? options.connectorHelper : 0.75,
        wireframe: !!options.wireframe
      }
    },
    scene: {
      use: {
        solver: 'pgs'
      }
    },
    light: {
      l1: {position: {x: options.cameraDistance, z: -options.cameraDistance}},
      l2: {position: {x: -1.3 * options.cameraDistance, y: options.cameraDistance * 1.1}, color: options.color2},
      l3: {position: {y: -options.cameraDistance, z: options.cameraDistance / 5}, color: options.color3}
    },
    monitor: {
      use: {
        camera: 'satellite',
        lookAt: {},
        axis: {x: 5, y: 7, z: 10},
        distance: options.cameraDistance
      }
    }
  };
  this.load(defaults);
};

Mecanica.prototype.useMonitor = function (json) {
  if (this.getSome('monitor')) return;
  json = json || {};
  json.id = 'use';
  this.make('monitor', json);
};

Mecanica.prototype.isRoot = function () {
  return true;
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
    var fixedTimeFrequency = 240;
    var maxSubSteps = ~~(2 * settings.simSpeed * fixedTimeFrequency * dt + 2);
    if (_this.runsPhysics()) scene.ammo.stepSimulation(settings.simSpeed / settings.simFrequency, maxSubSteps, 1 / fixedTimeFrequency);

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

// src/mechanic.js ends

;// src/method.js begins

function Method(options, system) {
  this.construct(options, system, 'extended');
}

Method.prototype.types = {
  extended: function (options) {
    this.include(options, {
      method: undefined
    });
    this.notifyUndefined(['method']);
    if (typeof this.method == 'string') {
      this.method = eval('(' + this.method + ')');
    }
    if (typeof this.method == 'function') {
      this.parentSystem[this.id] = this.method;
    }
  }
};

Method.prototype.toJSON = function () {
  var json = utils.deepCopy(this._options);
  json.method = "" + this.method;
  delete json.id;
  delete json.group;
  return json;
};

Method.prototype.destroy = function () {
  try {
    delete this.parentSystem[this.id];
  } catch (e) {
    console.log(this.group, this.id, e.message || e);
    throw e;
  }
};


extend(Method, Component);
Component.prototype.maker.method = Method;

// src/method.js ends

;// src/vector.js begins

function Vector(options) {
  this.include(options, {
    x: 0, y: 0, z: 0, scale: undefined
  });
  if (this.runsPhysics()) this.ammo = new Ammo.btVector3(this.x, this.y, this.z);
  if (this.runsRender()) this.three = new THREE.Vector3(this.x, this.y, this.z);
  if (this.scale) this.setScale(this.scale);

}

Vector.prototype.fromAmmo = function (ammoVector) {
  var options = {};
  options.x = ammoVector.x();
  options.y = ammoVector.y();
  options.z = ammoVector.z();
  return new Vector(options);
};

Vector.prototype.copyFromAmmo = function (ammoVector) {
  this.x = ammoVector.x();
  this.y = ammoVector.y();
  this.z = ammoVector.z();
  if (this.runsPhysics()) {
    this.ammo.setValue(this.x, this.y, this.z);
  }
  if (this.runsRender()) {
    this.three.set(this.x, this.y, this.z);
  }
  return this;
};

Vector.prototype.add = function (v) {
  if (this.ammo && v.ammo) this.ammo.op_add(v.ammo);
  if (this.three && v.three) this.three.add(v.three);
  return this;
};

Vector.prototype.setScale = function (scale) {
  if (this.ammo) this.ammo.op_mul(scale);
  if (this.three) this.three.multiplyScalar(scale);
  this.x *= scale;
  this.y *= scale;
  this.z *= scale;
  return this;
};

Vector.prototype.destroy = function () {
  if (this.ammo) Ammo.destroy(this.ammo);
};

Vector.prototype.toJSON = function () {
  //don't include scale, because it's already scaled
  return {x: this.x, y: this.y, z: this.z};
};

function Quaternion(options) {
  this.include(options, {
    x: 0, y: 0, z: 0, w: undefined
  });
  if (this.w === undefined) {
    //XYZ order
    var c1 = Math.cos(this.x / 2), c2 = Math.cos(this.y / 2), c3 = Math.cos(this.z / 2);
    var s1 = Math.sin(this.x / 2), s2 = Math.sin(this.y / 2), s3 = Math.sin(this.z / 2);
    this.x = s1 * c2 * c3 + c1 * s2 * s3;
    this.y = c1 * s2 * c3 - s1 * c2 * s3;
    this.z = c1 * c2 * s3 + s1 * s2 * c3;
    this.w = c1 * c2 * c3 - s1 * s2 * s3;
  }
  if (this.runsPhysics()) {
    this.ammo = new Ammo.btQuaternion(this.x, this.y, this.z, this.w);
  }
  if (this.runsRender()) {
    this.three = new THREE.Quaternion(this.x, this.y, this.z, this.w);
  }
}

Quaternion.prototype.fromAmmo = function (ammoVector) {
  var options = {};
  options.x = ammoVector.x();
  options.y = ammoVector.y();
  options.z = ammoVector.z();
  options.w = ammoVector.w();
  return new Quaternion(options);
};

Quaternion.prototype.copyFromAmmo = function (ammoVector) {
  this.x = ammoVector.x();
  this.y = ammoVector.y();
  this.z = ammoVector.z();
  this.w = ammoVector.w();
  if (this.runsPhysics()) {
    this.ammo.setValue(this.x, this.y, this.z, this.w);
  }
  if (this.runsRender()) {
    this.three.set(this.x, this.y, this.z, this.w);
  }
  return this;
};

Quaternion.prototype.multiply = function (v) {
  if (this.ammo && v.ammo) this.ammo.op_mul(v.ammo);
  if (this.three && v.three) this.three.multiply(v.three);
  return this;
};

Quaternion.prototype.destroy = function () {
  if (this.ammo) Ammo.destroy(this.ammo);
};

Quaternion.prototype.toJSON = function () {
  return {x: this.x, y: this.y, z: this.z, w: this.w};
};

extend(Vector, Component);
extend(Quaternion, Component);

// src/vector.js ends

;// src/shape.js begins

function Shape(options, system) {
  this.construct(options, system, 'sphere');
}

Shape.prototype.types = {
  sphere: function (options) {
    this.include(options, {
      r: 1, segments: 12
    });
    this.useConversion();
    if (this.runsPhysics()) this.ammo = new Ammo.btSphereShape(this.r);
    if (this.runsRender()) this.three = new THREE.SphereGeometry(this.r, this.segments, this.segments);
  },
  box: function (options) {
    this.include(options, {
      dx: 1, dy: 1, dz: 1, segments: 1,
      gap: 0 //make this object a bit smaller on each side if gap
    });
    this.useConversion();
    if (this.runsPhysics()) this.ammo = new Ammo.btBoxShape(new Ammo.btVector3(this.dx / 2 - this.gap, this.dy / 2 - this.gap, this.dz / 2 - this.gap));
    if (this.runsRender()) this.three = new THREE.BoxGeometry(this.dx - 2 * this.gap, this.dy - 2 * this.gap, this.dz - 2 * this.gap,
      this.segments, this.segments, this.segments);
  },
  cylinder: function (options) {
    this.include(options, {
      r: 1, dy: 1, segments: 12
    });
    this.useConversion();
    if (this.runsPhysics()) this.ammo = new Ammo.btCylinderShape(new Ammo.btVector3(this.r, this.dy / 2, this.r));
    if (this.runsRender()) this.three = new THREE.CylinderGeometry(this.r, this.r, this.dy, this.segments);
  },
  cone: function (options) {
    this.include(options, {
      r: 1, dy: 1, segments: 12
    });
    this.useConversion();
    if (this.runsPhysics()) this.ammo = new Ammo.btConeShape(this.r, this.dy);
    if (this.runsRender()) this.three = new THREE.CylinderGeometry(0, this.r, this.dy, this.segments);
  },
  compound: function (options) {
    this.include(options, {
      parent: undefined, children: undefined
    });
    this.notifyUndefined(['parent']);
    if (typeof this.parent == 'string') {
      this.parent = this.parentSystem.getObject('shape', this.parent);
    } else {
      this.parent = new Shape(this.parent, this.parentSystem);
    }
    var compound;
    var transParent;
    if (this.runsPhysics()) {
      compound = new Ammo.btCompoundShape;
      transParent = new Ammo.btTransform;
      transParent.setIdentity();
      compound.addChildShape(transParent, this.parent.ammo);
    }
    _.each(this.children, function (childOptions) {
      childOptions._dontSave = true;
      var child = new Shape(childOptions, this.parentSystem);
      var pos = new Vector(childOptions.position || {});
      this.applyLengthConversionRate(pos);
      var qua = new Quaternion(childOptions.rotation || {});
      if (this.runsPhysics()) {
        var transChild = new Ammo.btTransform;
        transChild.setIdentity();
        transChild.setRotation(qua.ammo);
        transChild.setOrigin(pos.ammo);
        compound.addChildShape(transChild, child.ammo);
        Ammo.destroy(transChild);
      }
      if (this.runsRender()) {
        var tc = new THREE.Matrix4;
        tc.makeRotationFromQuaternion(qua.three);
        tc.setPosition(pos.three);
        this.parent.three.merge(child.three, tc);
      }
    }, this);
    if (this.runsPhysics()) {
      this.ammo = compound;
    }
    if (this.runsRender()) {
      this.three = this.parent.three;
    }
  }
};

Shape.prototype.useConversion = function (scale) {
  this.applyLengthConversionRate(['r', 'dx', 'dy', 'dz', 'gap'], scale);
};

extend(Shape, Component);
Component.prototype.maker.shape = Shape;
// src/shape.js ends

;// src/material.js begins

function Material(options, system) {
  this.construct(options, system, 'phong');
}

Material.prototype.types = {
  _intro: function (options) {
    this.include(options, {
      friction: 0.3, restitution: 0.2,
      color: 0x333333, opacity: 1, transparent: false,
      wireframe: this.getSettings().wireframe || false
    });
    this.notifyUndefined(['friction', 'restitution']);
  },
  basic: function (options) {
    this.include(options, {
    });
    Material.prototype.types._intro.call(this, options);
    if (this.runsRender()) this.three = new THREE.MeshBasicMaterial(this.options());
  },
  phong: function (options) {
    this.include(options, {
      emissive: 0x000000, specular: 0x555555
    });
    Material.prototype.types._intro.call(this, options);
    if (this.runsRender()) this.three = new THREE.MeshPhongMaterial(this.options());
  }
};

Material.prototype.getFriction = function () {
  return this.options().friction;
};

Material.prototype.getRestitution = function () {
  return this.options().restitution;
};

extend(Material, Component);
Component.prototype.maker.material = Material;


// src/material.js ends

;// src/light.js begins

function Light(options, system) {
  this.construct(options, system, 'directional');
}

Light.prototype.types = {
  directional: function (options) {
    this.include(options, {
      color: 0xbbbbbb, position: {x: 10, y: 5, z: 3},
      lookAt: {}, castShadow: this.getSettings().castShadow,
      shadowDistance: 20
    });
    if (this.runsRender()) {
      var light = new THREE.DirectionalLight(this.color);
      light.position.copy(this.applyLengthConversionRate(new Vector(this.position)).three);
      if (typeof(this.lookAt) == 'object') {
        light.target.position.copy(new Vector(this.lookAt).three);
      }
      if (this.castShadow) {
        this.shadowDistance = this.applyLengthConversionRate(this.shadowDistance);
        light.shadowCameraLeft = -this.shadowDistance;
        light.shadowCameraTop = -this.shadowDistance;
        light.shadowCameraRight = this.shadowDistance;
        light.shadowCameraBottom = this.shadowDistance;
        light.shadowCameraNear = 0.2 * this.shadowDistance;
        light.shadowCameraFar = 10 * this.shadowDistance;
        light.shadowBias = -0.0003;
        light.shadowMapWidth = light.shadowMapHeight = this.getSettings().shadowMapSize;
        light.shadowDarkness = 0.35;
      }
      this.three = light;
    }
    this.addRenderMethod('addToScene', Light.prototype.methods.addToScene);
  }
};

Light.prototype.methods = {
  addToScene: function (scene) {
    if (this.runsRender()) {
      if (!this._added) {
        this._added = true;
        scene.three.add(this.three);
      }
    }
  }
};

extend(Light, Component);
Component.prototype.maker.light = Light;
// src/light.js ends

;// src/body.js begins

function Body(options, system) {
  this.construct(options, system, 'basic');
}

Body.prototype.types = {
  basic: function (options) {
    this.include(options, {
      shape: undefined,
      material: undefined,
      mass: 0,
      position: {},
      quaternion: undefined, rotation: undefined,
      connector: {}
    });
    this.notifyUndefined(['mass', 'shape', 'material']);
    if (this.settingsFor('freeze')) {
      this.mass = 0;
    }
    var shape;
    var _this = this;
    if (typeof this.shape == 'string') { //get from objects with id
      shape = this.parentSystem.getObject('shape', this.shape);
    } else { //make from options
      shape = new Shape(this.shape, this.parentSystem);
    }
    this.shape = shape;

    var material;
    if (typeof this.material == 'string') { //get from objects with id
      material = this.parentSystem.getObject('material', this.material);
    } else { //make from options
      material = new Material(this.material, this.parentSystem);
    }
    this.material = material;

    this.position = new Vector(this.position);
    this.applyLengthConversionRate(this.position);
    this.quaternion = new Quaternion(this.quaternion || this.rotation || {w: 1});

    if (this.runsRender()) {
      this.three = new THREE.Mesh(shape.three, material.three);
      var axisHelper = this.settingsFor('axisHelper');
      if (axisHelper) {
        shape.three.computeBoundingSphere();
        var r = shape.three.boundingSphere.radius * 1.5;
        this.three.add(new THREE.AxisHelper(r));
      }
    }
    if (this.runsPhysics()) {
      this.ammoTransform = new Ammo.btTransform(this.quaternion.ammo, this.position.ammo);
    }
    this.applyParentSystemsTransform();
    this.updateMotionState();
    this.syncPhysics();
    _.each(this.connector, function (c, id) {
      c.bodyObject = _this;
      c.body = _this.id;
      c.id = id;
      new Connector(c, _this.parentSystem);
    });
    this.syncPhysics();
  }
};
/**
 * updates ammo and three position and rotation from the objects position and rotation
 */
Body.prototype.updateMotionState = function () {
  if (this.runsRender()) {
    this.three.quaternion.copy(this.quaternion.three);
    this.three.position.copy(this.position.three);
  }
  if (this.runsPhysics()) {
    //this.ammoTransform.setIdentity();
    //this.ammoTransform.setOrigin(this.position.ammo);
    //this.ammoTransform.setRotation(this.quaternion.ammo);
    var inertia = new Ammo.btVector3(0, 0, 0);
    if (this.mass) this.shape.ammo.calculateLocalInertia(this.mass, inertia);
    var motionState = new Ammo.btDefaultMotionState(this.ammoTransform);
    var rbInfo = new Ammo.btRigidBodyConstructionInfo(this.mass, motionState, this.shape.ammo, inertia);
    rbInfo.set_m_friction(this.material.getFriction());
    rbInfo.set_m_restitution(this.material.getRestitution());
    /*
     rbInfo.m_linearDamping = 0.5;
     rbInfo.m_angularDamping = 0.5;
     */
    this.ammo = new Ammo.btRigidBody(rbInfo);
  }
};

Body.prototype.applyParentSystemsTransform = function () {
  this.parentSystem.applyTransform(this.ammoTransform);
};

Body.prototype.addToScene = function (scene) {
  if (!this._added) {
    this._added = true;
    if (this.runsRender()) scene.three.add(this.three);
    if (this.runsPhysics()) {
      scene.ammo.addRigidBody(this.ammo);
      if (!this.ammo.isInWorld()) {
        console.error(this.id + ' failed to be added to world');
      }
    }
  } else {
    //console.log(this.id + ' already added to scene');
  }
};

/**
 * copy the positions and rotation from ammo object to three object
 * in between updating also position and rotation assigned to the object
 */
Body.prototype.syncPhysics = function () {
  var body = this;
  //copy physics from .ammo object
  if (this.runsPhysics()) {
    var trans = this.rootSystem.ammoTransform;
    trans.setIdentity();
    body.ammo.getMotionState().getWorldTransform(trans);
    body.warnInvalidTranform(trans);
    body.position.copyFromAmmo(trans.getOrigin());
    body.quaternion.copyFromAmmo(trans.getRotation());
  }
  //copy physics to .three object
  if (this.runsRender()) {
    body.three.position.copy(body.position);
    body.three.quaternion.copy(body.quaternion);
  }
};

Body.prototype.warnInvalidTranform = function (transform) {
  if (isNaN(transform.getOrigin().x()) && !this._warned) {
    this._warned = this.parentSystem.id + '.' + this.id + ': invalid transform';
    console.warn(this._warned);
  }
};
/*
 get position and rotation to send from worker to window
 the result is passed by reference in the argument
 */
Body.prototype.packPhysics = function (myPhysics) {
  if (!myPhysics.p) myPhysics.p = {};
  if (!myPhysics.q) myPhysics.q = {};
  myPhysics.p.x = this.position.x;
  myPhysics.p.y = this.position.y;
  myPhysics.p.z = this.position.z;
  myPhysics.q.x = this.quaternion.x;
  myPhysics.q.y = this.quaternion.y;
  myPhysics.q.z = this.quaternion.z;
  myPhysics.q.w = this.quaternion.w;
};

Body.prototype.unpackPhysics = function (myPhysics) {
  this.position.x = myPhysics.p.x;
  this.position.y = myPhysics.p.y;
  this.position.z = myPhysics.p.z;
  this.quaternion.x = myPhysics.q.x;
  this.quaternion.y = myPhysics.q.y;
  this.quaternion.z = myPhysics.q.z;
  this.quaternion.w = myPhysics.q.w;
  if (this.runsRender()) {
    this.three.position.copy(this.position);
    this.three.quaternion.copy(this.quaternion);
  }
};

Body.prototype.destroy = function (scene) {
  _.each(this.connector, function (c) {
    c.destroy();
  });
  try {
    if (this.runsRender()) {
      scene.three.remove(this.three);
      this.three.geometry.dispose();
      this.three.material.dispose();
    }
    if (this.runsPhysics()) {
      scene.ammo.removeRigidBody(this.ammo);
      Ammo.destroy(this.ammo);
      Ammo.destroy(this.ammoTransform);
      this.position.destroy();
      this.quaternion.destroy();
    }
  } catch (e) {
    console.log(this.group, this.id, e.message || e);
    throw e;
  }
};

Body.prototype.toJSON = function () {
  this.syncPhysics();
  var json = _.pick(this._options, 'type', 'shape', 'material');
  json.position = this.position.toJSON();
  json.quaternion = this.quaternion.toJSON();
  json.connector = {};
  _.each(this.connector, function (connector, key) {
    json.connector[key] = connector.toJSON();
  });
  return json;
};

Body.prototype.getPosition = function(){
  return this.position;
};

Body.prototype.getQuaternion = function(){
  return this.quaternion;
};

extend(Body, Component);
Component.prototype.maker.body = Body;


// src/body.js ends

;// src/connector.js begins

function Connector(options, system) {
  this.construct(options, system, 'relative');
}

Connector.prototype.types = {
  //base and axis are specified in local coordinates
  relative: function (options) {
    this.include(options, {
      body: undefined, //the parent body id
      base: {x: 0, y: 0, z: 0}, //origin
      up: {y: 1}, //axis of rotation or direction of movement, normalized
      front: {z: 1} //defines the angle, should be perpendicular to 'up', normalized
    });
    this.notifyUndefined(['body', 'base', 'up', 'front']);
    var body = options.bodyObject || this.parentSystem.getObject('body', this.body);
    if (body) {
      body.connector[this.id] = this;
      this.body = body;
      this.ammoTransform = this.normalize();

      this.base = new Vector(this.base);
      this.applyLengthConversionRate(this.base);

      this.up = new Vector(this.up);
      this.front = new Vector(this.front);
      //check for orthogonality
      var settings = this.getSettings();
      var helper = this.settingsFor('connectorHelper');
      if (this.runsRender() && helper) {
        helper = this.applyLengthConversionRate(helper);
        //TODO reuse material and geometry
        var connectorHelperMaterial = new THREE.MeshBasicMaterial({
          color: settings.connectorColor,
          transparent: true,
          opacity: 0.5
        });
        if (!this.body.shape.three.boundingSphere) this.body.shape.three.computeBoundingSphere();
        helper = Math.min(this.body.shape.three.boundingSphere.radius / 2, helper);

        var connectorHelperGeometry = new THREE.SphereGeometry(helper / 2, 6, 6);
        var s = new THREE.Mesh(connectorHelperGeometry, connectorHelperMaterial);
        var axis = new THREE.AxisHelper(helper);
        s.add(axis);

        //rotate the axis to match required directions
        s.up.copy(this.up.three); // (y axis, green)
        s.lookAt(this.front.three); // (z axis, blue)
        s.updateMatrix();

        //reset up
        //s.up.set(0, 1, 0);
        s.position.copy(this.base.three);
        body.three.add(s);
      }
    }
  }
};

Connector.prototype.normalize = function () {
  var ammoHelper = Ammo;
  var c = this;
  if (!ammoHelper) return undefined;
  var up = new ammoHelper.btVector3(c.up.x || 0, c.up.y || 0, c.up.z || 0);
  up.normalize();
  var front = new ammoHelper.btVector3(c.front.x || 0, c.front.y || 0, c.front.z || 0);
  var wing = up.cross(front);
  wing = new ammoHelper.btVector3(wing.x(), wing.y(), wing.z());
  wing.normalize();
  front = wing.cross(up);
  front = new ammoHelper.btVector3(front.x(), front.y(), front.z());
  front.normalize();
  var base = new ammoHelper.btVector3(c.base.x || 0, c.base.y || 0, c.base.z || 0);
  var v1 = wing;
  var v2 = up;
  var v3 = front;
  var m3 = new ammoHelper.btMatrix3x3(
    v1.x(), v1.y(), v1.z(),
    v2.x(), v2.y(), v2.z(),
    v3.x(), v3.y(), v3.z()
  );
  m3 = m3.transpose();
  c.up = {
    x: up.x(), y: up.y(), z: up.z()
  };
  c.front = {
    x: front.x(), y: front.y(), z: front.z()
  };
  var t = new ammoHelper.btTransform();
  t.setBasis(m3);
  t.setOrigin(base);
  ammoHelper.destroy(up);
  ammoHelper.destroy(front);
  ammoHelper.destroy(wing);
  return t;
};


Connector.prototype.approachConnector = function (fix) {
  //move bodies to match connectors, which are already normalized, with computed transforms
  if (!ammoHelper) return;
  var move = this;
  //body to move
  var moveConInvTrans = new ammoHelper.btTransform(new ammoHelper.btTransform(move.ammoTransform).inverse());
  var moveBodyInvTrans = new ammoHelper.btTransform(move.body.ammoTransform);
  moveBodyInvTrans = new ammoHelper.btTransform(moveBodyInvTrans.inverse());

  //fixed body
  var fixConTrans = new ammoHelper.btTransform(fix.ammoTransform);
  var fixBodyTrans = new ammoHelper.btTransform(fix.body.ammoTransform);

  moveBodyInvTrans.op_mul(fixBodyTrans);
  moveBodyInvTrans.op_mul(fixConTrans);
  moveBodyInvTrans.op_mul(moveConInvTrans);

  move.body.ammoTransform.op_mul(moveBodyInvTrans);
  move.body.position = Vector.prototype.fromAmmo(move.body.ammoTransform.getOrigin());
  move.body.quaternion = Quaternion.prototype.fromAmmo(move.body.ammoTransform.getRotation());

  move.body.updateMotionState();

  Ammo.destroy(moveConInvTrans);
  Ammo.destroy(moveBodyInvTrans);
  Ammo.destroy(fixConTrans);
  Ammo.destroy(fixBodyTrans);
};

Connector.prototype.toJSON = function () {
  var json = _.pick(this._options, 'type', 'body');
  _.each(['base', 'up', 'front'], function (v) {
    json[v] = this[v].toJSON();
  }, this);
  return json;
};

extend(Connector, Component);
Component.prototype.maker.connector = Connector;
// src/connector.js ends

;// src/constraint.js begins

function Constraint(options, system) {
  this.construct(options, system, 'point');
}

Constraint.prototype.types = {
  //super constructor
  _abstract: function (options) {
    this.include(options, {
      bodyA: undefined, //bodyA id
      bodyB: undefined, //bodyB id
      connectorA: undefined, //connector id, in body A
      connectorB: undefined, //connector id, in body B
      approach: false //move bodyB towards bodyA to match connectors
    });
    this.notifyUndefined(['connectorA', 'connectorB', 'bodyA', 'bodyB']);
    if (this.runsPhysics()) {
      this.bodyA = this.parentSystem.getBody(this.bodyA);
      this.bodyB = this.parentSystem.getBody(this.bodyB);
      this.connectorA = this.bodyA.connector[this.connectorA];
      this.connectorB = this.bodyB.connector[this.connectorB];
      if (this.approach) {
        this.connectorB.approachConnector(this.connectorA);
      }
    }
    this.addPhysicsMethod('addToScene', Constraint.prototype.methods.addToScene);
    this.addPhysicsMethod('removeFromScene', Constraint.prototype.methods.removeFromScene);
  },
  //for pendulum-like constraints
  point: function (options) {
    Constraint.prototype.types._abstract.call(this, options);
    if (this.runsPhysics()) {
      this.create = function () {
        this.ammo = new Ammo.btPoint2PointConstraint(
          this.bodyA.ammo, this.bodyB.ammo, this.connectorA.base.ammo, this.connectorB.base.ammo
        );
      };
    }
  },
  //...ex: for motorized wheels
  motor: function (options) {
    this.include(options, {
      maxBinary: 1,
      maxVelocity: 0.5
    });
    //TODO initial state, scale velocity, binary
    Constraint.prototype.types.hinge.call(this, options);
    this.addPhysicsMethod('enable', Constraint.prototype.methods.enable);
    this.addPhysicsMethod('disable', Constraint.prototype.methods.disable);
  },
  //like robotic servo motors, based on the hinge constraint
  servo: function (options) {
    this.include(options, {
      angle: undefined,
      lowerLimit: 0,
      upperLimit: Math.PI,
      maxBinary: 1,
      maxVelocity: 0.5
    });
    //TODO scale
    Constraint.prototype.types.hinge.call(this, options);
    this.afterCreate = function () {
      this.ammo.setLimit(this.lowerLimit, this.upperLimit, 0.9, 0.3, 1.0);
      if (this.angle !== undefined) {
        this.enable(this.maxVelocity, this.maxBinary);
      }
    };
    this.beforeStep = function () {
      if (this.runsPhysics()) {
        //FIXME
        //https://llvm.org/svn/llvm-project/test-suite/trunk/MultiSource/Benchmarks/Bullet/include/BulletDynamics/ConstraintSolver/btHingeConstraint.h
        //"setMotorTarget sets angular velocity under the hood, so you must call it every tick to  maintain a given angular target."
        //var dt = Math.abs(c.ammo.getHingeAngle() - c.angle) / c.maxVelocity;
        if (this.angle !== undefined) this.ammo.setMotorTarget(this.angle, 0.1);
      }
    };
    this.addPhysicsMethod('enable', Constraint.prototype.methods.enable);
    this.addPhysicsMethod('disable', Constraint.prototype.methods.disable);
    this.addPhysicsMethod('setAngle', Constraint.prototype.methods.setAngle);
  },
  //for free wheels, doors
  hinge: function (options) {
    this.include(options, {
      lowerLimit: 1,
      upperLimit: -1
    });
    //TODO scale (no need to scale transforms, they are already OK from connectors/bodies)
    Constraint.prototype.types._abstract.call(this, options);
    if (this.runsPhysics()) {

      var transformA = new Ammo.btTransform();
      transformA.setOrigin(this.connectorA.base.ammo);

      var zAxis = this.connectorA.up.ammo;
      var yAxis = this.connectorA.front.ammo;
      var xAxis = yAxis.cross(zAxis).normalize();

      //http://math.stackexchange.com/questions/53368/rotation-matrices-using-a-change-of-basis-approach
      var basis = transformA.getBasis();
      //set the new coordinate system and swap x, y
      basis.setValue(
        xAxis.x(), yAxis.x(), zAxis.x(),
        xAxis.y(), yAxis.y(), zAxis.y(),
        xAxis.z(), yAxis.z(), zAxis.z()
      );
      transformA.setBasis(basis);

      var transformB = new Ammo.btTransform();
      transformB.setOrigin(this.connectorB.base.ammo);

      zAxis = this.connectorB.up.ammo;
      yAxis = this.connectorB.front.ammo;
      xAxis = yAxis.cross(zAxis).normalize();
      //http://math.stackexchange.com/questions/53368/rotation-matrices-using-a-change-of-basis-approach
      basis = transformB.getBasis();
      //set the new coordinate system and swap x, y
      basis.setValue(
        xAxis.x(), yAxis.x(), zAxis.x(),
        xAxis.y(), yAxis.y(), zAxis.y(),
        xAxis.z(), yAxis.z(), zAxis.z()
      );
      transformB.setBasis(basis);

      this.transformA = transformA;
      this.transformB = transformB;

      this.create = function () {

        this.ammo = new Ammo.btHingeConstraint(
          this.bodyA.ammo, this.bodyB.ammo, this.transformA, this.transformB, true
        );
        //this.ammo.setBreakingImpulseThreshold(1000);
      };
    }
  },
  gear: function (options) {
    this.include(options, {
      ratio: undefined
    });
    Constraint.prototype.types._abstract.call(this, options);
    this.notifyUndefined(['ratio']);
    if (this.runsPhysics()) {
      this.create = function () {
        this.ammo = new Ammo.btGearConstraint(
          this.bodyA.ammo, this.bodyB.ammo, this.connectorA.up.ammo, this.connectorB.up.ammo, this.ratio
        );
      };
    }
  },
  //for linear motors, its based on the slider constraint
  //the position along the up direction is changed with a motor
  //has no angular rotation
  linear: function (options) {
    this.include(options, {
      position: 0,
      lowerLimit: 0,
      upperLimit: 1,
      maxForce: 1,
      maxVelocity: 1
    });
    //todo scale
    Constraint.prototype.types.slider.call(this, options);
    this.create = function () {
      this.ammo = new Ammo.btSliderConstraint(
        this.bodyA.ammo, this.bodyB.ammo, this.transformA, this.transformB, true
      );
    };
    this.afterCreate = function () {
      var c = this;
      c.ammo.setPoweredAngMotor(false);
      c.ammo.setLowerLinLimit(c.lowerLimit);
      c.ammo.setUpperLinLimit(c.upperLimit);
      c.ammo.setLowerAngLimit(0);
      c.ammo.setUpperAngLimit(0);
      c.ammo.setMaxLinMotorForce(c.maxForce);
      c.ammo.setPoweredLinMotor(true);
      c.setPosition(this.position);
    };
    this.beforeStep = function () {
      var c = this;
      var pos = c.ammo.getLinearPos();
      var diff = (this.position - pos) / (this.upperLimit - this.lowerLimit);
      var vel = this.maxVelocity * diff;
      c.ammo.setTargetLinMotorVelocity(vel);
    };
    this.addPhysicsMethod('setPosition', Constraint.prototype.methods.setPosition);
  },
  //slider can move and rotate along the up direction
  slider: function (options) {
    this.include(options, {
      lowerLinear: 0,
      upperLinear: 1,
      lowerAngular: 1,
      upperAngular: 0
    });
    Constraint.prototype.types._abstract.call(this, options);
    if (this.runsPhysics()) {
      var transformA = new Ammo.btTransform();
      transformA.setOrigin(this.connectorA.base.ammo);

      var yAxis = this.connectorA.up.ammo;
      var zAxis = this.connectorA.front.ammo;
      var xAxis = yAxis.cross(zAxis).normalize();

      //http://math.stackexchange.com/questions/53368/rotation-matrices-using-a-change-of-basis-approach
      var basis = transformA.getBasis();
      //set the new coordinate system and swap x, y
      basis.setValue(
        yAxis.x(), xAxis.x(), zAxis.x(),
        yAxis.y(), xAxis.y(), zAxis.y(),
        yAxis.z(), xAxis.z(), zAxis.z()
      );
      transformA.setBasis(basis);

      var transformB = new Ammo.btTransform();
      transformB.setOrigin(this.connectorB.base.ammo);

      yAxis = this.connectorB.up.ammo;
      zAxis = this.connectorB.front.ammo;
      xAxis = yAxis.cross(zAxis).normalize();
      //http://math.stackexchange.com/questions/53368/rotation-matrices-using-a-change-of-basis-approach
      basis = transformB.getBasis();
      //set the new coordinate system and swap x, y
      basis.setValue(
        yAxis.x(), xAxis.x(), zAxis.x(),
        yAxis.y(), xAxis.y(), zAxis.y(),
        yAxis.z(), xAxis.z(), zAxis.z()
      );
      transformB.setBasis(basis);

      this.transformA = transformA;
      this.transformB = transformB;

      this.create = function () {
        this.ammo = new Ammo.btSliderConstraint(
          this.bodyA.ammo, this.bodyB.ammo, transformA, transformB, true
        );
      };
      this.afterCreate = function () {
        var c = this;
        c.ammo.setLowerAngLimit(c.lowerAngular);
        c.ammo.setUpperAngLimit(c.upperAngular);
        c.ammo.setLowerLinLimit(c.lowerLinear);
        c.ammo.setUpperLinLimit(c.upperLinear);
        c.ammo.setPoweredAngMotor(false);
        c.ammo.setPoweredLinMotor(false);
      };
    }
  },
  //fixed constraint have 0 degrees of freedom
  fixed: function (options) {
    Constraint.prototype.types._abstract.call(this, options);
    if (this.runsPhysics()) {
      var transformA = new Ammo.btTransform();
      transformA.setOrigin(this.connectorA.base.ammo);

      var yAxis = this.connectorA.up.ammo;
      var zAxis = this.connectorA.front.ammo;
      var xAxis = yAxis.cross(zAxis).normalize();

      //http://math.stackexchange.com/questions/53368/rotation-matrices-using-a-change-of-basis-approach
      var basis = transformA.getBasis();
      //set the new coordinate system and swap x, y
      basis.setValue(
        yAxis.x(), xAxis.x(), zAxis.x(),
        yAxis.y(), xAxis.y(), zAxis.y(),
        yAxis.z(), xAxis.z(), zAxis.z()
      );
      transformA.setBasis(basis);

      var transformB = new Ammo.btTransform();
      transformB.setOrigin(this.connectorB.base.ammo);

      yAxis = this.connectorB.up.ammo;
      zAxis = this.connectorB.front.ammo;
      xAxis = yAxis.cross(zAxis).normalize();
      //http://math.stackexchange.com/questions/53368/rotation-matrices-using-a-change-of-basis-approach
      basis = transformB.getBasis();
      //set the new coordinate system and swap x, y
      basis.setValue(
        yAxis.x(), xAxis.x(), zAxis.x(),
        yAxis.y(), xAxis.y(), zAxis.y(),
        yAxis.z(), xAxis.z(), zAxis.z()
      );
      transformB.setBasis(basis);
      this.create = function () {
        this.ammo = new Ammo.btFixedConstraint(
          this.bodyA.ammo, this.bodyB.ammo, transformA, transformB, true
        );
      };
      this.transformA = transformA;
      this.transformB = transformB;
    }
  }
};

Constraint.prototype.destroy = function (scene) {
  try {
    if (this.runsPhysics()) {
      this.removeFromScene(scene);
      Ammo.destroy(this.ammo);
      if (this.transformA) Ammo.destroy(this.transformA);
      if (this.transformB) Ammo.destroy(this.transformB);
    }
  } catch (e) {
    console.log(this.group, this.id, e.message || e);
    throw e;
  }
};

Constraint.prototype.methods = {
  addToScene: function (scene) {
    if (!this._added && this.runsPhysics()) {
      this.create();
      if (this.afterCreate) this.afterCreate();
      scene.ammo.addConstraint(this.ammo);
      this._added = true;
      this.bodyA.ammo.activate();
      this.bodyB.ammo.activate();
    }
  },
  removeFromScene: function (scene) {
    if (this._added && this.runsPhysics()) {
      scene.ammo.removeConstraint(this.ammo);
      this._added = false;
      this.bodyA.ammo.activate();
      this.bodyB.ammo.activate();
    }
  },
  //servos only
  setAngle: function (angle) {
    if (this.runsPhysics()) {
      //angle is set in beforeStep
      this.angle = angle;
      this.bodyA.ammo.activate();
      this.bodyB.ammo.activate();
      this.enable(this.maxVelocity, this.maxBinary);
    }
  },
  //linear motors only
  setPosition: function (position) {
    //todo how to scale
    if (this.runsPhysics()) {
      this.position = position;
      this.bodyA.ammo.activate();
      this.bodyB.ammo.activate();
    }
  },
  enable: function (velocity, binary) {
    if (this.runsPhysics()) {
      this.ammo.enableAngularMotor(true, velocity, binary);
      this.bodyA.ammo.activate();
      this.bodyB.ammo.activate();
    }
  },
  disable: function () {
    if (this.runsPhysics()) {
      this.ammo.enableAngularMotor(false, 0, 0);
      this.bodyA.ammo.activate();
      this.bodyB.ammo.activate();
    }
  }
};

Constraint.prototype.toJSON = function () {
  var json = utils.deepCopy(this._options);
  delete json.id;
  delete json.group;
  _.extend(json, _.pick(this, 'angle', 'position'));
  return json;
};

extend(Constraint, Component);
Component.prototype.maker.constraint = Constraint;
// src/constraint.js ends

;// src/scene.js begins

function Scene(options, system) {
  this.construct(options, system, 'basic');
}

Scene.prototype.types = {
  basic: function (options) {
    this.include(options, {
      solver: 'sequential', //pgs, dantzig
      gravity: {y: -9.81},
      lengthUnits: 'm'
    });
    this.showAxisHelper();
    this.createWorld();
  }
};

Scene.prototype.createWorld = function () {
  if (this.runsPhysics()) {
    this.makeConstraintsSolver();
    this.btDefaultCollisionConfiguration = new Ammo.btDefaultCollisionConfiguration();
    this.btCollisionDispatcher = new Ammo.btCollisionDispatcher(this.btDefaultCollisionConfiguration);
    this.btDbvtBroadphase = new Ammo.btDbvtBroadphase();
    this.ammo = new Ammo.btDiscreteDynamicsWorld(
      this.btCollisionDispatcher,
      this.btDbvtBroadphase,
      this.constraintSolver,
      this.btDefaultCollisionConfiguration
    );
    this.gravity = new Vector(this.gravity);
    this.applyLengthConversionRate(this.gravity);
    this.ammo.setGravity(this.gravity.ammo);
  }
};

Scene.prototype.makeConstraintsSolver = function () {
  try {
    this.constraintSolver = {
      sequential: function () {
        return new Ammo.btSequentialImpulseConstraintSolver();
      },
      dantzig: function () {
        return new Ammo.btMLCPSolver(new Ammo.btDantzigSolver());
      },
      pgs: function () {
        return new Ammo.btMLCPSolver(new Ammo.btSolveProjectedGaussSeidel());
      }
    }[this.solver]();
    console.log('using solver: ' + this.solver);
  } catch (e) {
    console.log('solver type' + this.solver);
    console.error(e);
  }
};

Scene.prototype.showAxisHelper = function () {
  var settings = this.getSettings();
  if (this.runsRender()) {
    this.three = new THREE.Scene();
    if (settings.axisHelper) {
      if (this.runsRender()) this.three.add(new THREE.AxisHelper(settings.axisHelper));
    }
  }
};

Scene.prototype.destroy = function () {
  try {
    if (this.runsPhysics()) {
      Ammo.destroy(this.ammo);
      Ammo.destroy(this.btDefaultCollisionConfiguration);
      Ammo.destroy(this.btCollisionDispatcher);
      Ammo.destroy(this.btDbvtBroadphase);
      this.gravity.destroy();
    }
  } catch (e) {
    console.log(this.group, this.id, e.message || e);
    throw e;
  }
};

extend(Scene, Component);
Component.prototype.maker.scene = Scene;
// src/scene.js ends

;// src/camera.js begins

function Camera(options, system) {
  this.construct(options, system, 'perspective');
}

Camera.prototype.types = {
  perspective: function (options) {
    this.include(options, {
      fov: 45, aspect: 1, near: 0.1, far: 1000,
      position: {x: 5, y: 7, z: 20},
      lookAt: {}
    });
    this.position = new Vector(this.position);
    if (this.runsRender()) {
      this.three = new THREE.PerspectiveCamera(this.fov, this.aspect, this.near, this.far);
      this.three.position.copy(this.position.three);
      this.three.lookAt(new Vector(this.lookAt).three);
    }
    this.addRenderMethod('move', Camera.prototype.methods.movePerspective);
  },
  //follow a body
  tracker: function (options) {
    this.include(options, {
      fov: 45, aspect: 1, near: 0.1, far: 1000,
      axis: {x: 1, y: 0.2, z: 0.3}, //preferred axis of movement
      distance: 15, //distance to keep
      inertia: 1, //for changing position, in seconds
      lookAt: null
    });
    this.notifyUndefined(['lookAt']);
    this.axis = new Vector(this.axis);
    this.lookAt = this.resolveLookAt(this.lookAt);
    if (this.runsRender()) {
      this.axis.three.normalize();
      this.three = new THREE.PerspectiveCamera(this.fov, this.aspect, this.near, this.far);
    }
    this.addRenderMethod('move', Camera.prototype.methods.moveTracker);
  },
  //follow a body
  satellite: function (options) {
    this.include(options, {
      fov: 45, aspect: 1, near: 0.1, far: 1000,
      axis: {x: 1, y: 0.2, z: 0.3}, //preferred axis of movement
      distance: 15, //distance to keep
      inertia: 1, //for changing position, in seconds
      lookAt: null
    });
    this.notifyUndefined(['lookAt']);
    this.axis = new Vector(this.axis);
    this.lookAt = this.resolveLookAt(this.lookAt);
    if (this.runsRender()) {
      this.axis.three.normalize();
      this.three = new THREE.PerspectiveCamera(this.fov, this.aspect, this.near, this.far);
    }
    this.addRenderMethod('move', Camera.prototype.methods.moveSatellite);
  }
};

Camera.prototype.resolveLookAt = function (lookAt) {
  if (lookAt instanceof Body) {
    return lookAt;
  } else if (typeof(this.lookAt) == 'string') {
    return this.parentSystem.getObject('body', this.lookAt);
  } else if ((typeof lookAt == 'object') && lookAt.id) {
    return this.parentSystem.getObject(lookAt);
  } else {
    return new Vector(this.lookAt);
  }
};

Camera.prototype.methods = {
  moveTracker: function () {
    var camera = this;
    var distance;
    var requiredPosition = camera.three.position.clone();
    var bodyPosition = camera.lookAt.three.position;
    var axis = camera.axis.three;
    var requiredDistance = camera.distance;
    var projection = bodyPosition.clone().projectOnVector(axis);
    distance = projection.distanceTo(bodyPosition);
    var normal = bodyPosition.clone().sub(projection);
    var extension;
    if (distance == 0) {
      requiredPosition.copy(axis.clone().multiplyScalar(requiredDistance));
    } else if (distance == requiredDistance) {
      requiredPosition.copy(projection);
    } else if (distance > requiredDistance) {
      extension = distance - requiredDistance;
      normal.normalize().multiplyScalar(extension);
      requiredPosition.copy(normal.add(projection));
    } else {
      extension = Math.sqrt(Math.pow(requiredDistance, 2) - Math.pow(normal.length(), 2));
      requiredPosition.copy(projection.add(axis.clone().multiplyScalar(extension)));
    }
    //get saved time
    camera._lastTime = camera._lastTime || (new Date()).getTime();
    var curTime = (new Date()).getTime();
    var lapse = curTime - camera._lastTime;
    camera._lastTime = curTime; //save time
    var beta;
    if (lapse == 0) {
      beta = 10000;
    } else {
      beta = lapse / 1000 / (camera.inertia + 0.001);
    }
    //TODO use PID controller
    // pos = (ß * new + pos) / (1 + ß)
    camera.three.position.add(requiredPosition.multiplyScalar(beta)).divideScalar(1 + beta);
    camera._lastLookAt = camera._lastLookAt || bodyPosition.clone();
    camera.three.lookAt(camera._lastLookAt.add(bodyPosition.clone().multiplyScalar(beta)).divideScalar(1 + beta));
  },
  moveSatellite: function () {
    var camera = this;
    var phase = 0;
    var time = new Date().getTime();
    camera.three.position.x = camera.distance * Math.sin(phase + time / 2234);
    camera.three.position.z = camera.distance * Math.cos(phase + time / 2234);
    camera.three.position.y = 0.5 * camera.distance * Math.cos(phase + time / 3345);
    if (camera.lookAt.x !== undefined) { //looking to a position
      camera.three.lookAt(camera.lookAt.three);
    } else if (camera.lookAt.shape) { //looking to a body
      camera.three.lookAt(camera.lookAt.three.position);
    }
  },
  movePerspective: function () {

  }
};

extend(Camera, Component);
Component.prototype.maker.camera = Camera;
// src/camera.js ends

;// src/monitor.js begins

function Monitor(options, system) {
  this.construct(options, system, 'complete');
}

Monitor.prototype.types = {
  complete: function (options) {
    this.include(options, {
      renderer: 'available',
      camera: 'perspective',
      width: 500, height: 500,
      fov: 35, near: 0.1, far: 1000,
      position: {x: 5, y: 7, z: 10},
      axis: {x: 5, y: 7, z: 10},
      lookAt: {}, //vector or body id
      distance: 15, //distance to keep, in case of tracker
      inertia: 1
    });
    if (this.runsRender()) {
      var o = this.optionsWithoutId();
      o.aspect = o.width / o.height;
      var cameraOptions = utils.deepCopy(o);
      cameraOptions.type = o.camera;
      var rendererOptions = utils.deepCopy(o);
      rendererOptions.type = o.renderer;
      this.renderer = new Renderer(rendererOptions, this.rootSystem);
      this.camera = new Camera(cameraOptions, this.rootSystem);
    }
  }
};

extend(Monitor, Component);
Component.prototype.maker.monitor = Monitor;
// src/monitor.js ends

;// src/renderer.js begins

function Renderer(options, system) {
  this.construct(options, system, 'available');
}

Renderer.prototype.types = {
  available: function (options) {
    try {
      Renderer.prototype.types.webgl.call(this, options);
    } catch (e) {
      Renderer.prototype.types.canvas.call(this, options);
    }
  },
  _intro: function (options) {
    this.include(options, {
      width: 500, height: 500, container: undefined
    });
    if (jQuery && THREE) {
      if (this.getSettings().reuseCanvas) {
        this.canvas = jQuery('canvas[monitor=""]').first();
        if (this.canvas.length) {
          this.canvas.attr('monitor', this.id);
          this.canvas.show();
          this.canvas = this.canvas.get(0);
        } else {
          delete this.canvas;
        }
      }
    }
  },
  _outro: function () {
    if (jQuery && THREE) {
      var settings = this.getSettings();
      jQuery(settings.canvasContainer).append(this.three.domElement);
      jQuery(this.three.domElement).attr('monitor', this.id);
      this.three.setSize(this.width, this.height);
    }
  },
  webgl: function (options) {
    Renderer.prototype.types._intro.call(this, options);
    if (this.runsRender()) {
      this.three = new THREE.WebGLRenderer({canvas: this.canvas});
    }
    Renderer.prototype.types._outro.call(this);
  },
  canvas: function (options) {
    Renderer.prototype.types._intro.call(this, options);
    if (this.runsRender()) {
      this.three = new THREE.CanvasRenderer({canvas: this.canvas});
    }
    Renderer.prototype.types._outro.call(this);
  }
};

extend(Renderer, Component);
Component.prototype.maker.renderer = Renderer;
// src/renderer.js ends

;// src/ui.js begins

var GET_VALUE = 'getValue';
var SET_VALUE = 'setValue';
var FOLDER_SYMBOL = "{...}";
var CLASS = "ui";
function UserInterface(options, system) {
  this.construct(options, system, 'basic');
}

UserInterface.prototype.types = {
  basic: function (options) {
    this.include(options, {
      values: undefined,
      template: {},
      container: this.getSettings().uiContainer,
      title: 'User Interface',
      overrideCallbacks: false,
      css: undefined
    });
    if (this.runsRender()) {
      this.notifyUndefined(['container']);
      if (typeof $ === 'undefined') {
        $ = jQuery;
      }
      this.updaters = [];
      this.reference = {};
      if (this.values) this.showEditor();
    }
  }
};


UserInterface.prototype.showEditor = function () {
  this.destroy();
  var domElements = this.build(this.values, this.template, this.reference);
  var $domElements = $(domElements);
  $domElements.attr('id', this.domId = this.nextId('ui') + new Date().getTime());
  $domElements.removeClass('level');
  $domElements.addClass(CLASS);
  _.each(this.css, function (css, sel) {
    $domElements.find(sel).css(css);
  });
  if (this.title) {
    var $title = $('<h3 />', {'class': 'title'});
    $title.text(this.title);
    $domElements.prepend($title);
  }
  $(this.container).append($domElements);
};


UserInterface.prototype.reuseWith = function (options) {
  this.destroy();
  _.extend(this._options, options);
  this.construct(this._options, this.parentSystem, this.options().type);
};

UserInterface.prototype.getValues = function () {
  _.each(this.updaters, function (fn) {
    try {
      if (typeof fn == 'function') fn();
    } catch (e) {
    }
  });
  return this.values;
};

UserInterface.prototype.getReference = function () {
  return this.reference;
};

UserInterface.prototype.objectInPath = function (path) {
  return utils.pathObject(this.values, path);
};

UserInterface.prototype.pathInReference = function (child, ancestor, values, path) {
  if (path === undefined) {
    path = [];
    ancestor = this.reference;
    values = this.values;
  }
  var found = false;
  if (typeof values == 'object') {
    _.each(values, function (v, key) {
      if (found) return;
      if (child === ancestor[key]) {
        found = true;
      } else {
        found = this.pathInReference(child, ancestor[key], v, path);
      }
      if (found) path.unshift(key);
    }, this);
  }
  if (found) return path;
};

UserInterface.prototype.transferValues = function (to, from) {
  from || (from = this.getValues());
  to || (to = {});
  _.each(from, function (value, key) {
    if (typeof value == 'object') {
      this.transferValues(to[key] || (to[key] = {}), value);
    } else if (typeof value == 'function') {
    } else {
      to[key] = value;
    }
  }, this);
  return to;
};

UserInterface.prototype.copyValues = function (from) {
  this.transferValues(this.values, from);
};

UserInterface.prototype.setCallback = function (fun) {
  this._callbackOverride = fun;
};

UserInterface.prototype.useCallback = function (eventName, domElement) {
  var _this = this;
  domElement.off(eventName);
  domElement.on(eventName, function () {
    var data = {
      event: eventName,
      values: _this.transferValues(),
      path: _this.pathInReference(domElement)
    };
    if (!_this._callbackOverride) throw new Error('need to setCallback in UserInterface');
    _this._callbackOverride.call(_this, data);
  });
};

UserInterface.prototype.applyRemote = function (data) {
  this.copyValues(data.values);
  var value = this.objectInPath(data.path);
  if ((typeof value == 'function')) {
    value.call(this);
  } else if (data.event == 'change') {
    var template = utils.pathObject(this.template, data.path);
    if (template && template.change) {
      template.change.call(this);
    }
  }
};

UserInterface.prototype.destroy = function () {
  try {
    this.reference = {};
    if (this.updaters) {
      while (this.updaters.pop()) {
      }
    }
    if (this.domId) $('#' + this.domId).remove();
    delete this.domId;
  } catch (e) {
    console.log(this.group, this.id, e.message || e);
    throw e;
  }
};

UserInterface.prototype.build = function (obj, temp, ref, $parent) {
  var _this = this;
  if (!$parent) {
    $parent = $('<div />', {'class': 'level'});
  }
  _.each(obj, function (v, k) {
    var specs = _this.templateFor(k, v, temp);
    var type = specs.type;
    var $wrapper = $('<div />', {'class': 'wrapper'});
    var $key = $('<div />', {'class': 'key'});
    $key.text(k + '');
    $key.addClass('length' + ~~($key.text().length / 4));
    var $value;
    if (typeof v == 'object') { //folders
      var $folded = $('<span>' + FOLDER_SYMBOL + '</span>', {'class': 'folded'});
      $value = _this.build(v, specs, ref[k] = {});
      $key.append($folded);
      $key.addClass('object');
      $key.on('click', function () {
        $value.toggle();
        $folded.toggle();
      });
      if (specs.folded) {
        $folded.show();
        $value.hide();
      } else {
        $folded.hide();
        $value.show();
      }
    } else {
      $value = _this.inputs[type].call(_this, k, v, specs);
      if ($value[GET_VALUE]) {
        _this.updaters.push(function () {
          obj[k] = $value[GET_VALUE]();
          if (obj[k] === false || obj[k] === true) {
          } else if (!isNaN(obj[k])) {
            obj[k] = Number(obj[k]);
          }
        });
      }
      ref[k] = $value;
      $value.addClass('value');
      $value.addClass(type);
    }
    if (typeof(specs.change) == 'function') {
      if (!_this.overrideCallbacks) {
        $value.on('change', function () {
          specs.change.call(_this);
        });
      } else {
        _this.useCallback('change', $value);
      }
    }
    //extend css from specs
    if (specs.keyCSS) $key.css(specs.keyCSS);
    if (specs.valueCSS) $value.css(specs.valueCSS);
    if (specs.wrapperCSS) $wrapper.css(specs.wrapperCSS);

    if (specs.noKey) $key.html('');
    $wrapper.append($key);
    $wrapper.append($value);
    $parent.append($wrapper);
  });
  return $parent;
};

UserInterface.prototype.templateFor = function (key, value, parentTemplate) {
  if (typeof value == 'object') {
    return parentTemplate && parentTemplate[key] || {};
  }
  //full specification: ex {type: 'range'}
  if (parentTemplate && parentTemplate[key] && parentTemplate[key].type && this.inputs[parentTemplate[key].type]) {
    return _.clone(parentTemplate[key]);
  }
  //short specification: ex 'range'
  if (parentTemplate && parentTemplate[key] && (typeof parentTemplate[key] == 'string') && this.inputs[parentTemplate[key]]) {
    return {type: parentTemplate[key]};
  }
  if (typeof value == 'function') {
    return {type: 'function'};
  }
  if (value === true || value === false) {
    return {type: 'boolean'};
  }
  return {type: 'string'};
};

UserInterface.prototype.inputs = {
  string: function (k, v, specs) {
    _.defaults(specs, {
      type: 'string', tag: 'span'
    });
    var e = $('<' + specs.tag + ' />', {contenteditable: 'true'});
    e.text(v);
    e[GET_VALUE] = function () {
      return e[specs.val || 'text']();
    };
    e[SET_VALUE] = function (a) {
      e[specs.val || 'text'](a);
    };
    return e;
  },
  number: function (k, v, specs) {
    return this.inputs.string(k, v, specs);
  },
  boolean: function (k, v, specs) {
    _.defaults(specs, {
      type: 'boolean', t: true, f: false
    });
    specs.t += '';
    specs.f += '';
    var e = $('<span />');
    e.text(v);
    e.on('click', function (evt) {
      var tgt = $(evt.target);
      tgt.text(tgt.text() == specs.t ? specs.f : specs.t);
    });
    e[GET_VALUE] = function () {
      var txt = e.text();
      return txt === specs.t;
    };
    e[SET_VALUE] = function (a) {
      e.text(a ? specs.t : specs.f);
    };
    return e;
  },
  color: function (k, v, specs) {
    _.defaults(specs, {
      type: 'color', tag: 'span'
    });
    var e = $('<' + specs.tag + ' />', {contenteditable: 'true'});
    e[GET_VALUE] = function () {
      return e[specs.val || 'text']();
    };
    e[SET_VALUE] = function (a) {
      e[specs.val || 'text'](a);
    };
    e.on('keyup', function () {
      e.css('background-color', e[GET_VALUE]());
    });
    e.text(v);
    setTimeout(function () {
      e.trigger('keyup');
    }, 0);
    return e;
  },
  'function': function (k, v, specs) {
    _.defaults(specs, {
      type: 'function', caption: k, noKey: true
    });
    var _this = this;
    var e = $('<span />');
    e.html(specs.caption);
    if (!_this.overrideCallbacks) {
      e.on('click', function () {
        if (typeof v == 'function') v.call(_this);
      });
    } else {
      _this.useCallback('click', e);
    }
    return e;
  },
  list: function (k, v, specs) {
    _.defaults(specs, {
      type: 'function', values: []
    });
    var e = $('<select />');
    _.each(specs.values, function (val) {
      var o = $('<option>' + val + '</option>', {'class': 'list'});
      if (val == v) o.attr('selected', 'selected');
      e.append(o);
    });
    e[GET_VALUE] = function () {
      return e.val();
    };
    e[SET_VALUE] = function (a) {
      e.val(a);
    };
    return e;
  },
  range: function (k, v, specs) {
    _.defaults(specs, {
      type: 'range', step: 1,
      min: undefined, max: undefined, values: undefined,
      plus: '+', minus: '-', editable: true, velocity: 1
    });
    var $wrapper = $('<div />', {'class': 'range-wrapper'});
    var $v = $('<div>' + v + '</div>');
    if (specs.editable) $v.attr('contenteditable', 'true');
    $v.addClass('range-value');
    var values = specs.values;
    var step = Number(specs.step);
    var max = specs.max;
    var min = specs.min;
    _.each(['minus', 'plus'], function (d, i) {
      var $d = $('<div />', {'class': 'pm'});
      $d.text(specs[d]);
      $wrapper.append($d);
      $d.on('mousedown', update(2 * i - 1));
      $d.on('mouseup', cancel);
      $d.on('mouseout', cancel);
    });
    $wrapper.append($v);
    var timeoutId;
    var time = 0;

    function cancel() {
      clearTimeout(timeoutId);
      time = 0;
    }

    function update(sign) {
      function u() {
        if (!time) time = utils.time();
        timeoutId = setTimeout(u, (utils.time(time) < 1000 ? 150 : 30) / specs.velocity);
        var val = $v.text();
        var next;
        if (values instanceof Array) {
          if (typeof v == 'number') {
            val = Number(val);
          }
          var i = values.indexOf(val) + sign;
          if (i < 0) i = 0;
          if (i >= values.length) i = values.length - 1;
          next = values[i];
        } else {
          val = Number(val);
          next = val + sign * step;
          if (max !== undefined) {
            next = next < max ? next : max;
          }
          if (min !== undefined) {
            next = next > min ? next : min;
          }
          next = Math.round(next / specs.step) * specs.step;
          next = String(next);
          var point = next.indexOf('.');
          if (point > -1) {
            var end = point - Math.log10(specs.step) + 1;
            next = Number(next.substring(0, end));
          }
        }
        $v.text(next.toString());
        $v.trigger('change');
      }

      return u;
    }

    $wrapper[GET_VALUE] = function () {
      return typeof(v) == 'number' ? Number($v.text()) : $v.text();
    };
    $wrapper[SET_VALUE] = function (a) {
      $v.text(a);
    };
    return $wrapper;
  }
};

extend(UserInterface, Component);
Component.prototype.maker.ui = UserInterface;



// src/ui.js ends

;// src/exports.js begins



module.exports = {
  Mecanica: Mecanica,
  Component: Component,
  System: System,
  Vector: Vector,
  Quaternion: Quaternion,
  Settings: Settings,
  Shape: Shape,
  Material: Material,
  Body: Body,
  Connector: Connector,
  Constraint: Constraint,
  Light: Light,
  Scene: Scene,
  Camera: Camera,
  Monitor: Monitor,
  Renderer: Renderer,
  Method: Method,
  UserInterface: UserInterface
};


// src/exports.js ends
})();