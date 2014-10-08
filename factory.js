'use strict';

/**
 Functions to generate objects
 */

var _ = require('./lib/underscore.js');
var Ammo, THREE;

var description = {
  physics: {
    position: function (options) {
      include(this, options, {
        x: 0, y: 0, z: 0
      });
      if (Ammo) this.ammo = new Ammo.btVector3(this.x, this.y, this.z);
      if (THREE) this.three = new THREE.Vector3(this.x, this.y, this.z);
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
        dx: 1, dy: 1, dz: 1
      });
      if (Ammo) this.ammo = new Ammo.btBoxShape(new Ammo.btVector3(this.dx, this.dy, this.dz));
      if (THREE) this.three = new THREE.BoxGeometry(this.dx, this.dy, this.dz);
    },
    cylinder: function (options) {
      include(this, options, {
        r: 1, dy: 1, segments: 12
      });
      if (Ammo) this.ammo = new Ammo.btCylinderShape(new Ammo.btVector3(this.r, this.dy, this.r));
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
      if (THREE) this.three = new THREE.MeshBasicMaterial(this.options);
    },
    phong: function (options) {
      include(this, options, {
        friction: 0.3, restitution: 0.2, color: 0x333333, opacity: 1, emmissive: 0x345678
      });
      if (THREE) this.three = new THREE.MeshPhongMaterial(this.options);
    }
  },
  body: function (options) {
    include(this, options, {
      shape: undefined, material: undefined
    });
    if (THREE) this.three = new THREE.Mesh(this.shape.three, this.material.three);
  }
};

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
  options = _.extend(defaults, _.pick(options, _.keys(defaults)));
  _.extend(target, options);
  target.options = options;
  return options;
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
  var options = arguments[arguments.length - 1] || {};
  var constructor = description;
  for (var i = 0; i < arguments.length - 1; i++) {
    if (constructor[arguments[i]]) constructor = constructor[arguments[i]];
  }
  if (typeof constructor == 'function') {
    return new constructor(options);
  } else {
    return undefined;
  }
}

function structure() {
  var obj = {};
  _.each(description, function (group, key) {
    obj[key] = {};
    _.each(group, function (fun, name) {
      obj[key][name] = 'function({...})';
    });
  });
  return obj;
}

function options(obj) {
  return obj.options;
}

module.exports = {
  addLibrary: addLibrary,
  make: make,
  structure: structure,
  options: options
};
