'use strict';

/**
 Functions to manipulate objects and the scene
 */

(function () {
  var _ = require('./lib/underscore.js');
  var utils = require('./utils.js');
  var memo = {};
  var Ammo, THREE;
  var worker;
  var debug = false;
  var UNDEFINED = undefined;
  var SYSTEM = 'system';

  //maintains a reference to all relevant objects created
  var objects = {
    system: {}, //high level structure of objects, identified by keys
    shape: {}, //sphere, box, cylinder, cone ...
    material: {}, //basic, phong, lambert ? ...
    connector: {}, //belongs to each body, defines origin and axis for constraints
    constraint: {}, //point, slider, hinge ...
    body: {}, //shape + mesh
    light: {},
    camera: {}, //should this be here ?
    renderer: {}, // here ?
    scene: {} //here ?
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
  function getObject() {
    var obj = objects;
    for (var i = 0; i < arguments.length; i++) {
      obj = obj[arguments[i]];
      if (!obj) break;
    }
    return obj;
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
          x: 0, y: 0, z: 0, w: undefined
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
      _default: function (options) {
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
      _default: function (options) {
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
      _default: function (options) {
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
          shape = getObject('shape', this.shape);
        } else { //make from options
          shape = make('shape', this.shape);
        }
        var material;
        if (typeof this.material == 'string') { //get from objects with id
          material = getObject('material', this.material);
        } else { //make from options
          material = make('material', this.material);
        }
        this.position = make('physics', 'position', this.position);
        if (this.quaternion) {
          this.quaternion = make('physics', 'quaternion', this.quaternion);
        } else if (this.rotation) { //set from euler
          this.quaternion = make('physics', 'quaternion', this.rotation);
        } else {
          this.quaternion = make('physics', 'quaternion', {w: 1});
        }
        if (THREE) {
          this.three = new THREE.Mesh(shape.three, material.three);
          this.three.position.copy(this.position.three);
          this.three.quaternion.copy(this.quaternion.three);
        }
        if (Ammo) {
          var transform = new Ammo.btTransform();
          transform.setIdentity();
          transform.setOrigin(this.position.ammo);
          transform.setRotation(this.quaternion.ammo);
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
      _default: function (options) {
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
        var body = getObject('body', this.body);
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
      _default: function (options) {
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
          this.a = getObject('connector', this.a);
          this.b = getObject('connector', this.b);
          this.bodyA = this.a.body;
          this.bodyB = this.b.body;
        }
      }
    },
    scene: { //the same as world
      _default: function (options) {
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
      _default: function (options) {
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
      _default: function (options) {
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
        this.body = getObject('body', this.body);
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
    },
    system: function (obj) {
      /*
       _.each(obj, function(o, k){
       var bk = objects;
       objects = obj;
       destroy(o);
       objects = bk;
       });
       */
    }
  };

  function destroy(obj) {
    //TODO consider system and worker behavior
    if (!obj) return;
    if (objects[obj.group] && objects[obj.group][obj.id]) {
      destructor[obj.group] && destructor[obj.group](objects[obj.group][obj.id]);
      delete objects[obj.group][obj.id];
    } else {
      obj.group && destructor[obj.group] && destructor[obj.group](obj);
    }
  }

  function destroyAll() {
    _.each(objects, function (group) {
      _.each(group, function (obj) {
        destroy(obj);
      });
    });
  }

  function copyPhysicsToThree(body) {
    body.three.position.x = body.position.x;
    body.three.position.y = body.position.y;
    body.three.position.z = body.position.z;
    body.three.quaternion.x = body.quaternion.x;
    body.three.quaternion.y = body.quaternion.y;
    body.three.quaternion.z = body.quaternion.z;
    body.three.quaternion.w = body.quaternion.w;
  }

  function copyPhysicsFromAmmo(body, trans) {
    if (!trans) {
      trans = new Ammo.btTransform();
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

  function transfer(pkt, objs) {
    if (!objs) objs = objects;
    if (pkt.system && objs.system) {
      _.each(pkt.system, function (sys, id) {
        if (!objs.system[id]) {
          console.warn('system not found in transfer: ' + id);
          return;
        }
        transfer(sys, objs.system[id]);
      });
    }
    if (pkt.body && objs.body) {
      if (!pkt.body) pkt.body = {};
      _.each(pkt.body, function (body, id) {
        if (!objs.body[id]) {
          console.warn('body not found in transfer: ' + id);
          return;
        }
        objs.body[id].position.x = body.position.x;
        objs.body[id].position.y = body.position.y;
        objs.body[id].position.z = body.position.z;
        objs.body[id].quaternion.x = body.quaternion.x;
        objs.body[id].quaternion.y = body.quaternion.y;
        objs.body[id].quaternion.z = body.quaternion.z;
        objs.body[id].quaternion.w = body.quaternion.w;
      });
    }
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
    type = type || '_default';
    var cons = constructor[group] && constructor[group][type];
    var obj;
    if (typeof cons == 'function') {
      obj = new cons(options);
      if (group !== SYSTEM) obj.group = group;
      if (group !== SYSTEM) obj.type = type;
      if (!obj.id) obj.id = nextId(type);
      if (objects[group]) objects[group][obj.id] = obj;
      debug && console.log('make ' + group + '.' + type + ' ' + JSON.stringify(opt(obj)));
    } else {
      console.warn('incapable of making object:');
      console.log(JSON.stringify(arguments));
    }
    return obj;
  }

//get first of the kind in objects
  function getSome(group, obj) {
    if (!obj) obj = objects;
    return getObject(group, _.keys(obj[group])[0]) || make(group, _.keys(constructor[group])[0], {});
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
  function unpack(json) {
    _.each(json, function (groupObject, groupName) {
      _.each(groupObject, function (objectOptions, objectId) {
        objectOptions.id = objectId;
        make(groupName, objectOptions);
      });
    });
  }

//build a json based on objects
  function pack(objs) {
    var packed = {};
    if (!objs) objs = objects;
    _.each(objs, function (groupObject, groupName) {
      packed[groupName] = {};
      _.each(groupObject, function (instance, objectId) {
        if (groupName == SYSTEM) {
          packed[groupName][objectId] = pack(instance);
        } else {
          var objectOptions = _.clone(opt(instance));
          delete objectOptions.id;
          objectOptions.type = instance.type;
          packed[groupName][objectId] = objectOptions;
        }
      });
    });
    return packed;
  }

  function loadObjects(script, options) {
    options = _.extend({
      axisHelper: 0
    }, options || {});
    var json = (typeof script == 'object') ? script : require(script);
    unpack(json);
    var scene = getSome('scene');
    memo.scene = scene;
    if (options.axisHelper) {
      if (THREE)  scene.three.add(new THREE.AxisHelper(options.axisHelper));
    }

    function loadSystem(objs) {
      _.each(objs.system, loadSystem);

      _.each(objs.body, function (body) {
        if (THREE) scene.three.add(body.three);
        if (Ammo) scene.ammo.addRigidBody(body.ammo);
      });

      _.each(objs.constraint, function (cons) {
        if (Ammo) scene.ammo.addConstraint(cons.ammo);
      });
    }

    loadSystem(objects);
  }

  //get the constructor structure and options for each
  function structure() {
    var obj = {};
    //disable libraries and verifications shortly
    var ammoBackup = Ammo;
    var threeBackup = THREE;
    var undefinedBackup = UNDEFINED;
    Ammo = undefined;
    THREE = undefined;
    UNDEFINED = {};
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
    return obj;
  }

  function options(obj) {
    return obj._options;
  }

  function setDebug(val) {
    debug = !!val;
  }



  function startSimulation(options) {
    options = _.extend({
      simSpeed: 1,
      simFrequency: 30
    }, options || {});
    var trans = new Ammo.btTransform();
    var packet = {};

    function copyPhysics(objs) {
      _.each(objs.system, copyPhysics);
      _.each(objs.body, function (body) {
        if (Ammo) copyPhysicsFromAmmo(body, trans);
        if (THREE && !utils.isBrowserWorker()) copyPhysicsToThree(body);
      });
    }

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

    var simulate = function () {
      //prepare next call
      memo.stid = setTimeout(simulate, 1000 / options.simFrequency);
      //compute time since last call
      var curTime = (new Date()).getTime() / 1000;
      var dt = curTime - memo.lastTime;
      memo.lastTime = curTime;
      //maxSubSteps > timeStep / fixedTimeStep
      //so, to be safe maxSubSteps = 2 * speed * 60 * dt + 2
      var maxSubSteps = ~~(2 * options.simSpeed * 60 * dt + 2);
      memo.scene.ammo.stepSimulation(options.simSpeed / options.simFrequency, maxSubSteps);
      copyPhysics(objects);
      if (utils.isBrowserWorker()) {
        packPhysics(objects, packet);
        post(['transfer', packet], 'transfer physics', nextId('transfer_'));
      }
    };
    memo.lastTime = (new Date()).getTime() / 1000;
    stopSimulation(); //make sure is stopped
    simulate(); //then go
  }

  function stopSimulation() {
    clearTimeout(memo.stid);
  }

  var workerListener = {
    console: function () {
      var args = [];
      var type = arguments[0];
      for (var i = 1; i < arguments.length; i++) {
        args.push(arguments[i]);
      }
      console[type].apply(console, args);
    }
  };

  function createWorker(url) {
    if (worker) return worker;
    url || (url = requireURL('worker-web.js'));
    worker = new Worker(url);
    worker.onmessage = function (e) {
      var request = e.data;
      if ((typeof request == 'object') && workerListener[request.action]) {
        if (request.action != 'result') {
          var result = workerListener[request.action].apply(self, request['arguments']);
          var response = {};
          if (request.id) response.id = request.id;
          if (request.comment) response.comment = request.comment;
          response.result = result;
          worker.postMessage(response);
        }
      } else {
        console.log(utils.stringify(request));
      }
    };
    wrapWorkerFunctions();
    return worker;
  }

  function post(args, comment, id) {
    if (worker) worker.postMessage({
      action: 'factory',
      arguments: args,
      comment: comment,
      id: id || nextId(0)
    });
  }

  function dismissWorker() {
    worker && worker.terminate();
    worker = undefined;
  }

  function hasWorker() {
    return !!worker;
  }

  //these are keys to the functions relevant for the worker in module.exports
  var workerFunctions = [
    'make',
    'unpack',
    'pack',
    'loadObjects',
    'setDebug',
    'destroy',
    'destroyAll',
    'startSimulation',
    'stopSimulation'
  ];

  function wrapWorkerFunctions() {
    while (workerFunctions.length) {
      var key = workerFunctions.pop();
      var fun = module.exports[key];
      module.exports[key] = function () {
        var args = utils.argList(arguments);
        args.unshift(key);
        post(args, 'wrapped ' + key, nextId('post_'));
        return fun.apply(null, arguments);
      };
    }
  }

  module.exports = {
    addLibrary: addLibrary,
    constructor: constructor,
    make: make,
    unpack: unpack,
    pack: pack,
    loadObjects: loadObjects,
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
    startSimulation: startSimulation,
    stopSimulation: stopSimulation,
    createWorker: createWorker,
    dismissWorker: dismissWorker,
    hasWorker: hasWorker,
    transfer: transfer
  };

  return module.exports;
})();