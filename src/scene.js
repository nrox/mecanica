function Scene(options, system) {
  this.construct(options, system, 'basic');
}

Scene.prototype.types = {
  basic: function (options) {
    this.include(options, {
      solver: this.settingsFor('solver') //'sequential' //pgs, dantzig
    });
    this.gravity = this.globalSettings().gravity;
    this.createWorld();
    this.showAxisHelper();
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
    this.gravity = new Vector(this.gravity);
    this.ammo.setGravity(this.gravity.ammo);
  }
  if (this.runsRender()) {
    this.three = new THREE.Scene();
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
    if (settings.axisHelper) {
      if (this.runsRender()) this.three.add(new THREE.AxisHelper(settings.axisHelper));
    }
  }
};

Scene.prototype.destroy = function () {
  try {
    if (this.runsPhysics()) {
      Ammo.destroy(this.ammo);
      Ammo.destroy(this.btDefaultCollisionConfiguration);
      Ammo.destroy(this.btCollisionDispatcher);
      Ammo.destroy(this.btDbvtBroadphase);
      this.gravity.destroy();
    }
  } catch (e) {
    console.log(this.group, this.id, e.message || e);
    throw e;
  }
};

extend(Scene, Component);
Component.prototype.maker.scene = Scene;