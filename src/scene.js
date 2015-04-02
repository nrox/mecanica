function Scene(options, system) {
  this.construct(options, system, 'basic');
}

Scene.prototype.types = {
  basic: function (options, system) {
    this.include(options, {
      gravity: {y: -9.81}
    });
    this.scope = system.getScope();
    if (this.runsWebGL()) {
      this.three = new THREE.Scene();
    }
    if (this.runsPhysics()) {
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
      this.ammo.setGravity(new Vector(this.gravity).ammo);
    }
  }
};

extend(Scene, Component);
Component.prototype.maker.scene = Scene;