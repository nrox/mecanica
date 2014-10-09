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
        friction: 0.3, restitution: 0.2, color: 0x333333, opacity: 1, emissive: 0x345678
      });
      if (THREE) this.three = new THREE.MeshPhongMaterial(this.options);
    }
  },
  body: {
    basic: function (options) {
      include(this, options, {
        shape: 'box', material: 'basic', wireframe: false, color: 0x999999
      });
      if (THREE) {
        var shape = make('shape', this.shape, this.options);
        var material = make('material', this.material, this.options);
        this.three = new THREE.Mesh(shape.three, material.three);
      }
    },
    predefined: function (options) {
      include(this, options, {
        shape: '', material: ''
      });
      if (THREE && this.shape && this.material && this.shape.three && this.material.three) {
        this.three = new THREE.Mesh(this.shape.three, this.material.three);
      }
    }
  },
  scene: {
    basic: function (options) {
      include(this, options, {
        camera: 'perspective', renderer: 'webgl'
      });
      if (THREE) {
        this.three = new THREE.Scene();
        var camera = make('camera', this.camera, this.options).three;
        var renderer = make('renderer', this.renderer, this.options).three;
        if (document && this.append) document.body.appendChild(renderer.domElement);
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
        fov: 75, aspect: 1, near: 0.1, far: 1000
      });
      if (THREE) {
        this.three = new THREE.PerspectiveCamera(this.fov, this.aspect, this.near, this.far);
      }
    }
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
  var len = arguments.length;
  var options = (typeof arguments[len - 1] == 'object') && arguments[len - 1];
  if (!options) {
    options = {};
  } else {
    len--;
  }
  var constructor = description;
  var maker = [];
  var obj;
  for (var i = 0; i < len; i++) {
    if (constructor[arguments[i]]) {
      maker.push(arguments[i]);
      constructor = constructor[arguments[i]];
    }
  }
  if (typeof constructor == 'function') {
    obj = new constructor(options);
    if (obj)
      obj.maker = maker;
  }
  return obj;
}


/**
 * build a world based on the json data
 * @param json
 */
function unpack(json) {

}

function structure() {
  var obj = {};
  _.each(description, function (group, key) {
    obj[key] = {};
    _.each(group, function (fun, name) {
      var m = make(key, name);
      if (m) {
        obj[key][name] = options(m);
      }
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
  unpack: unpack,
  structure: structure,
  options: options,
  include: include
};
