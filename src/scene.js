function Scene(options, system) {
  this.construct(options, system, 'basic');
}

Scene.prototype.types = {
  basic: function (options) {
    this.include(options, {
      gravity: {y: -9.81}
    });
    var settings = this.getSettings();
    if (this.runsWebGL()) {
      this.three = new THREE.Scene();
      if (settings.axisHelper) {
        if (this.runsWebGL()) this.three.add(new THREE.AxisHelper(settings.axisHelper));
      }
    }
    if (this.runsPhysics()) {
      this.btDefaultCollisionConfiguration = new Ammo.btDefaultCollisionConfiguration();
      this.btCollisionDispatcher = new Ammo.btCollisionDispatcher(this.btDefaultCollisionConfiguration);
      this.btDbvtBroadphase = new Ammo.btDbvtBroadphase();
      this.constraintSolver = new Ammo.btSequentialImpulseConstraintSolver();
      this.ammo = new Ammo.btDiscreteDynamicsWorld(
        this.btCollisionDispatcher,
        this.btDbvtBroadphase,
        this.constraintSolver,
        this.btDefaultCollisionConfiguration
      );
      this.ammo.setGravity(new Vector(this.gravity).ammo);
    }
  },
  mlcp: function (options) {
    this.include(options, {
      gravity: {y: -9.81}
    });
    var settings = this.getSettings();
    if (this.runsWebGL()) {
      this.three = new THREE.Scene();
      if (settings.axisHelper) {
        if (this.runsWebGL()) this.three.add(new THREE.AxisHelper(settings.axisHelper));
      }
    }
    if (this.runsPhysics()) {
      this.btDefaultCollisionConfiguration = new Ammo.btDefaultCollisionConfiguration();
      this.btCollisionDispatcher = new Ammo.btCollisionDispatcher(this.btDefaultCollisionConfiguration);
      this.btDbvtBroadphase = new Ammo.btDbvtBroadphase();
      this.constraintSolver = new Ammo.btMLCPSolver(new Ammo.btDantzigSolver());
      this.ammo = new Ammo.btDiscreteDynamicsWorld(
        this.btCollisionDispatcher,
        this.btDbvtBroadphase,
        this.constraintSolver,
        this.btDefaultCollisionConfiguration
      );
      this.ammo.setGravity(new Vector(this.gravity).ammo);
    }
  }
};

extend(Scene, Component);
Component.prototype.maker.scene = Scene;