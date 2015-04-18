function Scene(options, system) {
  this.construct(options, system, 'basic');
}

Scene.prototype.types = {
  _generic: function (options) {
    this.include(options, {
      gravity: {y: -9.81}
    });
    this.showAxisHelper();
    this.createWorld();
  },
  basic: function (options) {
    Scene.prototype.types._generic.call(this, options);
  },
  mlcp: function (options) {
    Scene.prototype.types._generic.call(this, options);
  }
};

Scene.prototype.createWorld = function () {
  if (this.runsPhysics()) {
    this.makeConstraintsSolver();
    this.btDefaultCollisionConfiguration = new Ammo.btDefaultCollisionConfiguration();
    this.btCollisionDispatcher = new Ammo.btCollisionDispatcher(this.btDefaultCollisionConfiguration);
    this.btDbvtBroadphase = new Ammo.btDbvtBroadphase();
    this.ammo = new Ammo.btDiscreteDynamicsWorld(
      this.btCollisionDispatcher,
      this.btDbvtBroadphase,
      this.constraintSolver,
      this.btDefaultCollisionConfiguration
    );
    this.ammo.setGravity(new Vector(this.gravity).ammo);
  }
};

Scene.prototype.makeConstraintsSolver = function () {
  this.constraintSolver = {
    basic: function () {
      return new Ammo.btSequentialImpulseConstraintSolver();
    },
    mlcp: function () {
      return new Ammo.btMLCPSolver(new Ammo.btDantzigSolver());
    }
  }[this.type]();
};

Scene.prototype.showAxisHelper = function () {
  var settings = this.getSettings();
  if (this.runsWebGL()) {
    this.three = new THREE.Scene();
    if (settings.axisHelper) {
      if (this.runsWebGL()) this.three.add(new THREE.AxisHelper(settings.axisHelper));
    }
  }
};

extend(Scene, Component);
Component.prototype.maker.scene = Scene;