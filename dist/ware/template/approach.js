var _ = require('../../lib/underscore.js');

var defaultOptions = {
  position: {x: 0, y: 0, z: 0},
  rotation: {x: 0, y: 0},
  dimensions: {dx: 1, dy: 1, dz: 1},
  margin: 0.5
};

function getObject(o) {
  o = _.defaults(o || {}, defaultOptions);
  o.mass = 0;
  console.log('position of blue and green bodies are specified using body options approach');
  console.log('{connector:{id}, targetBody:{id,map}, targetConnector:{id}}');
  return {
    shape: {
      box: _.defaults({type: 'box'}, o.dimensions)
    },
    material: {
      red: { type: 'phong', color: 0x772222 },
      green: { type: 'phong', color: 0x227722 },
      blue: { type: 'phong', color: 0x222277 }
    },
    body: {
      bodyA: {
        position: o.position, rotation: o.rotation,
        shape: 'box', material: 'red', mass: o.mass,
        connector: {
          top: {
            base: {y: o.dimensions.dy / 2 + o.margin}
          }
        }
      },
      bodyB: {
        shape: 'box', material: 'blue', mass: o.mass,
        connector: {
          bot: {
            base: {y: -o.dimensions.dy / 2 - o.margin}
          },
          side: {
            base: {x: -o.dimensions.dx / 2 - o.margin},
            up: {x: 1}, front: {y: 1}
          }
        },
        approach: {connector: 'bot', targetBody: 'bodyA', targetConnector: 'top'}
      },
      bodyC: {
        shape: 'box', material: 'green', mass: o.mass,
        connector: {
          top: {
            base: {y: o.dimensions.dy / 2 + o.margin}
          }
        },
        approach: {connector: 'top', targetBody: 'bodyB', targetConnector: 'side'}
      }
    }
  }
}


module.exports.defaultOptions = defaultOptions;
module.exports.getObject = getObject;


