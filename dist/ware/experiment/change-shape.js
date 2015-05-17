var _ = require('../../lib/underscore.js');
var Ammo = require('../../lib/ammo.js');

var defaultOptions = {
  r: 1,
  dy: 3,
  mass: 0.1,
  color: 0x449977
};

function getObject(o) {
  o = _.defaults(o || {}, defaultOptions);
  console.warn('correct errors referring to ', 'http://www.bulletphysics.org/Bullet/phpBB3/viewtopic.php?p=&f=9&t=3262');
  return {
    lengthUnits: 'dm',
    position: {y: -o.r},
    settings: {
      local: {
        freeze: false
      }
    },
    shape: {
      base: {
        type: 'box', dx: o.r * 3, dz: o.r * 3, dy: o.r * 0.1
      },
      cylinder: {
        type: 'cylinder', r: o.r, dy: o.dy
      },
      sphere: {
        type: 'sphere', r: o.r
      }
    },
    material: {
      material: {color: 0x888899 },
      cylinder: {color: o.color }
    },
    body: {
      base: {
        shape: 'base', material: 'material', mass: 0,
        connector: {
          support: {}
        }
      },
      cylinder: {
        shape: 'cylinder', material: 'cylinder', mass: o.mass,
        approach: {connector: 'support', targetBody: 'base', targetConnector: 'support'},
        connector: {
          support: {base: {y: -o.dy}},
          top: {base: {y: o.dy / 2}}
        }
      },
      sphere: {
        shape: 'sphere', material: 'material', mass: o.mass,
        approach: {connector: 'bottom', targetBody: 'cylinder', targetConnector: 'top'},
        connector: {
          bottom: {base: {y: -o.r}}
        }
      }
    },
    constraint: {
      support: {type: 'hinge', bodyA: 'base', bodyB: 'cylinder', connectorA: 'support', connectorB: 'support'}
    }
  };
}

function userInterface(options) {
  options = _.defaults(options || {}, {
    system: undefined,
    container: 'body'
  });
  return {
    values: {
      scale: 1
    },
    template: {
      scale: {type: 'range', min: 0.1, max: 2, step: 0.01, change: function () {
        var cylinder = this.rootSystem.getSystem(options.system).getBody('cylinder');
        var shape = cylinder.ammo.getCollisionShape();
        var scale = this.getValues().scale;
        shape.setLocalScaling(new Ammo.btVector3(1, scale, 1));
        cylinder.three.scale.setY(scale);
        cylinder.ammo.activate(true);
        this.rootSystem.getSystem(options.system).getBody('sphere').ammo.activate(true);
      }}
    },
    container: options.container
  };
}

module.exports.defaultOptions = defaultOptions;
module.exports.getObject = getObject;
module.exports.userInterface = userInterface;


