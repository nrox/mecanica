var testUtils = require('test-utils.js');
var _ = require('../dist/lib/underscore.js');
var $ = require('../dist/lib/jquery.js');
var lib = require('../dist/mecanica.js');
var test = {
};

function clearObjects() {
  $('#triggers').empty();
  $('#container').empty();
}

function makeTest(system, inputOptions) {
  return function () {
    var me = new lib.Mecanica();
    me.import('../ware/settings/tests.js');
    me.import('../ware/scene/simple.js');
    me.import('../ware/light/set3.js');
    me.loadSystem(system, 'system');
    me.import('../ware/monitor/satellite.js');
    me.addToScene();
    if (inputOptions) new lib.UserInterface(inputOptions, me);
    me.start();
  };
}

function systemTemplate(options) {
  return {
    body: {
      'a': {
        group: 'body',
        type: 'basic',
        shape: { type: 'box', dx: 2, dz: 2, dy: 2, segments: 2 },
        position: {  x: 0.5, y: 0.5, z: 0.5 },
        rotation: { x: 0.5, y: 0.3, z: 0 },
        material: {type: 'phong', color: 0x338855, opacity: 0.5, transparent: true},
        mass: 0,
        connector: {
          'cA': options.cA
        }
      },
      'b': {
        group: 'body',
        type: 'basic',
        shape: { type: 'box', dx: 2, dy: 2, dz: 2, segments: 2 },
        position: { x: -2, y: -2, z: -2},
        rotation: { x: 0, y: 0, z: 0 },
        material: {type: 'phong', color: 0x991122, opacity: 0.9, transparent: true},
        mass: 1,
        connector: {
          'cB': options.cB
        }
      }
    },
    constraint: {
      constraint: {
        type: options.type,
        connectorA: 'cA',
        connectorB: 'cB',
        bodyA: 'a',
        bodyB: 'b',
        ratio: options.ratio,
        approach: options.approach
      }
    }
  };
}

var defaultOptions = {
  type: undefined,
  cA: {
    base: {y: -1.01},
    up: {y: 1},
    front: {x: 1}
  },
  cB: {
    base: {x: 1, y: 1, z: 1.01},
    up: {y: 1},
    front: {x: 1}
  },
  ration: 1,
  approach: true
};

function pointTest() {
  var options = testUtils.deepCopy(defaultOptions);
  options.type = 'point';
  var ui = {
    values: {
      add: function () {
        var c = this.parentSystem.getSystem('system').getConstraint('constraint');
        c.addToScene(this.parentSystem.getScene());
      },
      remove: function () {
        var c = this.parentSystem.getSystem('system').getConstraint('constraint');
        c.removeFromScene(this.parentSystem.getScene());
      }
    }
  };
  return makeTest(systemTemplate(options), ui);
}

function hingeTest() {
  var options = testUtils.deepCopy(defaultOptions);
  options.type = 'hinge';
  options.cA.base = {x: -1, y: -1, z: -1};
  options.cA.up = {z: 1};
  options.cB.base = {x: 1, y: 1, z: 1};
  options.cB.up = {z: 1};
  var ui = {
    values: {
      add: function () {
        var c = this.parentSystem.getSystem('system').getConstraint('constraint');
        c.addToScene(this.parentSystem.getScene());
      },
      remove: function () {
        var c = this.parentSystem.getSystem('system').getConstraint('constraint');
        c.removeFromScene(this.parentSystem.getScene());
      }
    }
  };
  return makeTest(systemTemplate(options), ui);
}

function motorTest() {
  var options = testUtils.deepCopy(defaultOptions);
  options.type = 'motor';
  options.cA.base = {x: -1, y: -1, z: -1};
  options.cA.up = {z: 1};
  options.cB.base = {x: 1, y: 1, z: 1};
  options.cB.up = {z: 1};
  var ui = {
    template: {
      velocity: {type: 'range', min: -10, max: 10, step: 1},
      binary: {type: 'range', min: 0, max: 50, step: 1}
    },
    values: {
      velocity: 1,
      binary: 1,
      enable: function () {
        var c = this.parentSystem.getSystem('system').getConstraint('constraint');
        var values = this.getValues();
        c.enable(values.velocity, values.binary);
      },
      disable: function () {
        var c = this.parentSystem.getSystem('system').getConstraint('constraint');
        c.disable();
      }
    }
  };
  return makeTest(systemTemplate(options), ui);
}

function servoTest() {
  var options = testUtils.deepCopy(defaultOptions);
  options.type = 'servo';
  options.cA.base = {x: -1, y: -1, z: -1};
  options.cA.up = {z: 1};
  options.cB.base = {x: 1, y: 1, z: 1};
  options.cB.up = {z: 1};
  var ui = {
    template: {
      'angle(°)': {type: 'range', min: -180, max: 180, step: 5,
        onChange: function () {
          var c = this.parentSystem.getSystem('system').getConstraint('constraint');
          var values = this.getValues();
          var angle = values['angle(°)'];
          angle = angle * Math.PI / 180;
          c.enable(values.velocity, values.binary);
          c.setAngle(angle);
        }
      },
      velocity: {type: 'range', min: -5, max: 5, step: 1},
      binary: {type: 'range', min: 0, max: 50, step: 1}
    },
    values: {
      velocity: 1,
      binary: 1,
      'angle(°)': 0,
      disable: function () {
        var c = this.parentSystem.getSystem('system').getConstraint('constraint');
        c.disable();
      }
    }
  };
  return makeTest(systemTemplate(options), ui);
}

function fixedTest() {
  var options = testUtils.deepCopy(defaultOptions);
  options.type = 'fixed';

  options.cA.base = {x: -1, y: -1, z: -1};
  options.cA.up = {z: 1};
  options.cA.front = {y: 1};

  options.cB.base = {x: 1, y: 1, z: 1};
  options.cB.up = {z: 1};
  options.cB.front = {y: 1};

  var ui = {
    values: {
      add: function () {
        var c = this.parentSystem.getSystem('system').getConstraint('constraint');
        c.addToScene(this.parentSystem.getScene());
      },
      remove: function () {
        var c = this.parentSystem.getSystem('system').getConstraint('constraint');
        c.removeFromScene(this.parentSystem.getScene());
      }
    }
  };
  return makeTest(systemTemplate(options), ui);
}

function sliderTest() {
  var options = testUtils.deepCopy(defaultOptions);
  options.type = 'slider';
  options.cA.base = {x: 0, y: 0, z: 0};
  options.cA.up = {z: 1};
  options.cA.front = {y: 1};

  options.cB.base = {x: 0, y: 0, z: 5};
  options.cB.up = {z: 1};
  options.cB.front = {y: 1};

  var ui = {
    values: {
      add: function () {
        var c = this.parentSystem.getSystem('system').getConstraint('constraint');
        c.addToScene(this.parentSystem.getScene());
      },
      remove: function () {
        var c = this.parentSystem.getSystem('system').getConstraint('constraint');
        c.removeFromScene(this.parentSystem.getScene());
      }
    }
  };
  return makeTest(systemTemplate(options), ui);
}

function linearTest() {
  var options = testUtils.deepCopy(defaultOptions);
  options.type = 'linear';
  options.cA.base = {x: 0, y: 0, z: -2};
  options.cA.up = {z: 1};
  options.cA.front = {y: 1};

  options.cB.base = {x: 0, y: 0, z: 2};
  options.cB.up = {z: 1};
  options.cB.front = {y: 1};

  var system = systemTemplate(options);

  system.constraint.constraint.lowerLimit = -5;
  system.constraint.constraint.upperLimit = 1;
  system.constraint.constraint.maxVelocity = 10;
  system.constraint.constraint.maxBinary = 10;

  var ui = {
    values: {
      add: function () {
        var c = this.parentSystem.getSystem('system').getConstraint('constraint');
        c.addToScene(this.parentSystem.getScene());
      },
      remove: function () {
        var c = this.parentSystem.getSystem('system').getConstraint('constraint');
        c.removeFromScene(this.parentSystem.getScene());
      },
      position: 0
    },
    template: {
      position: {type: 'range', min: -10, max: 1, step: 0.1, round: 0.1, onChange: function () {
        var c = this.parentSystem.getSystem('system').getConstraint('constraint');
        var position = this.getValues().position;
        c.setPosition(position);
      }}
    }
  };
  return makeTest(system, ui);
}

function gearTest() {
  var system = {
    body: {
      wall: {
        type: 'basic',
        shape: { type: 'box', dx: 1.9, dz: 10, dy: 6, segments: 5 },
        position: { x: -1 },
        material: {type: 'phong', color: 0x335588, opacity: 0.5, transparent: true, wireframe: true},
        mass: 0,
        connector: {
          wA: {
            base: {x: 1, y: 2, z: 2},
            up: {x: 1},
            front: {z: 1}
          },
          wB: {
            base: {x: 1, y: -2, z: -2},
            up: {x: 1},
            front: {z: 1}
          },
          wC: {
            base: {x: 1, y: 0, z: -4},
            up: {x: 1},
            front: {z: 1}
          }
        }
      },
      a: {
        type: 'basic',
        shape: { type: 'cylinder', r: 4, dy: 2, segments: 8},
        position: {x: 1, y: 3, z: 3},
        rotation: {z: -Math.PI / 2},
        material: {type: 'phong', color: 0x338855, opacity: 0.5, transparent: true},
        mass: 1,
        connector: {
          'cA': {
            base: {y: -1},
            up: {y: 1},
            front: {z: 1}
          },
          'cwa': {
            base: {y: 1, z: 3},
            up: {y: 1},
            front: {z: 1}
          }
        }
      },
      weight: {
        type: 'basic',
        shape: { type: 'cylinder', r: 0.5, dy: 2},
        rotation: {z: Math.PI / 2},
        position: {x: 3},
        material: {type: 'phong', color: 0x335522, opacity: 0.5, transparent: true},
        mass: 2,
        connector: {
          'cww': {
            base: {y: -1},
            up: {y: 1},
            front: {z: 1}
          }
        }
      },
      b: {
        type: 'basic',
        shape: { type: 'cylinder', r: 1, dy: 2, segments: 8 },
        rotation: {z: Math.PI / 2},
        material: {type: 'phong', color: 0x885555, opacity: 0.5, transparent: true},
        mass: 1,
        connector: {
          'cB': {
            base: {y: -1},
            up: {y: 1},
            front: {z: 1}
          }
        }
      },
      c: {
        type: 'basic',
        shape: { type: 'cylinder', r: 1.5, dy: 2, segments: 8 },
        rotation: {z: Math.PI / 2},
        material: {type: 'phong', color: 0x335577, opacity: 0.5, transparent: true},
        mass: 1,
        connector: {
          'cC': {
            base: {y: -1},
            up: {y: 1},
            front: {z: 1}
          }
        }
      }
    },
    constraint: {
      motor: {
        type: 'motor',
        connectorA: 'wA',
        connectorB: 'cA',
        bodyA: 'wall',
        bodyB: 'a',
        approach: true
      },
      wb: {
        type: 'hinge',
        connectorA: 'wB',
        connectorB: 'cB',
        bodyA: 'wall',
        bodyB: 'b',
        approach: true
      },
      wc: {
        type: 'hinge',
        connectorA: 'wC',
        connectorB: 'cC',
        bodyA: 'wall',
        bodyB: 'c',
        approach: true
      },
      gear: {
        type: 'gear',
        connectorA: 'cA',
        connectorB: 'cB',
        bodyA: 'a',
        bodyB: 'b',
        ratio: 0.25,
        approach: false
      },
      gear2: {
        type: 'gear',
        connectorA: 'cB',
        connectorB: 'cC',
        bodyA: 'b',
        bodyB: 'c',
        ratio: 1.5,
        approach: false
      },
      wcons: {
        type: 'fixed',
        connectorA: 'cwa',
        connectorB: 'cww',
        bodyA: 'a',
        bodyB: 'weight',
        approach: true
      }
    }
  };
  var ui = {
    values: {
      add: function () {
        var c = this.parentSystem.getSystem('system').getConstraint('gear');
        c.addToScene(this.parentSystem.getScene());
      },
      remove: function () {
        var c = this.parentSystem.getSystem('system').getConstraint('gear');
        c.removeFromScene(this.parentSystem.getScene());
      },
      motor: {
        velocity: 1,
        binary: 1,
        enable: function () {
          var c = this.parentSystem.getSystem('system').getConstraint('motor');
          var values = this.getValues().motor;
          c.enable(values.velocity, values.binary);
        },
        disable: function () {
          var c = this.parentSystem.getSystem('system').getConstraint('motor');
          c.disable();
        }
      }
    },
    template: {
      motor: {
        velocity: {type: 'range', min: -5, max: 5, step: 1, onChange: function () {
          var c = this.parentSystem.getSystem('system').getConstraint('motor');
          var values = this.getValues().motor;
          c.enable(values.velocity, values.binary);
        }},
        binary: {type: 'range', min: 0, max: 50, step: 1, onChange: function () {
          var c = this.parentSystem.getSystem('system').getConstraint('motor');
          var values = this.getValues().motor;
          c.enable(values.velocity, values.binary);
        }}
      }
    }
  };
  return makeTest(system, ui);
}

test['point'] = pointTest();
test['hinge'] = hingeTest();
test['motor'] = motorTest();
test['servo'] = servoTest();
test['fixed'] = fixedTest();
test['slider'] = sliderTest();
test['gear'] = gearTest();
test['linear'] = linearTest();

test.all = testUtils.all(test);

module.exports.test = test;
module.exports.clearObjects = clearObjects;
