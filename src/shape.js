function Shape(options, system){
  var cons = this.types[options.type];
  cons.call(this, options, system);
}

Shape.prototype.types =  {
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