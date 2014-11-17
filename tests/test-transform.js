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
    delete copy.body.b.position.id;
    console.log('red initial position:', utils.stringify(copy.body.a.position));
    console.log('red initial rotation:', utils.stringify(copy.body.a.rotation));
    console.log('green final position:', utils.stringify(copy.body.b.position));
    console.log('green final quaternion:', utils.stringify(copy.body.b.quaternion));
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
            base: { x: 1.2, y: 1.2, z: 1.2},
            up: {x:1} && utils.randomXYZ(-1, 1),
            front: {z: -1} && utils.randomXYZ(-1, 1)
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
  var copy, type, b, t1, t2, t3, p, q;

  normalizeConnector(obj.body.a.connector.c)

  type = 'body to origin';
  copy = utils.deepCopy(obj);
  //define random position and rotation for body a
  copy.body.a.position = {
    x: utils.randomLinear(-4, -3), y: utils.randomLinear(-2, 2), z: utils.randomLinear(-2, 2)
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
  t1 = new Ammo.btTransform();
  t1.setRotation(q.ammo);
  t1.setOrigin(p.ammo);
  //calculate the inverse
  t2 = new Ammo.btTransform(t1.inverse());
  //apply the inverse to the current position and rotation
  var p2 = MxV(t2, p.ammo);
  var q2 = MxQ(t2, q.ammo);
  //update body b rotation and position with the inverted values
  //those values should be equivalent to origin and no rotation
  delete b.rotation;
  b.position = copyVectorFromAmmo({}, p2);
  b.quaternion = copyVectorFromAmmo({}, q2);
  test[type] = makeTest(copy, type);

  type = 'connector to origin';
  copy = utils.deepCopy(copy);

  b = utils.deepCopy(copy.body.a);
  copy.body.b = b;
  //with other color, green
  b.material.color = 0x338833;
  //create position and rotation using other factory
  p = f2.make('physics', 'position', b.position);
  q = f2.make('physics', 'quaternion', b.rotation);
  //get the transform equivalent to the rotation + position
  t1 = new Ammo.btTransform(q.ammo, p.ammo);
  t2 = new Ammo.btTransform(t1.inverse());
  t3 = new Ammo.btTransform(normalizeConnector(b.connector.c).inverse());

  p.ammo = new Ammo.btVector3(0.1, 0.1, 0.1);
  q.ammo = new Ammo.btQuaternion(0, 0, 0, 1);

  //apply the inverse to the current position and rotation
  p2 = MxV(t3, p.ammo);
  q2 = MxQ(t3, q.ammo);
  //update body b rotation and position with the inverted values
  //those values should be equivalent to origin and no rotation
  delete b.rotation;
  b.position = copyVectorFromAmmo({}, p2);
  b.quaternion = copyVectorFromAmmo({}, q2);
  test[type] = makeTest(copy, type);

}

function logTransform(title, t) {
  console.log(title);
  console.log(t.getRotation().x(), t.getRotation().y(), t.getRotation().z(), t.getRotation().w());
}

function MxV(m, v) {
  var b = m.getBasis();
  var o = m.getOrigin();
  var r = v.dot3(b.getRow(0), b.getRow(1), b.getRow(2));
  r.op_add(o);
  return r;
}

function MxQ(m, q) {
  var r = m.getRotation();
  r.op_mul(q);
  return r;
}

function copyVectorFromAmmo(o, ammo) {
  o.x = ammo.x();
  o.y = ammo.y();
  o.z = ammo.z();
  if (ammo instanceof Ammo.btQuaternion) {
    o.w = ammo.w();
  }
  return o;
}

function normalizeConnector(c) {
  var up = new Ammo.btVector3(c.up.x || 0, c.up.y || 0, c.up.z || 0);
  up.normalize();
  var front = new Ammo.btVector3(c.front.x || 0, c.front.y || 0, c.front.z || 0);
  var wing = up.cross(front);
  wing = new Ammo.btVector3(wing.x(), wing.y(), wing.z());
  wing.normalize();
  front = wing.cross(up);
  front = new Ammo.btVector3(front.x(), front.y(), front.z());
  front.normalize();
  var base = new Ammo.btVector3(c.base.x || 0, c.base.y || 0, c.base.z || 0);
  var v1 = wing;
  var v2 = up;
  var v3 = front;
  var m3 = new Ammo.btMatrix3x3(
    v1.x(), v1.y(), v1.z(),
    v2.x(), v2.y(), v2.z(),
    v3.x(), v3.y(), v3.z()
  );
  m3 = m3.transpose();
  copyVectorFromAmmo(c.up, up);
  copyVectorFromAmmo(c.front, front);
  var t = new Ammo.btTransform();
  t.setBasis(m3);
  t.setOrigin(base);
  return t;
}

addAllTests();
module.exports.test = test;
module.exports.clearObjects = clearObjects;