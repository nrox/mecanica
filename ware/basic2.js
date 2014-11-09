module.exports = {
  shape: {
    id1: { type: 'sphere', r: 2, segments: 16 },
    id2: { type: 'sphere', r: 1, segments: 8 }
  },
  material: {
    id3: { wireframe: true, color: 0x772244 },
    id4: { wireframe: true, color: 0x224477 }
  },
  body: {
    id5: { mass: 0, shape: 'id1', material: 'id4'},
    id6: { mass: 1, shape: 'id2', material: 'id3', position: {x: 0, y: 0, z: 3}}
  },
  connector: {
    c1: {body: 'id5'},
    c2: {body: 'id6', base: {z: -3}}
  },
  constraint: {
    cons: {
      a: 'c1', b: 'c2', bodyA: 'id5', bodyB: 'id6'
    }
  },
  scene: {
    s1: {}
  },
  monitor: {
    cam: {camera: 'tracker', lookAt: 'id6', axis: {x: 1, y: 0.5, z: 0.3}, distance: 20, inertia: 5}
  }
};


