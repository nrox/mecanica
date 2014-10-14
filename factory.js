'use strict';

/**
 Functions to generate objects
 */

var _ = require('./lib/underscore.js');
var Ammo, THREE;
var debug = false;
var saveObjects = true;

var objects = {};

//this structure helps swapping worlds to json
var description = {
  physics: {
    position: function (options) {
      include(this, options, {
        x: 0, y: 0, z: 0
      });
      notifyUndefined(this);
      if (Ammo) this.ammo = new Ammo.btVector3(this.x, this.y, this.z);
      if (THREE) this.three = new THREE.Vector3(this.x, this.y, this.z);
    },
    rotation: function (options) {
      include(this, options, {
        x: 0, y: 0, z: 0
      });
      notifyUndefined(this);
      if (Ammo) this.ammo = new Ammo.btVector3(this.x, this.y, this.z);
      if (THREE) this.three = new THREE.Vector3(this.x, this.y, this.z);
    },
    quaternion: function (options) {
      include(this, options, {
        x: 1, y: 0, z: 0, w: undefined
      });
      notifyUndefined(this, ['x', 'y', 'z']);
      if (this.w === undefined) {
        //XYZ order
        var c1 = Math.cos(this.x / 2), c2 = Math.cos(this.y / 2), c3 = Math.cos(this.z / 2);
        var s1 = Math.sin(this.x / 2), s2 = Math.sin(this.y / 2), s3 = Math.sin(this.z / 2);
        this.x = s1 * c2 * c3 + c1 * s2 * s3;
        this.y = c1 * s2 * c3 - s1 * c2 * s3;
        this.z = c1 * c2 * s3 + s1 * s2 * c3;
        this.w = c1 * c2 * c3 - s1 * s2 * s3;
      }
      if (Ammo) {
        this.ammo = new Ammo.btQuaternion(this.x, this.y, this.z, this.w);
      }
      if (THREE) {
        this.three = new THREE.Quaternion(this.x, this.y, this.z, this.w);
      }
    },
    velocity: function (options) {
      include(this, options, {
        x: 0, y: 0, z: 0
      });
      if (Ammo) this.ammo = new Ammo.btVector3(this.x, this.y, this.z);
      if (THREE) this.three = new THREE.Vector3(this.x, this.y, this.z);
    }
  },
  shape: {
    sphere: function (options) {
      include(this, options, {
        r: 1, segments: 12
      });
      if (Ammo) this.ammo = new Ammo.btSphereShape(this.r);
      if (THREE) this.three = new THREE.SphereGeometry(this.r, this.segments, this.segments);
    },
    box: function (options) {
      include(this, options, {
        dx: 1, dy: 1, dz: 1, segments: 1
      });
      if (Ammo) this.ammo = new Ammo.btBoxShape(new Ammo.btVector3(this.dx / 2, this.dy / 2, this.dz / 2));
      if (THREE) {
        this.three = new THREE.BoxGeometry(
          this.dx, this.dy, this.dz,
          this.segments, this.segments, this.segments
        );
      }
    },
    cylinder: function (options) {
      include(this, options, {
        r: 1, dy: 1, segments: 12
      });
      if (Ammo) this.ammo = new Ammo.btCylinderShape(new Ammo.btVector3(this.r, this.dy / 2, this.r));
      if (THREE) this.three = new THREE.CylinderGeometry(this.r, this.r, this.dy, this.segments);
    },
    cone: function (options) {
      include(this, options, {
        r: 1, dy: 1, segments: 12
      });
      if (Ammo) this.ammo = new Ammo.btConeShape(this.r, this.dy);
      if (THREE) this.three = new THREE.CylinderGeometry(0, this.r, this.dy, this.segments);
    }
  },
  material: {
    basic: function (options) {
      include(this, options, {
        friction: 0.3, restitution: 0.2, color: 0x333333, opacity: 1, wireframe: false
      });
      if (THREE) this.three = new THREE.MeshBasicMaterial(opt(this));
    },
    phong: function (options) {
      include(this, options, {
        friction: 0.3, restitution: 0.2, color: 0x333333, opacity: 1, emissive: 0x345678
      });
      if (THREE) this.three = new THREE.MeshPhongMaterial(opt(this));
    }
  },
  body: {
    basic: function (options) {
      include(this, options, {
        shape: {type: 'box'},
        material: {type: 'basic', wireframe: false, color: 0x999999},
        mass: 0.1, position: {}, quaternion: undefined, rotation: undefined
      });
      var shape = make('shape', this.shape);
      var material = make('material', this.material);
      var position = make('physics', 'position', this.position);
      var quaternion, rotation;
      if (this.quaternion) {
        quaternion = make('physics', 'quaternion', this.quaternion);
      } else if (this.rotation) { //set from euler
        quaternion = make('physics', 'quaternion', this.rotation);
      }
      if (THREE) {
        this.three = new THREE.Mesh(shape.three, material.three);
        this.three.position.copy(position.three);
        if (quaternion) this.three.quaternion.copy(quaternion.three);
      }
      if (Ammo) {
        var transform = new Ammo.btTransform();
        transform.setIdentity();
        transform.setOrigin(position.ammo);
        if (quaternion) transform.setRotation(quaternion.ammo);
        var inertia = new Ammo.btVector3(0, 0, 0);
        if (this.mass) shape.ammo.calculateLocalInertia(this.mass, inertia);
        var motionState = new Ammo.btDefaultMotionState(transform);
        var rbInfo = new Ammo.btRigidBodyConstructionInfo(this.mass, motionState, shape.ammo, inertia);
        this.ammo = new Ammo.btRigidBody(rbInfo);
      }
    }
  },
  constraint: {
    point: function (options) {
      include(this, options, {
        a: undefined, b: undefined,
        posA: {}, posB: {}
      });
      console.log(objects);
      if (Ammo) {
        if (this.b === undefined) {
          notifyUndefined(this, ['a','posA']);
          var a = objects.body[this.a];
          var posA = make('physics', 'position', this.posA);
          this.ammo = new Ammo.btPoint2PointConstraint(a.ammo, posA.ammo);
        } else {
          notifyUndefined(this, ['a','posA','b','posB']);
          var a = objects.body[this.a];
          var posA = make('physics', 'position', this.posA);
          var b = objects.body[this.b];
          var posB = make('physics', 'position', this.posB);
          this.ammo = new Ammo.btPoint2PointConstraint(a.ammo, b.ammo, posA.ammo, posB.ammo);
        }
        console.log(this.ammo);
      }
    }
  },
  scene: { //the same as world
    basic: function (options) {
      include(this, options, {
        gravity: -9.81
      });
      if (THREE) {
        this.three = new THREE.Scene();
      }
      if (Ammo) {
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
        this.ammo.setGravity(new Ammo.btVector3(0, this.gravity, 0));
      }
    }
  },
  renderer: {
    webgl: function (options) {
      include(this, options, {
        width: 500, height: 500
      });
      if (THREE) {
        this.three = new THREE.WebGLRenderer();
        this.three.setSize(this.width, this.height);
      }
    },
    canvas: function (options) {
      include(this, options, {
        width: 500, height: 500
      });
      if (THREE) {
        this.three = new THREE.CanvasRenderer();
        this.three.setSize(this.width, this.height);
      }
    }
  },
  camera: {
    perspective: function (options) {
      include(this, options, {
        fov: 75, aspect: 1, near: 0.1, far: 1000,
        position: {x: 0, y: 0, z: 10}
      });
      if (THREE) {
        this.three = new THREE.PerspectiveCamera(this.fov, this.aspect, this.near, this.far);
        this.three.position.copy(make('physics', 'position', this.position).three);
      }
    }
  }
};

var destructor = {
  constraint: function (obj) {

  },
  body: function (obj) {

  },
  shape: function (obj) {

  },
  physics: function (obj) {

  },
  camera: function (obj) {

  },
  renderer: function (obj) {

  },
  scene: function (scene) {
    //should call this after destroying all children generated by make
    if (THREE) {
      while (scene.three.children.length) {
        var child = scene.three.children[0];
        child.geometry.dispose();
        child.material.dispose();
        scene.three.remove(child);
      }
      delete scene.three;
    }
    //TODO miss something ?
    if (Ammo) {
      Ammo.destroy(scene.btDefaultCollisionConfiguration);
      Ammo.destroy(scene.btCollisionDispatcher);
      Ammo.destroy(scene.btDbvtBroadphase);
      Ammo.destroy(scene.btSequentialImpulseConstraintSolver);
      delete scene.ammo;
    }
  }
};

function destroy(obj) {
  if (!obj) return;
  if (objects[obj.group] && objects[obj.group][obj.id]) {
    delete objects[obj.group][obj.id];
  }
  return obj.group && destructor[obj.group] && destructor[obj.group](obj);
}

function destroyAll() {
  _.each(objects, function (group) {
    _.each(group, function (obj) {
      destroy(obj);
    });
  });
}

function hasUndefined(obj, keys) {
  if (!keys) keys = _.keys(obj._options);
  return _.some(keys, function (key) {
    return obj._options[key] === undefined;
  });
}

function notifyUndefined(obj, keys) {
  if (hasUndefined(obj, keys)) {
    console.error('object has undefined values:');
    console.warn(JSON.stringify(obj._options));
    return true;
  }
  return false;
}
/**
 * returns a copy of defaults extend by options,
 * removing all properties not present in original defaults
 * also:
 * target.options = options;
 * @param target object
 * @param options object
 * @param defaults object
 */
function include(target, options, defaults) {
  options = _.extend(defaults, _.pick(options, _.keys(defaults), ['id', 'group', 'type']));
  _.extend(target, options);
  target._options = options;
  return options;
}

/**
 * return obj._options without property 'id'
 * @param obj
 * @returns {*}
 */
function oid(obj) {
  return _.omit(obj._options, 'id');
}

/**
 * return obj._options
 * @param obj
 * @returns {*|LazyTransform._options}
 */
function opt(obj) {
  return obj._options;
}

/**
 * Add Ammo or THREE libraries to the environment
 * @param lib the library object
 * @returns {boolean}
 */
function addLibrary(lib) {
  if (lib.btVector3) {
    Ammo = lib;
  } else if (lib.Vector3) {
    THREE = lib;
  } else {
    return false;
  }
  return true;
}

/**
 * Access to create objects
 * make('shape','box',{dx: 2, dy: 4, dz:3}) will return a box with those dimensions
 * @returns {object}
 */
function make() {
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
  var constructor = description[group] && description[group][type];
  var obj;
  if (typeof constructor == 'function') {
    obj = new constructor(options);
    obj.group = group;
    obj.type = type;
    if (!obj.id) obj.id = nextId(type);
    if (saveObjects) {
      if (!objects[group]) objects[group] = {};
      objects[group][obj.id] = obj;
    }
    debug && console.log('make ' + group + '.' + type + ' ' + JSON.stringify(opt(obj)));
  } else {
    console.warn('incapable of making object:');
    console.log(JSON.stringify(arguments));
  }
  return obj;
}

var nextId = (function () {
  var index = 0;
  return function (prefix) {
    if (prefix === undefined) {
      prefix = 'id';
    }
    return prefix + index++;
  };
})();

/**
 * build a world based on the json data
 * @param json
 */
function unpack(json) {
  var pack = {};
  _.each(json, function (groupObject, group) {
    _.each(groupObject, function (typeObject, id) {
      _.each(typeObject, function (options, type) {
        options.id = id;
        pack[id] = make(group, type, options);
      });
    });
  });
  return pack;
}

function structure() {
  var obj = {};
  _.each(description, function (group, key) {
    obj[key] = {};
    _.each(group, function (fun, name) {
      var m = make(key, name, {});
      if (m) {
        obj[key][name] = options(m);
      }
    });
  });
  return obj;
}

function options(obj) {
  return obj._options;
}

function setDebug(val) {
  debug = !!val;
}

module.exports = {
  addLibrary: addLibrary,
  make: make,
  unpack: unpack,
  structure: structure,
  options: options,
  include: include,
  omitId: oid,
  setDebug: setDebug,
  destroy: destroy,
  destroyAll: destroyAll,
  objects: objects
};
