var _ = require('../../lib/underscore.js');

var defaultOptions = {
  demo: true,
  r: 0.3,
  dx: 5,
  dy: 4,
  dz: 6,
  gap: 0.01,
  removeSides: false
};

var getObject = function (o) {
  o = _.defaults(o || {}, defaultOptions);
  var r = o.r;
  var bx = o.dx - 2 * r - 2 * o.gap;
  var by = o.dy - 2 * r - 2 * o.gap;
  var bz = o.dz - 2 * r - 2 * o.gap;

  var json = {
    shape: {
      center: {type: 'box', dx: bx, dy: by, dz: bz},
      side: {type: 'box', dx: bx, dy: by, dz: bz},
      cylinderX: {type: 'cylinder', r: r, dy: bx},
      cylinderY: {type: 'cylinder', r: r, dy: by},
      cylinderZ: {type: 'cylinder', r: r, dy: bz},
      sphere: {type: 'sphere', r: r},
      smooth: {
        type: 'compound',
        parent: 'center',
        children: {
          cylinderY0: {shape: 'cylinderY', position: {x: -bx / 2, z: -bz / 2}},
          cylinderY1: {shape: 'cylinderY', position: {x: -bx / 2, z: bz / 2}},
          cylinderY2: {shape: 'cylinderY', position: {x: bx / 2, z: -bz / 2}},
          cylinderY3: {shape: 'cylinderY', position: {x: bx / 2, z: bz / 2}},
          cylinderX0: {shape: 'cylinderX', position: {y: -by / 2, z: -bz / 2}, rotation: {z: Math.PI / 2}},
          cylinderX1: {shape: 'cylinderX', position: {y: -by / 2, z: bz / 2}, rotation: {z: Math.PI / 2}},
          cylinderX2: {shape: 'cylinderX', position: {y: by / 2, z: -bz / 2}, rotation: {z: Math.PI / 2}},
          cylinderX3: {shape: 'cylinderX', position: {y: by / 2, z: bz / 2}, rotation: {z: Math.PI / 2}},
          cylinderZ0: {shape: 'cylinderZ', position: {x: -bx / 2, y: -by / 2}, rotation: {x: Math.PI / 2}},
          cylinderZ1: {shape: 'cylinderZ', position: {x: -bx / 2, y: by / 2}, rotation: {x: Math.PI / 2}},
          cylinderZ2: {shape: 'cylinderZ', position: {x: bx / 2, y: -by / 2}, rotation: {x: Math.PI / 2}},
          cylinderZ3: {shape: 'cylinderZ', position: {x: bx / 2, y: by / 2}, rotation: {x: Math.PI / 2}},
          sphere0: {shape: 'sphere', position: {x: -bx / 2, y: -by / 2, z: -bz / 2}},
          sphere1: {shape: 'sphere', position: {x: -bx / 2, y: -by / 2, z: bz / 2}},
          sphere2: {shape: 'sphere', position: {x: -bx / 2, y: by / 2, z: -bz / 2}},
          sphere3: {shape: 'sphere', position: {x: -bx / 2, y: by / 2, z: bz / 2}},
          sphere4: {shape: 'sphere', position: {x: bx / 2, y: -by / 2, z: -bz / 2}},
          sphere5: {shape: 'sphere', position: {x: bx / 2, y: -by / 2, z: bz / 2}},
          sphere6: {shape: 'sphere', position: {x: bx / 2, y: by / 2, z: -bz / 2}},
          sphere7: {shape: 'sphere', position: {x: bx / 2, y: by / 2, z: bz / 2}}
        }
      }
    }
  };

  if (!o.removeSides) {
    _.extend(json.shape.smooth.children, {
      side0: {shape: 'side', position: {x: -r}},
      side1: {shape: 'side', position: {x: r}},
      side2: {shape: 'side', position: {y: -r}},
      side3: {shape: 'side', position: {y: r}},
      side4: {shape: 'side', position: {z: -r}},
      side5: {shape: 'side', position: {z: r}}
    });
  }

  if (o.demo) {
    _.extend(json, {
      body: {
        demo: {
          mass: 0,
          shape: 'smooth',
          material: {type: 'phong', color: 0x994433}
        }
      }
    });
  }

  return json;
};

module.exports.defaultOptions = defaultOptions;
module.exports.getObject = getObject;


