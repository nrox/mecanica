function Constraint(options, system) {
  this.construct(options, system, 'point');
}

Constraint.prototype.types = {
  //super constructor
  _abstract: function (options) {
    this.include(options, {
      bodyA: undefined, //bodyA id
      bodyB: undefined, //bodyB id
      connectorA: undefined, //connector id, in body A
      connectorB: undefined, //connector id, in body B
      ratio: undefined,
      approach: false //move bodyB towards bodyA to match connectors
    });
    this.notifyUndefined(['connectorA', 'connectorB', 'bodyA', 'bodyB']);
    if (this.runsPhysics()) {
      this.bodyA = this.system.getObject('body', this.bodyA);
      this.bodyB = this.system.getObject('body', this.bodyB);
      this.connectorA = this.bodyA.connector[this.connectorA];
      this.connectorB = this.bodyB.connector[this.connectorB];
      if (this.approach) {
        utils.approachConnectors(this.connectorA, this.connectorB, this.system.make, Ammo);
      }
    }
    this.addPhysicsMethod('add', Constraint.prototype.methods.add);
    this.addPhysicsMethod('remove', Constraint.prototype.methods.remove);
  },
  //for pendulum-like constraints
  point: function (options) {
    Constraint.prototype.types._abstract.call(this, options);
    if (this.runsPhysics()) {
      this.create = function () {
        this.ammo = new Ammo.btPoint2PointConstraint(
          this.bodyA.ammo, this.bodyB.ammo, this.connectorA.base.ammo, this.connectorB.base.ammo
        );
      };
    }
  },
  //...ex: for motorized wheels
  motor: function (options) {
    this.include(options, {
      maxBinary: 1,
      maxVelocity: 0.5
    });
    Constraint.prototype.types.hinge.call(this, options);
    this.addPhysicsMethod('enable', Constraint.prototype.methods.enable);
    this.addPhysicsMethod('disable',Constraint.prototype.methods.disable);
  },
  //like robotic servo motors, based on the hinge constraint
  servo: function (options) {
    this.include(options, {
      angle: 0,
      lowerLimit: 0,
      upperLimit: Math.PI,
      maxBinary: 1,
      maxVelocity: 0.5
    });
    Constraint.prototype.types.hinge.call(this, options);
    this.afterCreate = function () {
      this.ammo.setLimit(this.lowerLimit, this.upperLimit, 0.9, 0.3, 1.0);
    };
    this.beforeStep = function () {
      if (this.runsPhysics()) {
        var c = this;
        //FIXME
        //https://llvm.org/svn/llvm-project/test-suite/trunk/MultiSource/Benchmarks/Bullet/include/BulletDynamics/ConstraintSolver/btHingeConstraint.h
        //"setMotorTarget sets angular velocity under the hood, so you must call it every tick to  maintain a given angular target."
        //var dt = Math.abs(c.ammo.getHingeAngle() - c.angle) / c.maxVelocity;
        c.ammo.setMotorTarget(c.angle, 0.1);
      }
    };
    this.addPhysicsMethod('enable', Constraint.prototype.methods.enable);
    this.addPhysicsMethod('disable', Constraint.prototype.methods.disable);
    this.addPhysicsMethod('setAngle', Constraint.prototype.methods.setAngle);
  },
  //for free wheels, doors
  hinge: function (options) {
    this.include(options, {
      lowerLimit: 1,
      upperLimit: -1
    });
    Constraint.prototype.types._abstract.call(this, options);
    if (this.runsPhysics()) {
      this.create = function () {
        this.ammo = new Ammo.btHingeConstraint(
          this.bodyA.ammo, this.bodyB.ammo, this.connectorA.base.ammo, this.connectorB.base.ammo,
          this.connectorA.up.ammo, this.connectorB.up.ammo
        );
      };
    }
  },
  gear: function (options) {
    Constraint.prototype.types._abstract.call(this, options);
    this.notifyUndefined(['ratio']);
    if (this.runsPhysics()) {
      this.create = function () {
        this.ammo = new Ammo.btGearConstraint(
          this.bodyA.ammo, this.bodyB.ammo, this.connectorA.up.ammo, this.connectorB.up.ammo, this.ratio
        );
      };
    }
  },
  //for linear motors, its based on the slider constraint
  //the position along the up direction is changed with a motor
  //has no angular rotation
  linear: function (options) {
    this.include(options, {
      position: 0,
      lowerLimit: 0,
      upperLimit: 1,
      maxForce: 1,
      maxVelocity: 1
    });
    Constraint.prototype.types.slider.call(this, options);
    this.create = function () {
      this.ammo = new Ammo.btSliderConstraint(
        this.bodyA.ammo, this.bodyB.ammo, this.transformA, this.transformB, true
      );
    };
    this.afterCreate = function () {
      var c = this;
      c.ammo.setLowerAngLimit(0);
      c.ammo.setUpperAngLimit(0);
      c.ammo.setPoweredAngMotor(false);
      c.ammo.setLowerLinLimit(c.lowerLimit);
      c.ammo.setUpperLinLimit(c.upperLimit);
      c.ammo.setMaxLinMotorForce(c.maxForce);
    };
    this.addPhysicsMethod('setPosition', Constraint.prototype.methods.setPosition);
  },
  //slider can move and rotate along the up direction
  slider: function (options) {
    this.include(options, {
      lowerLinear: 0,
      upperLinear: 1,
      lowerAngular: 1,
      upperAngular: 0
    });
    Constraint.prototype.types._abstract.call(this, options);
    if (this.runsPhysics()) {
      var transformA = new Ammo.btTransform();
      transformA.setOrigin(this.a.base.ammo);

      var yAxis = this.connectorA.up.ammo;
      var zAxis = this.connectorA.front.ammo;
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

      yAxis = this.connectorB.up.ammo;
      zAxis = this.connectorB.front.ammo;
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

      this.transformA = transformA;
      this.transformB = transformB;

      this.create = function () {
        this.ammo = new Ammo.btSliderConstraint(
          this.bodyA.ammo, this.bodyB.ammo, transformA, transformB, true
        );
      };
      this.afterCreate = function () {
        var c = this;
        c.ammo.setLowerAngLimit(c.lowerAngular);
        c.ammo.setUpperAngLimit(c.upperAngular);
        c.ammo.setLowerLinLimit(c.lowerLinear);
        c.ammo.setUpperLinLimit(c.upperLinear);
        c.ammo.setPoweredAngMotor(false);
        c.ammo.setPoweredLinMotor(false);
      };
    }
  },
  //fixed constraint have 0 degrees of freedom
  fixed: function (options) {
    Constraint.prototype.types._abstract.call(this, options);
    if (this.runsPhysics()) {
      var transformA = new Ammo.btTransform();
      transformA.setOrigin(this.connectorA.base.ammo);

      var yAxis = this.connectorA.up.ammo;
      var zAxis = this.connectorA.front.ammo;
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
      transformB.setOrigin(this.connectorB.base.ammo);

      yAxis = this.connectorB.up.ammo;
      zAxis = this.connectorB.front.ammo;
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
};

Constraint.prototype.methods = {
  add: function () {
    if (!this._added && this.runsPhysics()) {
      this.create();
      if (this.afterCreate) this.afterCreate();
      this.system.getScene().ammo.addConstraint(this.ammo);
      this._added = true;
      this.bodyA.ammo.activate();
      this.bodyB.ammo.activate();
    }
  },
  remove: function () {
    if (this._added && this.runsPhysics()) {
      this.system.getScene().ammo.removeConstraint(this.ammo);
      Ammo.destroy(this.ammo);
      this._added = false;
      this.bodyA.ammo.activate();
      this.bodyB.ammo.activate();
    }
  },
  //servos only
  setAngle: function (angle) {
    if (this.runsPhysics()) {
      //angle is set in beforeStep
      this.angle = angle;
      this.bodyA.ammo.activate();
      this.bodyB.ammo.activate();
    }
  },
  //linear motors only
  setPosition: function (position) {
    if (this.runsPhysics()) {
      //TODO do this the proper way, with target velocity. This is like forcing position and using brakes          this.position = position;
      this.position = position;
      this.ammo.setLowerLinLimit(position);
      this.ammo.setUpperLinLimit(position);
      this.bodyA.ammo.activate();
      this.bodyB.ammo.activate();
    }
  },
  enable: function (velocity, binary) {
    if (this.runsPhysics()) {
      this.ammo.enableAngularMotor(true, velocity, binary);
      this.bodyA.ammo.activate();
      this.bodyB.ammo.activate();
    }
  },
  disable: function () {
    if (this.runsPhysics()) {
      this.ammo.enableAngularMotor(false, 0, 0);
      this.bodyA.ammo.activate();
      this.bodyB.ammo.activate();
    }
  }
};

extend(Constraint, Component);
Component.prototype.maker.constraint = Constraint;