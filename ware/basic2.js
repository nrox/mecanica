module.exports = {
  settings: {
    over: {
      wireframe: false
    }
  },
  shape: {
    fixed: { type: 'sphere', r: 2, segments: 32 },
    satellite: { type: 'sphere', r: 1, segments: 16 }
  },
  material: {
    id3: {type: 'phong', color: 0x772244 },
    id4: {type: 'phong', color: 0x224477 }
  },
  body: {
    id5: { mass: 0, shape: 'fixed', material: 'id4',
      connector: {c1: {}}
    },
    id6: { mass: 0, shape: 'satellite', material: 'id3', position: {x: 0, y: 0, z: 3},
      connector: {c2: {base: {z: -3}}}
    }
  },
  constraint: {
    cons: {
      connectorA: 'c1', connectorB: 'c2', bodyA: 'id5', bodyB: 'id6'
    }
  },
  scene: {
    s1: {}
  },
  monitor: {
    cam: {camera: 'tracker', lookAt: 'id6', axis: {x: 1, y: 0.5, z: 0.3}, distance: 20, inertia: 5}
  },
  light: {
    l1: {type:'directional', color: 0xaaaaaa, position: {x: 5, y: 5, z: 5}}
  }
};


