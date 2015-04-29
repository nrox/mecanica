var _ = require('../lib/underscore.js');

var defaultOptions = {
  depth: 1,
  mass1: 1,
  mass2: 0.5,
  length1: 5,
  length2: 3,
  y: 10
};

function getObject(o) {
  o = _.defaults(o || {}, defaultOptions);
  var d = o.dispersion;
  return {
    shape: {
      support: { type: 'box', dx: o.depth, dy: o.depth, dz: o.depth},
      beam1: { type: 'box', dx: o.depth, dy: o.length1, dz: o.depth},
      beam2: { type: 'box', dx: o.depth, dy: o.length2, dz: o.depth}
    },
    material: {
      support: {type: 'phong', color: 0x772277 },
      beam1: {type: 'phong', color: 0x772222 },
      beam2: {type: 'phong', color: 0x227722 }
    },
    body: {
      support: {position: {y: o.y}, mass: 0, shape: 'support', material: 'support', connector: {c: {base: {}}}},
      sphere: {position: {y: -d, z: d}, mass: o.mass, shape: 'sphere', material: 'red', connector: {c: {base: {y: d}}}},
      cone: { position: {y: -d, z: -d}, mass: o.mass, shape: 'cone', material: 'red', connector: {c: {base: {y: d}}}},
      cylinder: { position: {y: -d, z: d, x: d}, mass: o.mass, shape: 'cylinder', material: 'blue', connector: {c: {base: {y: d}}}},
      compound: { position: {y: -d, z: d, x: -d}, mass: o.mass, shape: 'compound', material: 'blue', connector: {c: {base: {y: d}}}}
    },
    constraint: {
      c1: { bodyA: 'box', bodyB: 'sphere', connectorA: 'c', connectorB: 'c'},
      c2: { bodyA: 'box', bodyB: 'cone', connectorA: 'c', connectorB: 'c'},
      c3: { bodyA: 'box', bodyB: 'cylinder', connectorA: 'c', connectorB: 'c'},
      c4: { bodyA: 'box', bodyB: 'compound', connectorA: 'c', connectorB: 'c'}
    }
  }
}


module.exports.defaultOptions = defaultOptions;
module.exports.getObject = getObject;


