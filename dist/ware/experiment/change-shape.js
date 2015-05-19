var _ = require('../../lib/underscore.js');
var Ammo = require('../../lib/ammo.js');

var defaultOptions = {
  r: 0.5,
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
        type: 'box', dx: o.r * 3, dz: o.r * 3, dy: o.r * 0.2
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
          top: {base: {y: o.r * 0.1}}
        }
      },
      cylinder: {
        shape: 'cylinder', material: 'cylinder', mass: o.mass,
        approach: {connector: 'bottom', targetBody: 'base', targetConnector: 'top'},
        connector: {
          bottom: {base: {y: -o.dy / 2}},
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
      //support: {type: 'hinge', bodyA: 'base', bodyB: 'cylinder', connectorA: 'support', connectorB: 'support'},
      ///point: {type: 'point', bodyA: 'cylinder', bodyB: 'sphere', connectorA: 'top', connectorB: 'bottom'}

    }
  };
}

function userInterface(options) {
  options = _.defaults(options || {}, {
    system: undefined,
    container: 'body'
  });
  var aabbMin = new Ammo.btVector3;
  var aabbMax = new Ammo.btVector3;
  var t = new Ammo.btTransform;
  return {
    values: {
      scale: 1
    },
    template: {
      scale: {type: 'range', min: 0.1, max: 2, step: 0.01, change: function () {
        var cylinder = this.rootSystem.getSystem(options.system).getBody('cylinder');
        var scene = cylinder.getScene();
        var shape = cylinder.ammo.getCollisionShape();
        var scale = this.getValues().scale;
        var scaling = shape.getLocalScaling();
        scaling.setY(scale);
        shape.setLocalScaling(scaling);
        cylinder.three.scale.setY(scale);
        scene = scene || this.getScene();
        scene.ammo.updateSingleAabb(cylinder.ammo);
        //scene.ammo.setForceUpdateAllAabbs(false);
        scene.btDbvtBroadphase.printStats();
        scene.ammo.updateAabbs();
        shape.getAabb(t, aabbMin, aabbMax);
        console.log(scene.ammo.getForceUpdateAllAabbs(), aabbMin.y(), aabbMax.y());
        cylinder.ammo.activate(true);
        var sphere = this.rootSystem.getSystem(options.system).getBody('sphere');
        sphere.ammo.activate(true);
      }}
    },
    container: options.container
  };
}

module.exports.defaultOptions = defaultOptions;
module.exports.getObject = getObject;
module.exports.userInterface = userInterface;


