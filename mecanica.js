(function(){
'use strict';


;// src/component.js begins

/**
 * component.js
 * super class
 */


var UNDEFINED = undefined;
var RUNS_PHYSICS = true;
var RUNS_WEBGL = true;

var _ = require('lib/underscore.js');
var ammoHelper = require('lib/ammo.js');
var utils = require('util/utils.js');

var Ammo, THREE, jQuery;

if (RUNS_PHYSICS) {
  Ammo = ammoHelper;
}
if (RUNS_WEBGL) {
  THREE = require('lib/three.js');
  jQuery = require('lib/jquery.js');
}

function extend(target, source) {
  _.defaults(target.prototype, source.prototype);
}

function Component() {

}

Component.prototype.runsPhysics = function () {
  return RUNS_PHYSICS;
};

Component.prototype.runsWebGL = function () {
  return RUNS_WEBGL;
};

Component.prototype.runsRender = function () {
  return RUNS_WEBGL;
};

Component.prototype.runsInWorker = function () {
  return utils.isBrowserWorker();
};

Component.prototype.include = function (options, defaults) {
  var target = this;
  //target._originalOptions = options;
  options = _.extend(defaults, _.pick(options || {}, _.keys(defaults), [
    'id', 'group', 'type', 'comment'
  ]));
  _.extend(target, options);
  target._options = options;
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
  cons.call(this, options, system);
};

Component.prototype.types = {};

Component.prototype.maker = {};

Component.prototype.debug = function () {
  return false;
};

Component.prototype.getSettings = function () {
  if (this.parentSystem == this) {
    return this.getObject('settings', _.keys(this.objects['settings'])[0]) || {};
  } else if (this.parentSystem) {
    return this.parentSystem.getSettings();
  }
};

Component.prototype.getScene = function () {
  if (this.parentSystem == this) {
    return this.getObject('scene', _.keys(this.objects['scene'])[0]) || {};
  } else if (this.parentSystem) {
    return this.parentSystem.getScene();
  }
};

Component.prototype.destroy = function () {
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
  if (this.runsWebGL()) {
    this[funName] = reference;
  }
};

Component.prototype.toJSON = function () {
  return utils.deepCopy(this._options);
};


// src/component.js ends

;// src/settings.js begins

function Settings(options, system) {
  this.construct(options, system, 'local');
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
// src/settings.js ends

;// src/system.js begins

/**
 * system.js
 *
 */

function System(options, system) {
  this.construct(options, system, 'basic');
}

System.prototype.types = {
  //base and axis are specified in local coordinates
  basic: function (options) {
    this.include(options, {});
    this.objects = {
      shape: {}, //sphere, box, cylinder, cone ...
      material: {}, //basic, phong, lambert ? ...
      body: {}, //shape + mesh
      connector: {}, //this should not be here! it should be accessed and destroyed within the body
      system: {}, //high level structure of objects, identified by keys
      constraint: {}, //point, slider, hinge ...
      method: {} //methods available to the system
    };
    this.load(options);
  }
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
  if (arguments[0] instanceof Array) {
    return this.getObject.apply(this, arguments[0]);
  }
  //TODO make this recursive
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
};

System.prototype.getSome = function (group) {
  var obj = this.getObject(group);
  return obj[_.keys(obj)[0]];
};

System.prototype.getSystem = function (id) {
  return this.getObject('system', id);
};

System.prototype.getBody = function (id) {
  return this.getObject('body', id);
};

System.prototype.getConstraint = function (id) {
  return this.getObject('constraint', id);
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
    console.log('make', arguments);
    console.error('group is not defined');
    return undefined;
  }
  //type = type || '_default';
  var cons = this.maker[group];
  var obj;
  if (typeof cons == 'function') {
    if (typeof(options) != 'object') options = {};
    if (!options.id) options.id = this.nextId(type);
    options.group = group;
    options.type = type;
    obj = new cons(options, this);
    if (!options._dontSave && this.objects[group]) {
      if (this.objects[group][obj.id]) throw group + '.' + obj.id + ' already exists';
      this.objects[group][obj.id] = obj;
    }
    this.debug() && console.log('make ' + group + '.' + type + ' ' + JSON.stringify(obj.options()));
  } else {
    console.warn('incapable of making object:');
    console.log(JSON.stringify(arguments));
  }
  return obj;
};


System.prototype.import = function (url, options) {
  try {
    var json = require(url).getObject(options);
    this.load(json);
  } catch (e) {
    console.log('System.import: ' + url);
    console.error(e);
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
    console.error(e);
  }
};

System.prototype.loadSystem = function (json, id) {
  try {
    json = json || {};
    json.id = id;
    return this.make('system', json);
  } catch (e) {
    console.log('System.loadSystem: ' + id);
    console.error(e);
  }
};

System.prototype.destroy = function (scene) {
  if (!scene) scene = this.getScene();
  _.each(this.objects, function (groupObjects, groupName) {
    _.each(groupObjects, function (obj, key) {
      obj.destroy(scene);
      delete groupObjects[key];
    });
  });
  delete this.parentSystem.objects['system'][this.id];
};

System.prototype.addToScene = function (scene) {
  if (!scene) scene = this.getScene();
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

extend(System, Component);
Component.prototype.maker.system = System;
// src/system.js ends

;// src/mechanic.js begins

function Mecanica(options) {
  if (!options) options = {};
  this.objects = {
    settings: {}, //preferences
    scene: {}, //three scene + ammo world
    system: {}, //high level structure of objects, identified by keys
    light: {},
    monitor: {} //set of camera + renderer
  };
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

// src/mechanic.js ends

;// src/method.js begins


// src/method.js ends

;// src/vector.js begins

function Vector(options) {
  this.include(options, {
    x: 0, y: 0, z: 0
  });
  if (this.runsPhysics()) this.ammo = new Ammo.btVector3(this.x, this.y, this.z);
  if (this.runsWebGL()) this.three = new THREE.Vector3(this.x, this.y, this.z);
}

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
  if (this.runsWebGL()) {
    this.three = new THREE.Quaternion(this.x, this.y, this.z, this.w);
  }
}

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
    if (this.runsPhysics()) this.ammo = new Ammo.btSphereShape(this.r);
    if (this.runsWebGL()) this.three = new THREE.SphereGeometry(this.r, this.segments, this.segments);
  },
  box: function (options) {
    this.include(options, {
      dx: 1, dy: 1, dz: 1, segments: 1
    });
    if (this.runsPhysics()) this.ammo = new Ammo.btBoxShape(new Ammo.btVector3(this.dx / 2, this.dy / 2, this.dz / 2));
    if (this.runsWebGL()) {
      this.three = new THREE.BoxGeometry(
        this.dx, this.dy, this.dz,
        this.segments, this.segments, this.segments
      );
    }
  },
  cylinder: function (options) {
    this.include(options, {
      r: 1, dy: 1, segments: 12
    });
    if (this.runsPhysics()) this.ammo = new Ammo.btCylinderShape(new Ammo.btVector3(this.r, this.dy / 2, this.r));
    if (this.runsWebGL()) this.three = new THREE.CylinderGeometry(this.r, this.r, this.dy, this.segments);
  },
  cone: function (options) {
    this.include(options, {
      r: 1, dy: 1, segments: 12
    });
    if (this.runsPhysics()) this.ammo = new Ammo.btConeShape(this.r, this.dy);
    if (this.runsWebGL()) this.three = new THREE.CylinderGeometry(0, this.r, this.dy, this.segments);
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
    var _this = this;
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
      var child = new Shape(childOptions, _this.parentSystem);
      var pos = new Vector(childOptions.position || {});
      var qua = new Quaternion(childOptions.rotation || {});
      if (_this.runsPhysics()) {
        var transChild = new Ammo.btTransform;
        transChild.setIdentity();
        transChild.setRotation(qua.ammo);
        transChild.setOrigin(pos.ammo);
        compound.addChildShape(transChild, child.ammo);
        Ammo.destroy(transChild);
      }
      if (_this.runsWebGL()) {
        var tc = new THREE.Matrix4;
        tc.makeRotationFromQuaternion(qua.three);
        tc.setPosition(pos.three);
        _this.parent.three.merge(child.three, tc);
      }
    });
    if (this.runsPhysics()) {
      this.ammo = compound;
    }
    if (this.runsWebGL()) {
      this.three = this.parent.three;
    }
  }
};

extend(Shape, Component);
Component.prototype.maker.shape = Shape;
// src/shape.js ends

;// src/material.js begins

function Material(options, system) {
  this.construct(options, system, 'phong');
}

Material.prototype.types = {
  basic: function (options) {
    this.include(options, {
      friction: 0.3, restitution: 0.2,
      color: 0x333333, opacity: 1, transparent: false,
      wireframe: this.getSettings().wireframe || false
    });
    if (this.runsWebGL()) this.three = new THREE.MeshBasicMaterial(this.options());
  },
  phong: function (options) {
    this.include(options, {
      friction: 0.3, restitution: 0.2,
      color: 0x333333, opacity: 1, transparent: false,
      emissive: 0x000000, specular: 0x555555,
      wireframe: this.getSettings().wireframe || false
    });
    if (this.runsWebGL()) this.three = new THREE.MeshPhongMaterial(this.options());
  }
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
    if (this.runsWebGL()) {
      var light = new THREE.DirectionalLight(this.color);
      light.position.copy(new Vector(this.position).three);
      if (typeof(this.lookAt) == 'object') {
        light.target.position.copy(new Vector(this.lookAt).three);
      }
      if (this.castShadow) {
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
    if (this.runsWebGL()) {
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
      mass: 0, position: {}, quaternion: undefined, rotation: undefined,
      connector: {}, axisHelper: this.getSettings().axisHelper
    });
    this.notifyUndefined(['shape', 'material']);

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
    this.quaternion = new Quaternion(this.quaternion || this.rotation || {w: 1});


    if (this.runsWebGL()) {
      this.three = new THREE.Mesh(shape.three, material.three);
      if (this.axisHelper) {
        shape.three.computeBoundingSphere();
        var r = shape.three.boundingSphere.radius * 1.5;
        this.three.add(new THREE.AxisHelper(r));
      }
    }
    if (this.runsPhysics()) {
      this.ammoTransform = new Ammo.btTransform(this.quaternion.ammo, this.position.ammo);
    }
    _.each(this.connector, function (c, id) {
      c.bodyObject = _this;
      c.body = _this.id;
      c.id = id;
      new Connector(c, _this.parentSystem);
    });
  }
};

/**
 * updates ammo and three position and rotation from the objects position and rotation
 */
Body.prototype.updateMotionState = function () {
  if (this.runsWebGL()) {
    this.three.quaternion.copy(this.quaternion.three);
    this.three.position.copy(this.position.three);
  }
  if (this.runsPhysics()) {
    this.ammoTransform.setIdentity();
    this.ammoTransform.setRotation(this.quaternion.ammo);
    this.ammoTransform.setOrigin(this.position.ammo);
    var inertia = new Ammo.btVector3(0, 0, 0);
    if (this.mass) this.shape.ammo.calculateLocalInertia(this.mass, inertia);
    var motionState = new Ammo.btDefaultMotionState(this.ammoTransform);
    var rbInfo = new Ammo.btRigidBodyConstructionInfo(this.mass, motionState, this.shape.ammo, inertia);
    this.ammo = new Ammo.btRigidBody(rbInfo);
  }
};

Body.prototype.addToScene = function (scene) {
  if (!this._added) {
    this._added = true;
    this.updateMotionState();
    if (this.runsWebGL()) scene.three.add(this.three);
    if (this.runsPhysics()) scene.ammo.addRigidBody(this.ammo);
  }
};

/**
 * copy the positions and rotation from ammo object to three object
 * in between updating also position and rotation assigned to the object
 */
Body.prototype.syncPhysics = function () {
  var body = this;
  var trans;
  //copy physics from .ammo object
  if (this.runsPhysics()) {
    trans = this._trans;
    //keep the transform instead of creating all the time
    if (!trans) {
      trans = new Ammo.btTransform();
      this._trans = trans;
    }
    body.ammo.getMotionState().getWorldTransform(trans);
    var position = trans.getOrigin();
    body.position.x = position.x();
    body.position.y = position.y();
    body.position.z = position.z();
    var quaternion = trans.getRotation();
    body.quaternion.x = quaternion.x();
    body.quaternion.y = quaternion.y();
    body.quaternion.z = quaternion.z();
    body.quaternion.w = quaternion.w();
  }
  //copy physics to .three object
  if (!this.runsInWorker()) {
    body.three.position.copy(body.position);
    body.three.quaternion.copy(body.quaternion);
  }
};
/*
 get position and rotation to send from worker to window
 the result is passed by reference in the argument
 */
Body.prototype.packPhysics = function (myPhysics) {
  if (!myPhysics.position) myPhysics.position = {};
  if (!myPhysics.quaternion) myPhysics.quaternion = {};
  myPhysics.position.x = this.position.x;
  myPhysics.position.y = this.position.y;
  myPhysics.position.z = this.position.z;
  myPhysics.quaternion.x = this.quaternion.x;
  myPhysics.quaternion.y = this.quaternion.y;
  myPhysics.quaternion.z = this.quaternion.z;
  myPhysics.quaternion.w = this.quaternion.w;
};

Body.prototype.destroy = function (scene) {
  _.each(this.connector, function (c) {
    c.destroy();
  });
  if (this.runsRender()) {
    scene.three.remove(this.three);
    this.three.geometry.dispose();
    this.three.material.dispose();
  }
  if (this.runsPhysics()) {
    scene.ammo.removeRigidBody(this.ammo);
    Ammo.destroy(this.ammo);
  }
};

extend(Body, Component);
Component.prototype.maker.body = Body;
// src/body.js ends

;// src/connector.js begins

function Connector(options, system){
  this.construct(options, system, 'relative');
}

Connector.prototype.types = {
  //base and axis are specified in local coordinates
  relative: function (options) {
    this.include(options, {
      body: undefined, //the parent body id
      base: {x: 0, y: 0, z: 0}, //origin
      up: {x: 0, y: 0, z: 0}, //axis of rotation or direction of movement, normalized
      front: {x: 0, y: 0, z: 0} //defines the angle, should be perpendicular to 'up', normalized
    });
    this.notifyUndefined(['body', 'base', 'up', 'front']);
    var body = options.bodyObject || this.parentSystem.getObject('body', this.body);
    if (body) {
      body.connector[this.id] = this;
      this.body = body;
      this.ammoTransform = utils.normalizeConnector(this, ammoHelper);
      this.base = new Vector(this.base);
      this.up = new Vector(this.up);
      this.front = new Vector(this.front);
      //check for orthogonality
      var helper = this.getSettings().connectorHelper;
      if (THREE && helper) {
        //TODO reuse material and geometry
        var connectorHelperMaterial = new THREE.MeshBasicMaterial({
          color: 0x555555,
          transparent: true,
          opacity: 0.5
        });
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
      ratio: undefined,
      approach: false //move bodyB towards bodyA to match connectors
    });
    this.notifyUndefined(['connectorA', 'connectorB', 'bodyA', 'bodyB']);
    if (this.runsPhysics()) {
      this.bodyA = this.parentSystem.getObject('body', this.bodyA);
      this.bodyB = this.parentSystem.getObject('body', this.bodyB);
      this.connectorA = this.bodyA.connector[this.connectorA];
      this.connectorB = this.bodyB.connector[this.connectorB];
      if (this.approach) {
        utils.approachConnectors(this.connectorA, this.connectorB, this.parentSystem.make, Ammo);
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
    Constraint.prototype.types.hinge.call(this, options);
    this.addPhysicsMethod('enable', Constraint.prototype.methods.enable);
    this.addPhysicsMethod('disable', Constraint.prototype.methods.disable);
  },
  //like robotic servo motors, based on the hinge constraint
  servo: function (options) {
    this.include(options, {
      angle: 0,
      lowerLimit: 0,
      upperLimit: Math.PI,
      maxBinary: 1,
      maxVelocity: 0.5
    });
    Constraint.prototype.types.hinge.call(this, options);
    this.afterCreate = function () {
      this.ammo.setLimit(this.lowerLimit, this.upperLimit, 0.9, 0.3, 1.0);
    };
    this.beforeStep = function () {
      if (this.runsPhysics()) {
        var c = this;
        //FIXME
        //https://llvm.org/svn/llvm-project/test-suite/trunk/MultiSource/Benchmarks/Bullet/include/BulletDynamics/ConstraintSolver/btHingeConstraint.h
        //"setMotorTarget sets angular velocity under the hood, so you must call it every tick to  maintain a given angular target."
        //var dt = Math.abs(c.ammo.getHingeAngle() - c.angle) / c.maxVelocity;
        c.ammo.setMotorTarget(c.angle, 0.1);
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
    Constraint.prototype.types._abstract.call(this, options);
    if (this.runsPhysics()) {
      this.create = function () {
        this.ammo = new Ammo.btHingeConstraint(
          this.bodyA.ammo, this.bodyB.ammo, this.connectorA.base.ammo, this.connectorB.base.ammo,
          this.connectorA.up.ammo, this.connectorB.up.ammo
        );
      };
    }
  },
  gear: function (options) {
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
    Constraint.prototype.types.slider.call(this, options);
    this.create = function () {
      this.ammo = new Ammo.btSliderConstraint(
        this.bodyA.ammo, this.bodyB.ammo, this.transformA, this.transformB, true
      );
    };
    this.afterCreate = function () {
      var c = this;
      c.ammo.setLowerAngLimit(0);
      c.ammo.setUpperAngLimit(0);
      c.ammo.setPoweredAngMotor(false);
      c.ammo.setLowerLinLimit(c.lowerLimit);
      c.ammo.setUpperLinLimit(c.upperLimit);
      c.ammo.setMaxLinMotorForce(c.maxForce);
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
      transformA.setOrigin(this.a.base.ammo);

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
      transformB.setOrigin(this.b.base.ammo);

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
    }
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
      Ammo.destroy(this.ammo);
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
    }
  },
  //linear motors only
  setPosition: function (position) {
    if (this.runsPhysics()) {
      //TODO do this the proper way, with target velocity. This is like forcing position and using brakes          this.position = position;
      this.position = position;
      this.ammo.setLowerLinLimit(position);
      this.ammo.setUpperLinLimit(position);
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
      gravity: {y: -9.81}
    });
    var settings = this.getSettings();
    if (this.runsWebGL()) {
      this.three = new THREE.Scene();
      if (settings.axisHelper) {
        if (this.runsWebGL()) this.three.add(new THREE.AxisHelper(settings.axisHelper));
      }
    }
    if (this.runsPhysics()) {
      this.btDefaultCollisionConfiguration = new Ammo.btDefaultCollisionConfiguration();
      this.btCollisionDispatcher = new Ammo.btCollisionDispatcher(this.btDefaultCollisionConfiguration);
      this.btDbvtBroadphase = new Ammo.btDbvtBroadphase();
      this.btSequentialImpulseConstraintSolver = new Ammo.btSequentialImpulseConstraintSolver();
      this.ammo = new Ammo.btDiscreteDynamicsWorld(
        this.btCollisionDispatcher,
        this.btDbvtBroadphase,
        this.btSequentialImpulseConstraintSolver,
        this.btDefaultCollisionConfiguration
      );
      this.ammo.setGravity(new Vector(this.gravity).ammo);
    }
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
    if (this.runsWebGL()) {
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
    if (this.lookAt instanceof Body) {
    } else {
      this.lookAt = this.parentSystem.getObject('body', this.lookAt);
    }
    if (this.runsWebGL()) {
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
    if (this.lookAt instanceof Body) {
    } else if (typeof(this.lookAt) == 'string') {
      this.lookAt = this.parentSystem.getObject('body', this.lookAt);
    } else {
      this.lookAt = new Vector(this.lookAt);
    }
    if (this.runsWebGL()) {
      this.axis.three.normalize();
      this.three = new THREE.PerspectiveCamera(this.fov, this.aspect, this.near, this.far);
    }
    this.addRenderMethod('move', Camera.prototype.methods.moveSatellite);
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

function Monitor(options, system){
  this.construct(options, system, 'complete');
}

Monitor.prototype.types = {
  complete: function (options, system) {
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
    var o = this.optionsWithoutId();
    o.aspect = o.width / o.height;
    this.renderer = system.make('renderer', o.renderer, o);
    this.camera = system.make('camera', o.camera, o);
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
    if (this.runsWebGL()) {
      this.three = new THREE.WebGLRenderer({canvas: this.canvas});
    }
    Renderer.prototype.types._outro.call(this);
  },
  canvas: function (options) {
    Renderer.prototype.types._intro.call(this, options);
    if (this.runsWebGL()) {
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

function UserInterface(options, system) {
  this.construct(options, system, 'basic');
}

UserInterface.prototype.types = {
  basic: function (options) {
    this.include(options, {
      values: undefined,
      template: {},
      container: this.getSettings().uiContainer
    });
    this.notifyUndefined(['values', 'container']);
    if (this.runsRender) {
      if (typeof $ === 'undefined') {
        $ = jQuery;
      }
      this.updaters = [];
      this.reference = {};
      this.showEditor();
    }
  }
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

UserInterface.prototype.showEditor = function () {
  while (this.updaters.pop()) {
  }
  this.reference = {};
  var domElements = this.build(this.values, this.template, this.reference);
  //$(this.container).empty();
  $(this.container).append(domElements);
};


UserInterface.prototype.build = function (obj, temp, ref, $parent) {
  var _this = this;
  if (!$parent) {
    $parent = $('<div />');
    $parent.css(_this.css.level);
  }
  _.each(obj, function (v, k) {
    var specs = _this.templateFor(k, v, temp);
    var type = specs.type;
    var $wrapper = $('<div />');
    $wrapper.css(_this.css.wrapper);
    var $key = $('<span />');
    $key.text(k + '');
    $key.css(_this.css.key);
    var $value;
    if (typeof v == 'object') { //folders
      var $folded = $('<span>' + FOLDER_SYMBOL + '</span>');
      $folded.css(_this.css.folded);
      $value = _this.build(v, specs, ref[k] = {});
      $key.append($folded);
      $key.css(_this.css.object);
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
          if (!isNaN(obj[k])) {
            obj[k] = Number(obj[k]);
          }
        });
      }
      ref[k] = $value;
      $value.css(_this.css.value);
      $value.css(_this.css[type] || {});
    }
    if (specs.onChange) $value.on('change', specs.onChange);
    //extend css from specs
    $key.css(specs.keyCSS || {});
    $value.css(specs.valueCSS || {});
    $wrapper.css(specs.wrapperCSS || {});

    if (!specs.noKey) $wrapper.append($key);
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
    return this.string(k, v, specs);
  },
  boolean: function (k, v, specs) {
    _.defaults(specs, {
      type: 'boolean', t: true, f: false
    });
    var e = $('<span />');
    e.text(v);
    e.on('click', function (evt) {
      var tgt = $(evt.target);
      tgt.text(tgt.text() == ('' + specs.t) ? specs.f : specs.t);
    });
    e[GET_VALUE] = function () {
      var txt = e.text();
      return (txt === 'true' || txt === 'false') ? eval(txt) : txt;
    };
    e[SET_VALUE] = function (a) {
      e.text('' + a);
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
    e.on('click', function () {
      if (typeof v == 'function') v.call(_this);
    });
    return e;
  },
  list: function (k, v, specs) {
    _.defaults(specs, {
      type: 'function', values: []
    });
    var _this = this;
    var e = $('<select />');
    _.each(specs.values, function (val) {
      var o = $('<option>' + val + '</option>');
      if (val == v) o.attr('selected', 'selected');
      o.css(_this.css.list);
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
      plus: '+', minus: '-', editable: true
    });
    var _this = this;
    var $wrapper = $('<span />');
    var $v = $('<span>' + v + '</span>');
    if (specs.editable) $v.attr('contenteditable', 'true');
    $v.css(_this.css.rangeValue);
    var values = specs.values;
    var step = Number(specs.step);
    var max = specs.max;
    var min = specs.min;
    _.each(['minus', 'plus'], function (d, i) {
      var $d = $('<span />');
      $d.text(specs[d]);
      $d.css(_this.css.pm);
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
        timeoutId = setTimeout(u, utils.time(time) < 1000 ? 150 : 30);
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

UserInterface.prototype.css = {
  level: {
    'border': '1px dashed transparent',
    'margin': '0 1em'
  },
  wrapper: {
    'margin': '2px 1px',
    'font-size': '0.8rem',
    'padding': '1px',
    'clear': 'both'
  },
  string: {
    'padding': '1px 5px',
    'cursor': 'auto',
    'color': '#112',
    'font-style': 'italic',
    'float': 'left'
  },
  number: {
    'padding': '1px 5px',
    'cursor': 'auto',
    'color': '#112',
    'font-weight': 'bold',
    'float': 'left'
  },
  'color': {
    'color': 'black',
    'text-shadow': '1px 1px gray',
    'font-style': 'italic'
  },
  boolean: {
    'font-weight': 'bold',
    'user-select': 'none'
  },
  rangeValue: {
    'margin-left': '1em',
    'background-color': '#999',
    'padding': '1px 10px',
    'margin': '0px 3px',
    'cursor': 'pointer',
    'border-radius': '3px',
    'border': '0px solid transparent'
  },
  range: {
    'cursor': 'auto',
    'background-color': 'transparent',
    'padding': '0px 2px'
  },
  'function': {
    'border': '0',
    'margin': '2px 3px',
    'min-width': '30px',
    'font-weight': 'bold',
    'border-radius': '0.3em'
  },
  key: {
    'margin': '1px',
    'float': 'left'
  },
  value: {
    'background-color': '#999',
    'color': '#111',
    'padding': '1px 10px',
    'margin': '1px 3px',
    'cursor': 'pointer',
    'border-radius': '3px',
    'border': '0px solid transparent'
  },
  'object': {
    'color': '#ccc',
    'font-weight': 'bold',
    'cursor': 'pointer'
  },
  list: {
    'color': '#111'
  },
  folded: {
    'color': '#777'
  },
  pm: {
    'cursor': 'pointer',
    'color': '#311',
    'margin': '0 2px',
    'border': '1 px solid transparent',
    'border-radius': '10px',
    'padding': '0 5px',
    'background-color': '#777',
    'font-weight': 'normal',
    'user-select': 'none'
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
  UserInterface: UserInterface
};


// src/exports.js ends
})();