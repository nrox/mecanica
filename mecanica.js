(function(){
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

Component.prototype.include = function (options, defaults) {
  var target = this;
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
  this.system = system;
  cons.call(this, options, system);
};

Component.prototype.types = {};

Component.prototype.maker = {};

Component.prototype.debug = function () {
  return false;
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

function System(options, system) {
  this.construct(options, system, 'basic');
}

System.prototype.types = {
  //base and axis are specified in local coordinates
  basic: function (options) {
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
  },
  mecanica: function (options) {
    var settings = new Settings(options);
    System.prototype.types.basic.call(this);
    this.objects.settings.use = settings.options();
    this.include({}, settings.options());
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
    options.group = group;
    options.type = type;
    obj = new cons(options, this);
    if (!options._dontSave && this.objects[group]) this.objects[group][obj.id] = obj;
    this.debug() && console.log('make ' + group + '.' + type + ' ' + JSON.stringify(obj.options()));
  } else {
    console.warn('incapable of making object:');
    console.log(JSON.stringify(arguments));
  }
  return obj;
};

System.prototype.getSettings = function () {
  //FIXME
  return this.getObject('settings', _.keys(this.objects['settings'])[0]) || {};
};

System.prototype.getScene = function () {
  //FIXME
  return this.getObject('scene', _.keys(this.objects['scene'])[0]) || {};
};

System.prototype.loadJSON = function (json) {
  var _this = this;
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

  loadSystem(this.objects);

  function loadSystem(objs) {
    _.each(objs.system, loadSystem);
    _.each(objs.body, function (body) {
      if (!body._added && (body._added = true)) {
        body.updateMotionState();
        if (_this.runsWebGL()) scene.three.add(body.three);
        if (_this.runsPhysics()) scene.ammo.addRigidBody(body.ammo);
      }
    });
    _.each(objs.constraint, function (cons) {
      cons.add();
    });
    if (_this.runsWebGL()) {
      _.each(objs.light, function (light) {
        if (!light._added && (light._added = true)) {
          scene.three.add(light.three);
        }
      });
    }
  }
};

extend(System, Component);
Component.prototype.maker.system = System;


function Mecanica(options) {
  this.construct(options, this, 'mecanica');
  this.make('scene', {});
}

Mecanica.prototype.destroy = function () {

};

Mecanica.prototype.import = function (url, id) {
  console.log(url);
  var json = require(url);
  console.log(json);
  var sys = new System({
    id: id,
    type: 'basic'
  }, this);
  sys.loadJSON(json);
};

extend(Mecanica, System);


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
function Material(options, system) {
  this.construct(options, system, 'phong');
}

Material.prototype.types = {
  basic: function (options) {
    this.include(options, {
      friction: 0.3, restitution: 0.2,
      color: 0x333333, opacity: 1, transparent: false,
      wireframe: this.system.getSettings().wireframe || false
    });
    if (this.runsWebGL()) this.three = new THREE.MeshBasicMaterial(this.options());
  },
  phong: function (options) {
    this.include(options, {
      friction: 0.3, restitution: 0.2,
      color: 0x333333, opacity: 1, transparent: false,
      emissive: 0x000000, specular: 0x555555,
      wireframe: this.system.getSettings().wireframe || false
    });
    if (this.runsWebGL()) this.three = new THREE.MeshPhongMaterial(this.options());
  }
};

extend(Material, Component);
Component.prototype.maker.material = Material;


function Light(options, system) {
  this.construct(options, system, 'directional');
}

Light.prototype.types = {
  directional: function (options) {
    this.include(options, {
      color: 0xbbbbbb, position: {x: 10, y: 5, z: 3},
      lookAt: {}, castShadow: this.system.getSettings().castShadow,
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
        light.shadowMapWidth = light.shadowMapHeight = this.system.getSettings().shadowMapSize;
        light.shadowDarkness = 0.35;
      }
      this.three = light;
    }
  }
};

extend(Light, Component);
Component.prototype.maker.light = Light;
function Body(options, system) {
  this.construct(options, system, 'basic');
}

Body.prototype.types = {
  basic: function (options) {
    this.include(options, {
      shape: undefined,
      material: undefined,
      mass: 0, position: {}, quaternion: undefined, rotation: undefined,
      connector: {}, axisHelper: this.system.getSettings().axisHelper
    });
    this.notifyUndefined(['shape','material']);

    var shape;
    var _this = this;
    if (typeof this.shape == 'string') { //get from objects with id
      shape = this.system.getObject('shape', this.shape);
    } else { //make from options
      shape = new Shape(this.shape, this.system);
    }
    this.shape = shape;

    var material;
    if (typeof this.material == 'string') { //get from objects with id
      material = this.system .getObject('material', this.material);
    } else { //make from options
      material = new Material(this.material, this.system );
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
      new Connector(c, _this.system );
    });
  }
};

Body.prototype.updateMotionState =function () {
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

extend(Body, Component);
Component.prototype.maker.body = Body;
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
    var body = options.bodyObject || this.system.getObject('body', this.body);
    if (body) {
      body.connector[this.id] = this;
      this.body = body;
      this.ammoTransform = utils.normalizeConnector(this, ammoHelper);
      this.base = new Vector(this.base);
      this.up = new Vector(this.up);
      this.front = new Vector(this.front);
      //check for orthogonality
      var helper = this.system.getSettings().connectorHelper;
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
      this.bodyA = this.system.getObject('body', this.bodyA);
      this.bodyB = this.system.getObject('body', this.bodyB);
      this.connectorA = this.bodyA.connector[this.connectorA];
      this.connectorB = this.bodyB.connector[this.connectorB];
      if (this.approach) {
        utils.approachConnectors(this.connectorA, this.connectorB, this.system.make, Ammo);
      }
    }
    this.addPhysicsMethod('add', Constraint.prototype.methods.add);
    this.addPhysicsMethod('remove', Constraint.prototype.methods.remove);
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
    this.addPhysicsMethod('disable',Constraint.prototype.methods.disable);
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
  add: function () {
    if (!this._added && this.runsPhysics()) {
      this.create();
      if (this.afterCreate) this.afterCreate();
      this.system.getScene().ammo.addConstraint(this.ammo);
      this._added = true;
      this.bodyA.ammo.activate();
      this.bodyB.ammo.activate();
    }
  },
  remove: function () {
    if (this._added && this.runsPhysics()) {
      this.system.getScene().ammo.removeConstraint(this.ammo);
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
function Scene(options, system) {
  this.construct(options, system, 'basic');
}

Scene.prototype.types = {
  basic: function (options, system) {
    this.include(options, {
      gravity: {y: -9.81}
    });
    if (this.runsWebGL()) {
      this.three = new THREE.Scene();
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
function Camera(options, system){
  this.construct(options, system, 'perspective');
}

Camera.prototype.types = {
  perspective: function (options) {
    this.include(options, {
      fov: 45, aspect: 1, near: 0.1, far: 1000,
      position: {x: 5, y: 7, z: 10},
      lookAt: {}
    });
    this.position = new Vector(this.position);
    if (this.runsWebGL()) {
      this.three = new THREE.PerspectiveCamera(this.fov, this.aspect, this.near, this.far);
      this.three.position.copy(this.position.three);
      this.three.lookAt(new Vector(this.lookAt).three);
    }
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
    this.lookAt = this.system.getObject('body', this.lookAt);
    if (this.runsWebGL()) {
      this.axis.three.normalize();
      this.three = new THREE.PerspectiveCamera(this.fov, this.aspect, this.near, this.far);
    }
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
    this.axis =new Vector(this.axis);
    if (typeof(this.lookAt) == 'string') {
      this.lookAt = this.system.getObject('body', this.lookAt);
    } else {
      this.lookAt = new Vector(this.lookAt);
    }
    if (this.runsWebGL()) {
      this.axis.three.normalize();
      this.three = new THREE.PerspectiveCamera(this.fov, this.aspect, this.near, this.far);
    }
  }
};

extend(Camera, Component);
Component.prototype.maker.camera = Camera;
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
function Renderer(options, system) {
  this.construct(options, system, 'available');
}

Renderer.prototype.types = {
  available: function (options, system) {
    try {
      Renderer.prototype.types.webgl.call(this, options, system);
    } catch (e) {
      Renderer.prototype.types.canvas.call(this, options, system);
    }
  },
  _intro: function (options, system) {
    this.include(options, {
      width: 500, height: 500, container: undefined
    });
    if (jQuery && THREE) {
      if (system.getSettings().reuseCanvas) {
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
  _outro: function (options, system) {
    if (jQuery && THREE) {
      var settings = system.getSettings();
      jQuery(settings.canvasContainer).append(this.three.domElement);
      jQuery(this.three.domElement).attr('monitor', this.id);
      this.three.setSize(this.width, this.height);
    }
  },
  webgl: function (options, system) {
    Renderer.prototype.types._intro.call(this, options, system);
    if (this.runsWebGL()) {
      this.three = new THREE.WebGLRenderer({canvas: this.canvas});
    }
    Renderer.prototype.types._outro.call(this, options, system);
  },
  canvas: function (options, system) {
    Renderer.prototype.types._intro.call(this, options, system);
    if (this.runsWebGL()) {
      this.three = new THREE.CanvasRenderer({canvas: this.canvas});
    }
    Renderer.prototype.types._outro.call(this, options, system);
  }
};

extend(Renderer, Component);
Component.prototype.maker.renderer = Renderer;
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
  Shape: Shape,
  Material: Material,
  Body: Body,
  Connector: Connector,
  Constraint: Constraint,
  Light: Light,
  Scene: Scene,
  Camera: Camera,
  Monitor: Monitor,
  Renderer: Renderer
};


})();