module.exports = {
  shape: {
    id1: { type: 'box', dx: 1, dy: 2, dz: 2, segments: 4 },
    id2: { type: 'sphere', r: 1, segments: 8 }
  },
  material: {
    id3: { type: 'basic', wireframe: true, color: 0x772244 },
    id4: { type: 'basic', wireframe: true, color: 0x224477 }
  },
  body: {
    id5: { type: 'basic', mass: 0, shape: 'id1', material: 'id4'},
    id6: { type: 'basic', mass: 1, shape: 'id2', material: 'id3', position: {x: 0, y: 0, z: 3}}
  },
  connector: {
    c1: {body: 'id5'},
    c2: {body: 'id6', base: {z: -3}}
  },
  constraint: {
    cons: {
      a: 'c1', b: 'c2'
    }
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


