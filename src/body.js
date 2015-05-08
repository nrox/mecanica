function Body(options, system) {
  this.construct(options, system, 'basic');
}

Body.prototype.types = {
  copy: function (options) {
    this.include(options, {
      of: undefined,
      isTemplate: false,
      position: undefined, quaternion: undefined, rotation: undefined,
      approach: undefined
    });
    this.notifyUndefined(['of']);
    var of = this.parentSystem.getBody(this.of);
    var json = of.toJSON();
    _.extend(json, this.options());
    _.each(['mass', 'mask', 'material'], function (property) {
      if (options[property] != undefined) json[property] = options[property];
    });
    Body.prototype.types.basic.call(this, json);
  },
  basic: function (options) {
    this.include(options, {
      shape: undefined,
      material: undefined,
      mass: 0,
      isTemplate: false,
      angularDamping: 0.3,
      linearDamping: 0.1,
      mask: undefined,
      position: undefined, quaternion: undefined, rotation: undefined,
      approach: undefined, //takes the form {connector:<id>, targetBody:<id,map>, targetConnector:<id>}
      connector: {}
    });
    this.notifyUndefined(['mass', 'shape', 'material']);
    if (this.settingsFor('freeze')) {
      this.mass = 0;
    }
    var _this = this;
    this.shape = this.parentSystem.getShape(this.shape) || new Shape(this.shape, this.parentSystem);
    this.material = this.parentSystem.getMaterial(this.material) || new Material(this.material, this.parentSystem);
    this.position = new Vector(this.position);
    this.applyLengthConversionRate(this.position);
    this.quaternion = new Quaternion(this.quaternion || this.rotation || {w: 1});

    if (this.runsRender()) {
      this.three = new THREE.Mesh(this.shape.three, this.material.three);
      var axisHelper = this.settingsFor('axisHelper');
      if (axisHelper) {
        if (isNaN(axisHelper) || axisHelper === true) {
          axisHelper = 1.5;
        }
        this.shape.three.computeBoundingSphere();
        var r = this.shape.three.boundingSphere.radius * axisHelper;
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
    if (this.approach) {
      this.approachBody(this.approach);
    } else {
      this.applyParentSystemsTransform();
      this.updateMotionState();
      this.syncPhysics();
    }
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
    rbInfo.m_linearDamping = this.linearDamping;
    rbInfo.m_angularDamping = this.angularDamping;
    if (this.ammo) Ammo.destroy(this.ammo);
    this.ammo = new Ammo.btRigidBody(rbInfo);
  }
};

Body.prototype.applyParentSystemsTransform = function () {
  this.parentSystem.applyTransform(this.ammoTransform);
};

Body.prototype.addToScene = function (scene) {
  if (!this._added && !this.isTemplate) {
    this._added = true;
    if (this.runsRender()) scene.three.add(this.three);
    if (this.runsPhysics()) {
      if (this.mask) {
        scene.ammo.addRigidBody(this.ammo, parseInt(this.mask, 2), parseInt(this.mask, 2));
      } else {
        scene.ammo.addRigidBody(this.ammo);
      }
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
  var json = _.pick(this._options,
    'type', 'mass', 'isTemplate', 'shape', 'material', 'mask', 'of', 'angularDamping', 'linearDamping'
  );
  json.position = this.position.toJSON();
  json.quaternion = this.quaternion.toJSON();
  json.connector = {};
  _.each(this.connector, function (connector, key) {
    json.connector[key] = connector.toJSON();
  });
  return json;
};

Body.prototype.getPosition = function () {
  return this.position;
};

Body.prototype.getQuaternion = function () {
  return this.quaternion;
};

Body.prototype.approachBody = function (approach) {
  var connector, targetBody, targetConnector;
  try {
    connector = this.connector[approach.connector];
    targetBody = this.parentSystem.getBody(approach.targetBody);
    targetConnector = targetBody.connector[approach.targetConnector];
    connector.approachConnector(targetConnector);
    this.syncPhysics();
  } catch (e) {
    console.log('error while approaching ', this.id, 'to', approach);
    console.log('connector, targetBody, targetConnector :', connector, targetBody, targetConnector);
    console.log('approach should be ', {connector: '{id}', targetBody: '{id,map}', targetConnector: '{id}'});
    throw e;
  }
};

extend(Body, Component);
Component.prototype.maker.body = Body;

