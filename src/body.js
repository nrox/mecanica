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