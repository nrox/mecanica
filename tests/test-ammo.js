var utils = require('./test-utils.js');
var Ammo = require('../dist/lib/ammo.js');
var _ = require('../dist/lib/underscore.js');

var test = {
  'important constructors': function () {
    utils.checkKeys(Ammo, [
      'btBoxShape', 'btCompoundShape', 'btCylinderShape', 'btGeneric6DofConstraint',
      'btCollisionDispatcher', 'btDbvtBroadphase', 'btHingeConstraint', 'btPoint2PointConstraint',
      'btQuaternion', 'btRigidBody', 'btSliderConstraint', 'btGearConstraint', 'btSphereShape', 'btEmptyShape',
      'btTransform',
      'btVector3', 'btVector4', 'btDiscreteDynamicsWorld', 'btConeShape', 'btMLCPSolver', 'btDantzigSolver', 'btSolveProjectedGaussSeidel'
    ], 'important constructors');
  },
  btTransform: function () {
    var obj = new Ammo.btTransform();
    utils.logKeys(obj, 'btTransform properties');
  },
  btMatrix3x3: function () {
    var obj = new Ammo.btTransform().getBasis();
    utils.logKeys(obj, 'btMatrix3x3 = btTransform().getBasis() properties');
  },
  btVector3: function () {
    var
      x = 1.2,
      y = 2.3,
      z = 3.4;
    var keys = ['x', 'y', 'z', 'setX', 'setY', 'setZ'];
    var obj = new Ammo.btVector3(x, y, z);
    utils.logKeys(obj, 'btVector3 properties');
    utils.checkKeys(obj, keys, 'checking btVector3 keys');
    utils.checkAproximateValues(obj, {
      x: x,
      y: y,
      z: z
    }, 'checking btVector3 approximate values');
  },
  btQuaternion: function () {
    //W = cos (0.5 × α)
    //X = x × sin (0.5 × α)
    //Y = y × sin (0.5 × α)
    //Z = z × sin (0.5 × α)
    var angle = Math.PI / 4;
    var x = Math.sin(0.5 * angle);
    var y = Math.sin(0.5 * angle);
    var z = Math.sin(0.5 * angle);
    var w = Math.cos(0.5 * angle);
    var keys = ['x', 'y', 'z', 'w', 'setX', 'setY', 'setZ', 'setW'];
    var obj = new Ammo.btQuaternion(x, y, z, w);
    utils.logKeys(obj, 'btQuaternion properties');
    utils.checkKeys(obj, keys, 'checking btQuaternion keys');
    utils.checkAproximateValues(obj, {
      x: x,
      y: y,
      z: z,
      w: w
    }, 'checking btQuaternion approximate values');
  },
  btHingeConstraint: function () {
    var obj = new Ammo.btHingeConstraint();
    utils.checkKeys(obj,
      [ 'setLimit',
        'enableAngularMotor',
        'setMotorTarget',
        'getHingeAngle'],
      'checking btHingeConstraint keys');

  },
  btSliderConstraint: function () {
    var obj = new Ammo.btSliderConstraint();
    utils.checkKeys(obj,
      [ 'setLowerLinLimit',
        'setUpperLinLimit',
        'setPoweredLinMotor',
        'setTargetLinMotorVelocity',
        'setMaxLinMotorForce',
        'getLinearPos',
        'setLowerAngLimit',
        'setUpperAngLimit',
        'setPoweredAngMotor',
        'setTargetAngMotorVelocity',
        'setMaxAngMotorForce'
      ],
      'checking btSliderConstraint keys');

  }
};

test.all = utils.all(test);
module.exports.test = test;
utils.run(test, process.argv, __filename);

