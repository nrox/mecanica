(function(){
/**
 * component.js
 * super class
 */


var _ = require('lib/underscore.js');
var Ammo = require('lib/ammo.js');
var THREE = require('lib/three.js');

var UNDEFINED = undefined;
var RUNS_PHYSICS = true;
var RUNS_WEBGL = true;

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

Component.prototype.system = function () {
  if (arguments[0]) this._parent = arguments[0];
  return this._parent;
};

Component.prototype.include = function (options, defaults) {
  var target = this;
  options = _.extend(defaults, _.pick(options, _.keys(defaults), [
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

Component.prototype.maker = {};

Component.prototype.debug = function () {
  return false;
};

function Mecanica(options) {
  this.include(options, {
    worker: false, //use web worker for simulations
    server: false,//runs simulation in ndoe.js server side
    render: true //render using webgl
  });
}

Mecanica.prototype.destroy = function () {

};

extend(Mecanica, Component);




function Settings(options) {
  this.include(options, {
    wireframe: false, //show wireframes
    axisHelper: 0, //show an axis helper in the scene and all bodies
    connectorHelper: 0,
    canvasContainer: 'body', //container for renderer,
    reuseCanvas: true,
    webWorker: true, //use webworker if available
    autoStart: true, //auto start simulation and rendering
    simSpeed: 1, //simulation speed factor, 1 is normal, 0.5 is half, 2 is double...
    renderFrequency: 30, //frequency to render canvas
    simFrequency: 30, //frequency to run a simulation cycle,
    castShadow: true, //light cast shadows,
    shadowMapSize: 1024 //shadow map width and height
  });
}

extend(Settings, Component);
Component.prototype.maker.settings = Settings;
/**
 * system.js
 *
 */

function System(options) {
  this.include(options, {});
  this.objects = {
    settings: {}, //preferences
    scene: {}, //three scene + ammo world
    system: {}, //high level structure of objects, identified by keys
    shape: {}, //sphere, box, cylinder, cone ...
    material: {}, //basic, phong, lambert ? ...
    body: {}, //shape + mesh
    connector: {}, //this should not be here! it should be accessed and destroyed within the body
    constraint: {}, //point, slider, hinge ...
    light: {},
    monitor: {}, //set of camera + renderer
    method: {} //methods available to the system
  };
}

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
  var obj = this.objects;
  for (var i = 0; i < arguments.length; i++) {
    obj = obj[arguments[i]];
    if (!obj) break;
  }
  return obj;
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
  type = type || '_default';
  var cons = this.maker[group];
  var obj;
  if (typeof cons == 'function') {
    if (typeof(options) != 'object') options = {};
    if (!options.id) options.id = this.nextId(type);
    obj = new cons(options, this);
    if (group !== 'system') obj.group = group;
    if (group !== 'system') obj.type = type;
    if (!options._dontSave && this.objects[group]) this.objects[group][obj.id] = obj;
    this.debug() && console.log('make ' + group + '.' + type + ' ' + JSON.stringify(obj.options()));
  } else {
    console.warn('incapable of making object:');
    console.log(JSON.stringify(arguments));
  }
  return obj;
};

extend(System, Component);
Component.prototype.maker.system = System;


/**
 * Created by nrox on 3/30/15.
 */

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

Component.prototype.maker.vector = Vector;
Component.prototype.maker.quaternion = Quaternion;
extend(Vector, Component);
extend(Quaternion, Component);

function Shape(options, system){
  var cons = this.types[options.type];
  cons.call(this, options, system);
}

Shape.prototype.types =  {
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
  compound: function (options, system) {
    this.include(options, {
      parent: undefined, children: undefined
    });
    this.notifyUndefined(['parent']);
    if (typeof this.parent == 'string') {
      this.parent = system.getObject('shape', this.parent);
    } else {
      this.parent = new Shape(this.parent, system);
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
      var child = new Shape(childOptions, system);
      var pos = new Vector(childOptions.position || {});
      var qua = new Quaternion(childOptions.rotation || {});
      if (this.runsPhysics()) {
        var transChild = new Ammo.btTransform;
        transChild.setIdentity();
        transChild.setRotation(qua.ammo);
        transChild.setOrigin(pos.ammo);
        compound.addChildShape(transChild, child.ammo);
        Ammo.destroy(transChild);
      }
      if (this.runsWebGL()) {
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
/**
 * Created by nrox on 3/30/15.
 */

/**
 * Created by nrox on 3/30/15.
 */

/**
 * Created by nrox on 3/30/15.
 */

/**
 * Created by nrox on 3/30/15.
 */

/**
 * Created by nrox on 3/30/15.
 */

/**
 * Created by nrox on 3/30/15.
 */

/**
 * Created by nrox on 3/30/15.
 */

/**
 * Created by nrox on 3/30/15.
 */

/**
 * Created by nrox on 3/30/15.
 */




module.exports = {
  Mecanica: Mecanica,
  Component: Component,
  System: System,
  Vector: Vector,
  Quaternion: Quaternion,
  Settings: Settings,
  Shape: Shape
};


})();