'use strict';

/**
 Functions to manipulate objects and the scene
 */

(function () {
  var _ = require('./lib/underscore.js');
  var utils = require('./util/utils.js');
  var Ammo, THREE, jQuery, ammoHelper;
  var controller;
  var worker;
  var debug = false;
  var UNDEFINED = undefined;
  var SYSTEM = 'system';
  var _currentScope;

  var defaultSettings = {
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
  };

  //maintains a reference to all relevant objects created
  var objects = {
    settings: {}, //preferences
    scene: {}, //three scene + ammo world
    system: {}, //high level structure of objects, identified by keys
    shape: {}, //sphere, box, cylinder, cone ...
    material: {}, //basic, phong, lambert ? ...
    body: {}, //shape + mesh
    connector: {}, //this should not be here! it should be accessed and destroyed within the body
    constraint: {}, //point, slider, hinge ...
    light: {},
    monitor: {} //set of camera + renderer
  };

  //collection of isolated objects, allows to have parallel worlds
  var scope = {
    'default': objects
  };

  function newScope(name, obj) {
    if (!obj) {
      obj = {};
      _.each(objects, function (v, k) {
        obj[k] = {};
      });
    }
    scope[name] = obj;
  }

  function setScope(name) {
    if (!scope[name]) {
      newScope(name);
    }
    objects = scope[name];
    _currentScope = name;
  }

  function getScope() {
    return _currentScope;
  }

  function getScopes() {
    return _.keys(scope);
  }

  setScope('default');

  //if we are using worker for simulation
  function isSimulator() {
    return !!Ammo;
  }

  //if we are using three.js for visualization/interaction
  function useWebGL() {
    return !!THREE;
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
  function getObject() {
    if (arguments[0] instanceof Array) {
      return getObject.apply(null, arguments[0]);
    }
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

  function addSimulatorMethod() {
    var funName;
    var reference = method;
    var args = utils.argList(arguments);
    for (var i = 0; i < args.length; i++) {
      funName = args[i];
      reference = reference[funName];
    }
    if (!this[funName] && (typeof(reference) == 'function')) {
      if (isSimulator()) {
        this[funName] = reference;
      } else {
        this[funName] = function () {
          post(['execMethod', [this.group, this.id], funName, utils.argList(arguments) ]);
        }
      }
    } else {
      console.warn(this);
      console.warn(funName + ' already exists or is not a function');
    }
  }

  /**
   * CONSTRUCTORS ************************************************************
   */
//this structure helps swapping worlds to json
  var constructor = {
    //some general definitions
    settings: {
      _default: function (options) {
        include(this, options, defaultSettings);
      }
    },
    physics: {
      vector: function (options) {
        include(this, options, {
          x: 0, y: 0, z: 0
        });
        notifyUndefined(this);
        if (isSimulator()) this.ammo = new Ammo.btVector3(this.x, this.y, this.z);
        if (useWebGL()) this.three = new THREE.Vector3(this.x, this.y, this.z);
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
        if (isSimulator()) {
          this.ammo = new Ammo.btQuaternion(this.x, this.y, this.z, this.w);
        }
        if (useWebGL()) {
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
        if (isSimulator()) this.ammo = new Ammo.btSphereShape(this.r);
        if (useWebGL()) this.three = new THREE.SphereGeometry(this.r, this.segments, this.segments);
      },
      box: function (options) {
        include(this, options, {
          dx: 1, dy: 1, dz: 1, segments: 1
        });
        if (isSimulator()) this.ammo = new Ammo.btBoxShape(new Ammo.btVector3(this.dx / 2, this.dy / 2, this.dz / 2));
        if (useWebGL()) {
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
        if (isSimulator()) this.ammo = new Ammo.btCylinderShape(new Ammo.btVector3(this.r, this.dy / 2, this.r));
        if (useWebGL()) this.three = new THREE.CylinderGeometry(this.r, this.r, this.dy, this.segments);
      },
      cone: function (options) {
        include(this, options, {
          r: 1, dy: 1, segments: 12
        });
        if (isSimulator()) this.ammo = new Ammo.btConeShape(this.r, this.dy);
        if (useWebGL()) this.three = new THREE.CylinderGeometry(0, this.r, this.dy, this.segments);
      },
      compound: function (options) {
        include(this, options, {
          parent: undefined, children: undefined
        });
        notifyUndefined(this, ['parent']);
        if (typeof this.parent == 'string') {
          this.parent = getObject('shape', this.parent);
        } else {
          this.parent = make('shape', this.parent);
        }
        var _this = this;
        var compound;
        var transParent;
        if (isSimulator()) {
          compound = new Ammo.btCompoundShape;
          transParent = new Ammo.btTransform;
          transParent.setIdentity();
          compound.addChildShape(transParent, this.parent.ammo);
        }
        _.each(this.children, function (childOptions) {
          childOptions._dontSave = true;
          var child = make('shape', childOptions);
          var pos = make('physics', 'position', childOptions.position || {});
          var qua = make('physics', 'quaternion', childOptions.rotation || {});
          if (isSimulator()) {
            var transChild = new Ammo.btTransform;
            transChild.setIdentity();
            transChild.setRotation(qua.ammo);
            transChild.setOrigin(pos.ammo);
            compound.addChildShape(transChild, child.ammo);
            Ammo.destroy(transChild);
          }
          if (useWebGL()) {
            var tc = new THREE.Matrix4;
            tc.makeRotationFromQuaternion(qua.three);
            tc.setPosition(pos.three);
            _this.parent.three.merge(child.three, tc);
          }
        });
        if (isSimulator()) {
          this.ammo = compound;
        }
        if (useWebGL()) {
          this.three = this.parent.three;
        }
      }
    },
    material: {
      _default: function (options) {
        constructor.material.basic.call(this, options);
      },
      basic: function (options) {
        include(this, options, {
          friction: 0.3, restitution: 0.2,
          color: 0x333333, opacity: 1, transparent: false,
          wireframe: getSettings().wireframe
        });
        if (useWebGL()) this.three = new THREE.MeshBasicMaterial(opt(this));
      },
      phong: function (options) {
        include(this, options, {
          friction: 0.3, restitution: 0.2,
          color: 0x333333, opacity: 1, transparent: false,
          emissive: 0x000000, specular: 0x555555,
          wireframe: getSettings().wireframe
        });
        if (useWebGL()) this.three = new THREE.MeshPhongMaterial(opt(this));
      }
    },
    light: {
      _default: function (options) {
        constructor.light.directional.call(this, options);
      },
      directional: function (options) {
        include(this, options, {
          color: 0xbbbbbb, position: {x: 10, y: 5, z: 3},
          lookAt: {}, castShadow: getSettings().castShadow,
          shadowDistance: 20
        });
        if (useWebGL()) {
          var light = new THREE.DirectionalLight(this.color);
          light.position.copy(make('physics', 'position', this.position).three);
          if (typeof(this.lookAt) == 'object') {
            light.target.position.copy(make('physics', 'position', this.lookAt).three);
          }
          if (this.castShadow) {
            light.shadowCameraLeft = -this.shadowDistance;
            light.shadowCameraTop = -this.shadowDistance;
            light.shadowCameraRight = this.shadowDistance;
            light.shadowCameraBottom = this.shadowDistance;
            light.shadowCameraNear = 0.2 * this.shadowDistance;
            light.shadowCameraFar = 10 * this.shadowDistance;
            light.shadowBias = -0.0003;
            light.shadowMapWidth = light.shadowMapHeight = getSettings().shadowMapSize;
            light.shadowDarkness = 0.35;
          }
          this.three = light;
        }
      }
    },
    body: {
      _default: function (options) {
        constructor.body.basic.call(this, options);
      },
      basic: function (options) {
        include(this, options, {
          shape: {type: 'box'},
          material: {type: 'basic', wireframe: getSettings().wireframe, color: 0x999999},
          mass: 0, position: {}, quaternion: undefined, rotation: undefined,
          connector: {}, axisHelper: getSettings().axisHelper
        });
        var shape;
        var _this = this;
        if (typeof this.shape == 'string') { //get from objects with id
          shape = getObject('shape', this.shape);
        } else { //make from options
          shape = make('shape', this.shape);
        }
        this.shape = shape;
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
        if (useWebGL()) {
          this.three = new THREE.Mesh(shape.three, material.three);
          if (this.axisHelper) {
            shape.three.computeBoundingSphere();
            var r = shape.three.boundingSphere.radius * 1.5;
            this.three.add(new THREE.AxisHelper(r));
          }
        }
        if (isSimulator()) {
          this.ammoTransform = new Ammo.btTransform(this.quaternion.ammo, this.position.ammo);
        }
        _.each(this.connector, function (c, id) {
          c.bodyObject = _this;
          c.body = _this.id;
          c.id = id;
          make('connector', c);
        });
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
        var body = options.bodyObject || getObject('body', this.body);
        if (body) {
          body.connector[this.id] = this;
          this.body = body;
          this.ammoTransform = utils.normalizeConnector(this, ammoHelper);
          this.base = make('physics', 'position', this.base);
          this.up = make('physics', 'vector', this.up);
          this.front = make('physics', 'vector', this.front);
          //check for orthogonality
          var helper = getSettings().connectorHelper;
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
    },
    constraint: {
      //super constructor
      _abstract: function (options) {
        include(this, options, {
          bodyA: undefined, //bodyA id
          bodyB: undefined, //bodyB id
          a: undefined, //connector id, in body A
          b: undefined, //connector id, in body B
          ratio: undefined,
          approach: false //move bodyB towards bodyA to match connectors
        });
        notifyUndefined(this, ['a', 'b', 'bodyA', 'bodyB']);
        if (isSimulator()) {
          this.bodyA = getObject('body', this.bodyA);
          this.bodyB = getObject('body', this.bodyB);
          this.a = this.bodyA.connector[this.a];
          this.b = this.bodyB.connector[this.b];
          if (this.approach) {
            utils.approachConnectors(this.a, this.b, make, Ammo);
          }
        }
        addSimulatorMethod.call(this, 'constraint', 'add');
        addSimulatorMethod.call(this, 'constraint', 'remove');
      },
      _default: function (options) {
        constructor.constraint.point.call(this, options);
      },
      //for pendulum-like constraints
      point: function (options) {
        constructor.constraint._abstract.call(this, options);
        if (isSimulator()) {
          this.create = function () {
            this.ammo = new Ammo.btPoint2PointConstraint(
              this.bodyA.ammo, this.bodyB.ammo, this.a.base.ammo, this.b.base.ammo
            );
          };
        }
      },
      //for free wheels, doors
      hinge: function (options) {
        include(this, options, {
          angle: undefined
        });
        constructor.constraint._abstract.call(this, options);
        if (isSimulator()) {
          this.create = function () {
            this.ammo = new Ammo.btHingeConstraint(
              this.bodyA.ammo, this.bodyB.ammo, this.a.base.ammo, this.b.base.ammo,
              this.a.up.ammo, this.b.up.ammo
            );
          };
        }
        addSimulatorMethod.call(this, 'constraint', 'enableMotor');
        addSimulatorMethod.call(this, 'constraint', 'disableMotor');
        addSimulatorMethod.call(this, 'constraint', 'relax');
        addSimulatorMethod.call(this, 'constraint', 'setAngle');
      },
      gear: function (options) {
        constructor.constraint._abstract.call(this, options);
        notifyUndefined(this, ['ratio']);
        if (isSimulator()) {
          this.create = function () {
            this.ammo = new Ammo.btGearConstraint(
              this.bodyA.ammo, this.bodyB.ammo, this.a.up.ammo, this.b.up.ammo, this.ratio
            );
          };
        }
      },
      //for linear motors
      slider: function (options) {
        constructor.constraint._abstract.call(this, options);
        if (isSimulator()) {
          var transformA = new Ammo.btTransform();
          transformA.setOrigin(this.a.base.ammo);

          var yAxis = this.a.up.ammo;
          var zAxis = this.a.front.ammo;
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

          yAxis = this.b.up.ammo;
          zAxis = this.b.front.ammo;
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
            this.ammo = new Ammo.btSliderConstraint(
              this.bodyA.ammo, this.bodyB.ammo, transformA, transformB, true
            );
          };
        }
      },
      //for linear motors
      fixed: function (options) {
        constructor.constraint._abstract.call(this, options);
        if (isSimulator()) {
          var transformA = new Ammo.btTransform();
          transformA.setOrigin(this.a.base.ammo);

          var yAxis = this.a.up.ammo;
          var zAxis = this.a.front.ammo;
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

          yAxis = this.b.up.ammo;
          zAxis = this.b.front.ammo;
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
    },
    scene: { //the same as world
      _default: function (options) {
        constructor.scene.basic.call(this, options);
      },
      basic: function (options) {
        include(this, options, {
          gravity: {y: -9.81}
        });
        this.scope = getScope();
        if (useWebGL()) {
          this.three = new THREE.Scene();
        }
        if (isSimulator()) {
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
    monitor: {
      _default: function (options) {
        include(this, options, {
          renderer: '_default',
          camera: '_default',
          width: 500, height: 500,
          fov: 35, near: 0.1, far: 1000,
          position: {x: 5, y: 7, z: 10},
          axis: {x: 5, y: 7, z: 10},
          lookAt: {}, //vector or body id
          distance: 15, //distance to keep, in case of tracker
          inertia: 1
        });
        var o = oid(this);
        o.aspect = o.width / o.height;
        this.renderer = make('renderer', o.renderer, o);
        this.camera = make('camera', o.camera, o);
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
      _intro: function (options) {
        include(this, options, {
          width: 500, height: 500, container: undefined
        });
        if (jQuery && THREE) {
          if (getSettings().reuseCanvas) {
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
          var settings = getSettings();
          jQuery(settings.canvasContainer).append(this.three.domElement);
          jQuery(this.three.domElement).attr('monitor', this.id);
          this.three.setSize(this.width, this.height);
        }
      },
      webgl: function (options) {
        constructor.renderer._intro.call(this, options);
        if (useWebGL()) {
          this.three = new THREE.WebGLRenderer({canvas: this.canvas});
        }
        constructor.renderer._outro.call(this);
      },
      canvas: function (options) {
        constructor.renderer._intro.call(this, options);
        if (useWebGL()) {
          this.three = new THREE.CanvasRenderer({canvas: this.canvas});
        }
        constructor.renderer._outro.call(this);
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
        if (useWebGL()) {
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
          lookAt: null
        });
        notifyUndefined(this, ['lookAt']);
        this.axis = make('physics', 'vector', this.axis);
        this.lookAt = getObject('body', this.lookAt);
        if (useWebGL()) {
          this.axis.three.normalize();
          this.three = new THREE.PerspectiveCamera(this.fov, this.aspect, this.near, this.far);
        }
      },
      //follow a body
      satellite: function (options) {
        include(this, options, {
          fov: 45, aspect: 1, near: 0.1, far: 1000,
          axis: {x: 1, y: 0.2, z: 0.3}, //preferred axis of movement
          distance: 15, //distance to keep
          inertia: 1, //for changing position, in seconds
          lookAt: null
        });
        notifyUndefined(this, ['lookAt']);
        this.axis = make('physics', 'vector', this.axis);
        if (typeof(this.lookAt) == 'string') {
          this.lookAt = getObject('body', this.lookAt);
        } else {
          this.lookAt = make('physics', 'position', this.lookAt);
        }
        if (useWebGL()) {
          this.axis.three.normalize();
          this.three = new THREE.PerspectiveCamera(this.fov, this.aspect, this.near, this.far);
        }
      }
    }
  };

  /**
   * arguments: group, id, method, [arg1 [, arg2 [...]]]
   */
  function execMethod(objectPath, funName, args) {
    var obj = getObject(objectPath);
    if (obj && obj[funName]) {
      obj[funName].apply(obj, args);
    }
  }

  var method = {
    body: {
      updateMotionState: function () {
        if (useWebGL()) {
          this.three.quaternion.copy(this.quaternion.three);
          this.three.position.copy(this.position.three);
        }
        if (isSimulator()) {
          this.ammoTransform.setIdentity();
          this.ammoTransform.setRotation(this.quaternion.ammo);
          this.ammoTransform.setOrigin(this.position.ammo);
          var inertia = new Ammo.btVector3(0, 0, 0);
          if (this.mass) this.shape.ammo.calculateLocalInertia(this.mass, inertia);
          var motionState = new Ammo.btDefaultMotionState(this.ammoTransform);
          var rbInfo = new Ammo.btRigidBodyConstructionInfo(this.mass, motionState, this.shape.ammo, inertia);
          this.ammo = new Ammo.btRigidBody(rbInfo);
        }
      }
    },
    constraint: {
      add: function () {
        if (!this.enabled && isSimulator()) {
          this.create();
          getScene().ammo.addConstraint(this.ammo);
          this.enabled = true;
          this.bodyA.ammo.activate();
          this.bodyB.ammo.activate();
        }
      },
      remove: function () {
        if (this.enabled && isSimulator()) {
          getScene().ammo.removeConstraint(this.ammo);
          Ammo.destroy(this.ammo);
          this.enabled = false;
          this.bodyA.ammo.activate();
          this.bodyB.ammo.activate();
        }
      },
      setAngle: function (angle) {
        if (isSimulator()) {
          //use setMotorTarget ?
          //this.ammo.setLimit(angle, angle, 0.9, 0.3, 0.9);
          //this.ammo.setMotorTarget(angle, 2);
          this.angle = angle;
          this.bodyA.ammo.activate();
          this.bodyB.ammo.activate();
        }
      },
      relax: function () {
        if (isSimulator()) {
          this.ammo.setLimit(1, -1, 0.9, 0.3, 1.0);
          this.bodyA.ammo.activate();
          this.bodyB.ammo.activate();
        }
      },
      enableMotor: function (velocity, binary) {
        if (isSimulator()) {
          //this.ammo.setLimit(1, -1, 0.9, 0.3, 1.0);
          this.ammo.enableAngularMotor(true, velocity, binary);
          this.bodyA.ammo.activate();
          this.bodyB.ammo.activate();
        }
      },
      disableMotor: function () {
        if (isSimulator()) {
          this.ammo.enableAngularMotor(false, 0, 0);
          this.bodyA.ammo.activate();
          this.bodyB.ammo.activate();
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
    connector: function (obj) {
      if (ammoHelper) {
        // ammoHelper.destroy(obj.ammoTransform);
      }
    },
    constraint: function (obj) {
      if (isSimulator()) {
        obj.remove();
      }
    },
    body: function (obj) {
      _.each(obj.connector, function (c) {
        destroy(c);
      });
      var scene = getScene();
      if (useWebGL()) {
        scene.three.remove(obj.three);
        obj.three.geometry.dispose();
        obj.three.material.dispose();
      }
      if (isSimulator()) {
        scene.ammo.removeRigidBody(obj.ammo);
        Ammo.destroy(obj.ammo);
      }
    },
    light: function (obj) {
    },
    monitor: function (obj) {
      destructor.renderer.call(null, obj.renderer);
    },
    camera: function (obj) {
    },
    renderer: function (obj) {
      if (jQuery) {
        delete obj.canvas;
        var j = jQuery('[monitor="' + obj.id + '"]');
        j.attr('monitor', '');
        j[getSettings().reuseCanvas ? 'hide' : 'remove']();
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
    },
    scene: function (scene) {
      //should call this after destroying all children generated by make
      if (useWebGL()) {
        cancelAnimationFrame(scene._rafid);
        clearTimeout(scene._rstid);
        while (scene.three.children.length) {
          var child = scene.three.children[0];
          scene.three.remove(child);
          if (child.geometry) child.geometry.dispose();
          if (child.material) child.material.dispose();
        }
      }
      //TODO miss something ?
      if (isSimulator()) {
        clearTimeout(scene._stid);
        Ammo.destroy(scene.btDefaultCollisionConfiguration);
        Ammo.destroy(scene.btCollisionDispatcher);
        Ammo.destroy(scene.btDbvtBroadphase);
        Ammo.destroy(scene.btSequentialImpulseConstraintSolver);
        //delete scene.ammo;
      }
    },
    settings: _.identity
  };

  function destroy(obj) {
    //TODO consider system and worker behavior
    if (!obj) return;
    obj._destroyed = true;
    if (debug) console.log('destroy', obj.group, obj.id);
    if (objects[obj.group] && objects[obj.group][obj.id]) {
      destructor[obj.group] && destructor[obj.group](objects[obj.group][obj.id]);
      delete objects[obj.group][obj.id];
    } else {
      obj.group && destructor[obj.group] && destructor[obj.group](obj);
    }
  }

  function destroyScope(name) {
    var previousScope = getScope();
    if (previousScope != name) {
      setScope(name);
    }
    stopSimulation();
    stopRender();
    _.each(destructor, function (fun, groupName) {
      _.each(objects[groupName], function (obj) {
        destroy(obj);
      });
    });
    if (previousScope != name) {
      setScope(previousScope);
    }
  }

  function destroyAll() {
    _.each(getScopes(), function (name) {
      destroyScope(name);
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
      ammoHelper = lib;
    } else if (lib.Vector3) {
      THREE = lib;
    } else if (lib.ajax) {
      jQuery = lib;
    } else {
      return false;
    }
    return true;
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
      return undefined;
    }
    type = constructor[group][type] && type || '_default';
    var cons = constructor[group] && constructor[group][type];
    var obj;
    if (typeof cons == 'function') {
      if (typeof(options) != 'object') options = {};
      if (!options.id) options.id = nextId(type);
      obj = new cons(options);
      if (group !== SYSTEM) obj.group = group;
      if (group !== SYSTEM) obj.type = type;
      if (!options._dontSave && objects[group]) objects[group][obj.id] = obj;
      debug && console.log('make ' + group + '.' + type + ' ' + JSON.stringify(opt(obj)));
    } else {
      console.warn('incapable of making object:');
      console.log(JSON.stringify(arguments));
    }
    return obj;
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
  function updatePack(pack) {
    var group, type, options;
    var args = utils.argList(arguments);
    args.shift();
    switch (args.length) {
      case 3:
        options = args[2];
        group = args[0];
        type = args[1];
        break;
      case 2:
        options = args[1];
        group = args[0];
        type = options.type;
        break;
      case 1:
        options = args[0];
        group = options.group;
        type = options.type;
        break;
    }
    if (!group) {
      console.log('updatePack', args);
      console.error('group is not defined');
      return pack;
    }
    type = type || '_default';
    if (typeof(options) != 'object') options = {};
    if (!pack[group]) pack[group] = {};
    pack[group][options.id == undefined ? nextId(type) : options.id] = options;
    return pack;
  }

  //get first of the kind in objects
  function getSome(group) {
    return getObject(group, _.keys(objects[group])[0]);
  }

//get first of the kind in objects
  function makeSome(group) {
    return make(group, '_default', {});
  }

  function getScene() {
    return getSome('scene');
  }

  function getSettings() {
    return getSome('settings');
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
    _.each(objects, function (groupObject, groupName) {
      groupObject = json[groupName];
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

  function copyPhysicsToThree(body) {
    body.three.position.copy(body.position);
    body.three.quaternion.copy(body.quaternion);
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

  /**
   * SIMULATION **************************************************************
   */

  function loadScene(obj, settings) {
    switch (typeof obj) {
      case 'object':
        break;
      case 'string':
        //its an url
        obj = require(obj);
        break;
      default:
        obj = null;
    }
    if (obj == null) {
      throw 'loadScene: obj format null';
    }
    if (obj && obj.getObject) {
      obj = obj.getObject();
    }
    if (typeof obj !== 'object') {
      throw 'loadScene: obj is not an object';
    }
    //if no settings or scene present, make one
    if (!_.size(obj.settings)) updatePack(obj, 'settings', defaultSettings);
    if (!_.size(obj.scene)) updatePack(obj, 'scene', {});
    //override settings
    settings = _.extend(_.find(obj.settings, _.identity), settings);
    //add necessary libraries
    if (!THREE) addLibrary(require('./lib/three.js'));
    if (!jQuery) addLibrary(require('./lib/jquery.js'));
    if (!ammoHelper) ammoHelper = require('./lib/ammo.js');
    if (settings.webWorker) {
      createWorker();
    } else {
      if (!Ammo) addLibrary(ammoHelper);
    }
    module.exports.loadObjects(obj); //for worker as well
    settings = getSettings();
    getSome('monitor') || makeSome('monitor');
    if (settings.autoStart) {
      module.exports.startSimulation(); //works for worker as well
      setTimeout(startRender, 0);
    }
  }

  function loadObjects(json) {
    unpack(json);
    var settings = getSettings();
    var scene = getScene();
    if (settings.axisHelper) {
      if (useWebGL()) scene.three.add(new THREE.AxisHelper(settings.axisHelper));
    }
    loadSystem(objects);
    function loadSystem(objs) {
      _.each(objs.system, loadSystem);
      _.each(objs.body, function (body) {
        if (!body._added && (body._added = true)) {
          method.body.updateMotionState.call(body);
          if (useWebGL()) scene.three.add(body.three);
          if (isSimulator()) scene.ammo.addRigidBody(body.ammo);
        }
      });
      _.each(objs.constraint, function (cons) {
        if (!cons._added) {
          cons._added = true;
          cons.add();
        }
      });
      if (useWebGL()) {
        _.each(objs.light, function (light) {
          if (!light._added && (light._added = true)) {
            scene.three.add(light.three);
          }
        });
      }
    }
  }

  function startSimulation() {
    var settings = getSettings();
    var trans = Ammo ? new Ammo.btTransform() : undefined;
    var packet = {};
    var scene = getScene();
    var isWorker = utils.isBrowserWorker();

    //copy position and rotation from ammo and then to three
    function copyPhysics(objs) {
      _.each(objs.system, copyPhysics);
      _.each(objs.body, function (body) {
        if (isSimulator()) copyPhysicsFromAmmo(body, trans);
        if (THREE && !isWorker) copyPhysicsToThree(body);
      });
    }

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
      var previousScope = getScope();
      if (previousScope != scene.scope) {
        setScope(scene.scope);
      }
      //prepare next call
      scene._stid = setTimeout(simulate, 1000 / settings.simFrequency);
      //compute time since last call
      var curTime = (new Date()).getTime() / 1000;
      var dt = curTime - scene._lastTime;
      scene._lastTime = curTime;
      //callbacks beforeStep
      _.each(objects.constraint, function(c, id){
        if ((c.type=='hinge') && (c.angle!==undefined)){
          c.ammo.setMotorTarget(c.angle, dt);
        }
      });
      //maxSubSteps > timeStep / fixedTimeStep
      //so, to be safe maxSubSteps = 2 * speed * 60 * dt + 2
      var maxSubSteps = ~~(2 * settings.simSpeed * 60 * dt + 2);
      if (isSimulator()) scene.ammo.stepSimulation(settings.simSpeed / settings.simFrequency, maxSubSteps);
      copyPhysics(objects);
      if (isWorker) {
        packPhysics(objects, packet);
        post(['transfer', packet], 'transfer physics');
      }
      if (previousScope != scene.scope) {
        setScope(previousScope);
      }
    }

    scene._lastTime = (new Date()).getTime() / 1000;
    stopSimulation(); //make sure is stopped
    simulate(); //then go
  }

  function stopSimulation() {
    var scene = getScene();
    scene && clearTimeout(scene._stid);
  }

  function startRender() {
    var settings = getSettings();
    if (!controller) controller = require('./util/controller.js');
    var scene = getScene();
    var monitor = getSome('monitor');

    function render() {
      if (scene._destroyed) return;
      var previousScope = getScope();
      if (previousScope != scene.scope) {
        setScope(scene.scope);
      }
      scene._rstid = setTimeout(function () {
        scene._rafid = requestAnimationFrame(render);
      }, 1000 / settings.renderFrequency);
      controller.moveCamera(monitor.camera);
      monitor.renderer.three.render(scene.three, monitor.camera.three);
      if (previousScope != scene.scope) {
        setScope(previousScope);
      }
    }

    setTimeout(render, 1000 / settings.renderFrequency);
  }

  function stopRender() {
    var scene = getScene();
    scene && (typeof(cancelAnimationFrame) != 'undefined') && cancelAnimationFrame(scene._rafid);
    scene && clearTimeout(scene._rstid);
  }

  /**
   * WORKER **************************************************************
   */

  var workerListener = {
    console: function () {
      var args = [];
      var type = arguments[0];
      for (var i = 1; i < arguments.length; i++) {
        args.push(arguments[i]);
      }
      console.log('*** worker says:');
      console[type].apply(console, args);
    },
    factory: function () {
      var args = utils.argList(arguments);
      var fun = args.shift();
      return module.exports[fun].apply(null, args);
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
          var previousScope = getScope();
          if (previousScope != request.scope) {
            setScope(request.scope);
          }
          var result = workerListener[request.action].apply(self, request['arguments']);
          if (request.action != 'console') {
            var response = {};
            response.id = request.id;
            if (request.comment) response.comment = request.comment;
            response.result = result;
            worker.postMessage(response);
          }
          if (previousScope != getScope()) {
            setScope(previousScope);
          }
        }
      } else {
        //if (debug) console.log(util.stringify(request));
      }
    };
    wrapWorkerFunctions();
    console.log('using web worker');
    return worker;
  }

  function post(args, comment) {
    var message = {
      action: 'factory',
      arguments: args,
      comment: comment,
      scope: getScope(),
      id: nextId(0)
    };
    if (worker) {
      worker.postMessage(message);
    } else if (utils.isBrowserWorker()) {
      postMessage(message);
    }
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
    'makeSome',
    'loadObjects',
    'setDebug',
    'destroy',
    'destroyAll',
    'destroyScope',
    'startSimulation',
    'stopSimulation'
  ];

  //wrap functions to send commands to worker as well
  function wrapWorkerFunctions() {
    _.each(workerFunctions, function (key) {
      var fun = module.exports[key];
      module.exports[key] = function () {
        //if (debug) console.log('wrap:' + key);
        var args = utils.argList(arguments);
        args.unshift(key);
        //send command to worker
        post(args, 'wrapped ' + key);
        //now apply also here
        return fun.apply(null, arguments);
      };
    });
    //remove all functions, avoiding further wrapping
    while (workerFunctions.pop()) {
    }
  }


  /**
   * EXPORTS ***************************************************************
   */

  module.exports = {
    addLibrary: addLibrary,
    constructor: constructor,
    make: make,
    unpack: unpack,
    pack: pack,
    updatePack: updatePack,
    loadObjects: loadObjects,
    loadScene: loadScene,
    structure: structure,
    options: options,
    include: include,
    omitId: oid,
    setDebug: setDebug,
    destroy: destroy,
    destroyAll: destroyAll,
    destroyScope: destroyScope,
    objects: objects,
    getObject: getObject,
    getSome: getSome,
    makeSome: makeSome,
    startSimulation: startSimulation,
    stopSimulation: stopSimulation,
    startRender: startRender,
    stopRender: stopRender,
    createWorker: createWorker,
    dismissWorker: dismissWorker,
    hasWorker: hasWorker,
    transfer: transfer,
    setScope: setScope,
    getScope: getScope,
    getScopes: getScopes,
    getAmmo: function () {
      return ammoHelper;
    },
    method: method,
    execMethod: execMethod
  };

  return module.exports;
})();
