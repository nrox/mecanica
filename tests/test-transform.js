var utils = require('../util/utils.js');
var Ammo = require('../lib/ammo.js');
var THREE = require('../lib/three.js');
var factory = require('../factory.js');
var f2 = require('../factory.js');
//var _ = require('../lib/underscore.js');

f2.addLibrary(Ammo);
f2.addLibrary(THREE);

var test = {
};

function clearObjects() {
  factory.destroyAll();
}

function makeTest(pack, type) {
  pack = utils.deepCopy(pack);
  return function () {
    var copy = utils.deepCopy(pack);
    console.log('red: initial position', utils.stringify(copy.body.a.position));
    console.log('red: initial rotation', utils.stringify(copy.body.a.rotation));
    console.log('green: final position', utils.stringify(copy.body.b.position));
    console.log('green: final quaternion', utils.stringify(copy.body.b.quaternion));
    factory.setScope(type);
    factory.loadScene(copy);
  };
}

function addAllTests() {
  var obj = {
    body: {
      a: {
        type: 'basic',
        shape: { type: 'box', dx: 2, dz: 2, dy: 2, segments: 2 },
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        material: { type: 'phong', color: 0x883333 },
        mass: 0,
        connector: {
          c: {
            base: { x: 1, y: 1, z: 1},
            up: { y: 1},
            front: { x: 1}
          }
        }
      }
    },
    light: {
      l1: {position: {x: 5, z: -5}},
      l2: {position: {x: -7, y: 6, z: 5}, color: 0x8899bb},
      l3: {position: {y: -5, z: 1}, color: 0x445566}
    },
    monitor: {
      m1: {
        camera: 'satellite',
        lookAt: {},
        distance: 20
      }
    },
    scene: {
      sn: {}
    },
    settings: {
      s: {
        axisHelper: 10,
        wireframe: true,
        webWorker: false,
        autoStart: true,
        connectorHelper: 0.7,
        canvasContainer: '#container'
      }
    }
  };
  var copy, type, b, t1, t2, p, q;

  type = 'body to origin';
  copy = utils.deepCopy(obj);
  //define random position and rotation for body a
  copy.body.a.position = {
    x: utils.randomLinear(-3, -2), y: utils.randomLinear(-2, 2), z: utils.randomLinear(-2, 2)
  };
  copy.body.a.rotation = {
    x: utils.randomLinear(-1, 1), y: utils.randomLinear(-1, 1), z: utils.randomLinear(-1, 1)
  };
  //create a copy of body a and name it b
  b = utils.deepCopy(copy.body.a);
  copy.body.b = b;
  //with other color, green
  b.material.color = 0x338833;
  //create position and rotation using other factory
  p = f2.make('physics', 'position', b.position);
  q = f2.make('physics', 'quaternion', b.rotation);
  //get the transform equivalent to the rotation + position
  t1 = new Ammo.btTransform(q.ammo, p.ammo);
  //calcule the inverse
  t2 = t1.inverse();
  //apply the inverse to the current position and rotation
  var p2 = MxV(t2, p.ammo);
  var q2 = MxQ(t2, q.ammo);
  //update body b rotation and position with the inverted values
  //those values should be equivalent to origin and no rotation
  b.position.x = p2.x();
  b.position.y = p2.y();
  b.position.z = p2.z();
  delete b.rotation;
  b.quaternion = {};
  b.quaternion.x = q2.x();
  b.quaternion.y = q2.y();
  b.quaternion.z = q2.z();
  b.quaternion.w = q2.w();
  test[type] = makeTest(copy, type);

}

function MxV(m, v){
  var b = m.getBasis();
  var o = m.getOrigin();
  var r = v.dot3(b.getRow(0), b.getRow(1), b.getRow(2));
  r.op_add(o);
  return r;
}

function MxQ(m, q){
  var r = m.getRotation();
  r.op_mul(q);
  return r;
}

addAllTests();
module.exports.test = test;
module.exports.clearObjects = clearObjects;