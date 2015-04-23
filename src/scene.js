function Scene(options, system) {
  this.construct(options, system, 'basic');
}

Scene.prototype.types = {
  basic: function (options) {
    this.include(options, {
      solver: 'sequential', //pgs, dantzig
      gravity: {y: -9.81}
    });
    this.showAxisHelper();
    this.createWorld();
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
    this.gravity.scale = this.lengthConversionRate();
    this.ammo.setGravity(new Vector(this.gravity).ammo);
  }
};

Scene.prototype.makeConstraintsSolver = function () {
  try {
    this.constraintSolver = {
      sequential: function () {
        return new Ammo.btSequentialImpulseConstraintSolver();
      },
      dantzig: function () {
        return new Ammo.btMLCPSolver(new Ammo.btDantzigSolver());
      },
      pgs: function () {
        return new Ammo.btMLCPSolver(new Ammo.btSolveProjectedGaussSeidel());
      }
    }[this.solver]();
    console.log('using solver: ' + this.solver);
  } catch (e) {
    console.log('solver type' + this.solver);
    console.error(e);
  }
};

Scene.prototype.showAxisHelper = function () {
  var settings = this.getSettings();
  if (this.runsRender()) {
    this.three = new THREE.Scene();
    if (settings.axisHelper) {
      if (this.runsRender()) this.three.add(new THREE.AxisHelper(settings.axisHelper));
    }
  }
};

extend(Scene, Component);
Component.prototype.maker.scene = Scene;