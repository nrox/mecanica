'use strict';

/**
 Functions to generate objects
 */

(function () {
  var _ = require('./lib/underscore.js');
  var Ammo, THREE;
  var debug = false;
  var saveObjects = true;
  var UNDEFINED = undefined;

  var objects = {
    physics: {},
    shape: {},
    material: {},
    body: {},
    connector: {},
    constraint: {},
    camera: {},
    renderer: {},
    scene: {}
  };

  function getObject(id, group) {
    if (group) {
      return objects[group] && objects[group][id];
    } else {
      var obj = undefined;
      _.some(objects, function (groupObject) {
        return _.some(groupObject, function (instance, objId) {
          if (objId === id) {
            obj = instance;
            return true;
          } else {
            return false;
          }
        });
      });
      return obj;
    }
  }

//this structure helps swapping worlds to json
  var constructor = {
    physics: {
      vector: function (options) {
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
      position: function (options) {
        constructor.physics.vector.call(this, options);
      },
      rotation: function (options) {
        constructor.physics.vector.call(this, options);
      },
      velocity: function (options) {
        constructor.physics.vector.call(this, options);
      }
    },
    shape: {
      'default': function (options) {
        constructor.shape.sphere.call(this, options);
      },
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
      'default': function (options) {
        constructor.material.basic.call(this, options);
      },
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
      'default': function (options) {
        constructor.body.basic.call(this, options);
      },
      basic: function (options) {
        include(this, options, {
          shape: {type: 'box'},
          material: {type: 'basic', wireframe: false, color: 0x999999},
          mass: 0.1, position: {}, quaternion: undefined, rotation: undefined
        });
        var shape;
        if (typeof this.shape == 'string') { //get from objects with id
          shape = getObject(this.shape, 'shape');
        } else { //make from options
          shape = make('shape', this.shape);
        }
        var material;
        if (typeof this.material == 'string') { //get from objects with id
          material = getObject(this.material, 'material');
        } else { //make from options
          material = make('material', this.material);
        }
        var position = make('physics', 'position', this.position);
        var quaternion;
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
    //reference for constraints, allowing to define axis and base of movements
    connector: {
      'default': function (options) {
        constructor.connector.relative.call(this, options);
      },
      //base and axis are specified in local coordinates
      relative: function (options) {
        include(this, options, {
          body: undefined, //the parent body id
          base: {x: 0, y: 0, z: 0}, //origin
          up: {x: 0, y: 0, z: 0}, //axis of rotation or direction of movement, normalized
          front: {x: 0, y: 0, z: 0} //defines the angle, should be perpendicular to 'up', normalized
        });
        notifyUndefined(this, ['body', 'base', 'up', 'front']);
        var body = getObject(this.body, 'body');
        if (body) {
          if (!body.connectors) body.connectors = {};
          body.connectors[this.id] = this;
          this.body = body;
          this.base = make('physics', 'position', this.base);
          this.up = make('physics', 'vector', this.up);
          this.front = make('physics', 'vector', this.front);
        }
      }
    },
    constraint: {
      'default': function (options) {
        constructor.constraint.point.call(this, options);
      },
      //for pendulum-like constraints
      point: function (options) {
        constructor.constraint._abstract.call(this, options);
        if (Ammo) {
          this.ammo = new Ammo.btPoint2PointConstraint(
            this.bodyA.ammo, this.bodyB.ammo, this.a.base.ammo, this.b.base.ammo
          );
        }
      },
      //for free wheels, doors
      hinge: function (options) {
        constructor.constraint._abstract.call(this, options);
        if (Ammo) {
          this.ammo = new Ammo.btHingeConstraint(
            this.bodyA.ammo, this.bodyB.ammo, this.a.base.ammo, this.b.base.ammo,
            this.a.up.ammo, this.b.up.ammo
          );
        }
      },
      //for linear motors
      slider: function (options) {
        constructor.constraint._abstract.call(this, options);
        if (Ammo) {
          var transformA = new Ammo.btTransform();
          transformA.setOrigin(this.a.base.ammo);

          var yAxis = this.a.up.ammo;
          var zAxis = this.a.front.ammo;
          var xAxis = yAxis.cross(zAxis).normalize();

          //http://math.stackexchange.com/questions/53368/rotation-matrices-using-a-change-of-basis-approach
          var basis = transformA.getBasis();
          //set the new coordinate system and swap x, y
          basis.setValue(
            xAxis.x(), xAxis.y(), xAxis.z(),
            yAxis.x(), yAxis.y(), yAxis.z(),
            zAxis.x(), zAxis.y(), zAxis.z()
          );
          transformA.setBasis(basis);

          var transformB = new Ammo.btTransform();
          transformB.setOrigin(this.b.base.ammo);

          yAxis = this.b.up.ammo;
          zAxis = this.b.front.ammo;
          xAxis = yAxis.cross(zAxis).normalize();
          //http://math.stackexchange.com/questions/53368/rotation-matrices-using-a-change-of-basis-approach
          basis = transformB.getBasis();
          //set the new coordinate system and swap x, y
          basis.setValue(
            xAxis.x(), xAxis.y(), xAxis.z(),
            yAxis.x(), yAxis.y(), yAxis.z(),
            zAxis.x(), zAxis.y(), zAxis.z()
          );
          transformB.setBasis(basis);

          this.ammo = new Ammo.btSliderConstraint(
            this.bodyA.ammo, this.bodyB.ammo, transformA, transformB, true
          );
        }
      },
      //super constructor
      _abstract: function (options) {
        include(this, options, {
          a: undefined, //connector id, in body A
          b: undefined //connector id, in body B
        });
        notifyUndefined(this, ['a', 'b']);
        if (Ammo) {
          this.a = getObject(this.a, 'connector');
          this.b = getObject(this.b, 'connector');
          this.bodyA = this.a.body;
          this.bodyB = this.b.body;
        }
      }
    },
    scene: { //the same as world
      'default': function (options) {
        constructor.scene.basic.call(this, options);
      },
      basic: function (options) {
        include(this, options, {
          gravity: {x: 0, y: -9.81, z: 0}
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
          this.ammo.setGravity(make('physics', 'vector', this.gravity).ammo);
        }
      }
    },
    renderer: {
      'default': function (options) {
        try {
          constructor.renderer.webgl.call(this, options);
        } catch (e) {
          constructor.renderer.canvas.call(this, options);
        }
      },
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
      'default': function (options) {
        constructor.camera.perspective.call(this, options);
      },
      perspective: function (options) {
        include(this, options, {
          fov: 45, aspect: 1, near: 0.1, far: 1000,
          position: {x: 5, y: 7, z: 10},
          lookAt: {}
        });
        this.position = make('physics', 'position', this.position);
        if (THREE) {
          this.three = new THREE.PerspectiveCamera(this.fov, this.aspect, this.near, this.far);
          this.three.position.copy(this.position.three);
          this.three.lookAt(make('physics', 'position', this.lookAt).three);
        }
      },
      //follow a body
      tracker: function (options) {
        include(this, options, {
          fov: 45, aspect: 1, near: 0.1, far: 1000,
          axis: {x: 1, y: 0.2, z: 0.3}, //preferred axis of movement
          distance: 15, //distance to keep
          inertia: 1, //for changing position, in seconds
          body: null
        });
        notifyUndefined(this, ['body']);
        this.axis = make('physics', 'vector', this.axis);
        this.body = getObject(this.body, 'body');
        if (THREE) {
          this.axis.three.normalize();
          this.three = new THREE.PerspectiveCamera(this.fov, this.aspect, this.near, this.far);
          //this.three.position.copy(this.axis.three);
          //this.three.lookAt(this.body.three.position);
        }
      }
    }
  };

  var destructor = {
    physics: function (obj) {
    },
    shape: function (obj) {
    },
    material: function (obj) {
    },
    body: function (obj) {
    },
    connector: function (obj) {
    },
    constraint: function (obj) {
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
    if (!obj) return null;
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
      return obj._options[key] === UNDEFINED;
    });
  }

  function notifyUndefined(obj, keys) {
    if (hasUndefined(obj, keys)) {
      console.error('object has undefined values:');
      console.warn(keys);
      console.warn(JSON.stringify(obj._options,
        function (k, v) {
          return v === undefined ? null : v;
        }, ' '));
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

//return obj._options without property 'id'
  function oid(obj) {
    return _.omit(obj._options, 'id');
  }

//return obj._options
  function opt(obj) {
    return obj._options;
  }

//Add Ammo or THREE libraries to the environment
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
    if (!group) {
      console.log('make', arguments);
      console.error('group is not defined');
    }
    type = type || 'default';
    var cons = constructor[group] && constructor[group][type];
    var obj;
    if (typeof cons == 'function') {
      obj = new cons(options);
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

//make an object from the group, the first type found
  function makeSome(group) {
    return make(group, _.keys(constructor[group])[0], {});
  }

//get first of the kind in objects
  function getSome(group) {
    return getObject(_.keys(objects[group])[0], group);
  }

  var nextId = (function () {
    var index = 0;
    return function (prefix) {
      //use == here, never === because null values should be handled the same way
      if (prefix == undefined) {
        prefix = 'id';
      }
      return prefix + index++;
    };
  })();

//build objects based on the json data, using make.
//If saveObjects they will be appended to {objects}
  function unpack(json) {
    var pack = saveObjects ? objects : {};
    _.each(json, function (groupObject, groupName) {
      if (!pack[groupName]) pack[groupName] = {};
      _.each(groupObject, function (objectOptions, objectId) {
        objectOptions.id = objectId;
        if (saveObjects) {
          make(groupName, objectOptions);
        } else {
          pack[groupName][objectId] = make(groupName, objectOptions);
        }
      });
    });
    return pack;
  }

//build a json based on objects
  function pack(objs) {
    var pack = {};
    if (!objs) objs = objects;
    _.each(objs, function (groupObject, groupName) {
      pack[groupName] = {};
      _.each(groupObject, function (instance, objectId) {
        var objectOptions = _.clone(opt(instance));
        delete objectOptions.id;
        objectOptions.type = instance.type;
        pack[groupName][objectId] = objectOptions;
        pack[objectId] = make(groupName, objectOptions);
      });
    });
    return JSON.parse(JSON.stringify(pack, function (k, v) {
      return v === undefined ? null : v;
    }));
  }

//get the constructor structure and options for each
  function structure() {
    var obj = {};
    //disable libraries and verifications shortly
    var ammoBackup = Ammo;
    var threeBackup = THREE;
    var undefinedBackup = UNDEFINED;
    var saveObjectsBackup = saveObjects;
    Ammo = undefined;
    THREE = undefined;
    UNDEFINED = {};
    saveObjects = false;
    _.each(constructor, function (group, key) {
      obj[key] = {};
      _.each(group, function (fun, name) {
        obj[key][name] = {};
        var m = make(key, name, {});
        if (m) {
          obj[key][name] = options(m);
        }
      });
    });
    //repose them
    Ammo = ammoBackup;
    THREE = threeBackup;
    UNDEFINED = undefinedBackup;
    saveObjects = saveObjectsBackup;
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
    constructor: constructor,
    make: make,
    makeSome: makeSome,
    unpack: unpack,
    pack: pack,
    structure: structure,
    options: options,
    include: include,
    omitId: oid,
    setDebug: setDebug,
    destroy: destroy,
    destroyAll: destroyAll,
    objects: objects,
    getObject: getObject,
    getSome: getSome,
    saveObjects: saveObjects
  };
  return module.exports;
})();