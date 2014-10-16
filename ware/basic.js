module.exports = {
  shape: {
    id1: { type: 'box', dx: 1, dy: 2, dz: 3 },
    id2: { type: 'sphere', r: 3, segments: 8, position: {x: 0, y: 3, z: 5} }
  },
  material: {
    id3: { type: 'basic', color: 0x772244 },
    id4: { type: 'basic', wireframe: true }
  },
  body: {
    id5: { type: 'basic', mass: 0, shape: 'id1', material: 'id4'}
  },
  scene: {
    s1: { type: 'basic' }
  },
  camera: {
    cam: {type: 'default'}
  },
  renderer: {
    render: {type: 'default'}
  }
};


