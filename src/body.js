function Body(options, system) {
  this.construct(options, system, 'basic');
}

Body.prototype.types = {
  basic: function (options, system) {
    this.include(options, {
      shape: undefined,
      material: undefined,
      mass: 0, position: {}, quaternion: undefined, rotation: undefined,
      connector: {}, axisHelper: system.getSettings().axisHelper
    });
    this.notifyUndefined(['shape','material']);

    var shape;
    var _this = this;
    if (typeof this.shape == 'string') { //get from objects with id
      shape = system.getObject('shape', this.shape);
    } else { //make from options
      shape = new Shape(this.shape, system);
    }
    this.shape = shape;

    var material;
    if (typeof this.material == 'string') { //get from objects with id
      material = system.getObject('material', this.material);
    } else { //make from options
      material = new Material(this.material, system);
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
      new Connector(c, system);
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