var utils = require('../util/test.js');
var _ = require('../lib/underscore.js');
var $ = require('../lib/jquery.js');
var lib = require('../mecanica.js');
var test = {
};

function clearObjects() {
  $('#triggers').empty();
  $('#container').empty();
}

function makeTest(system, inputOptions) {
  return function () {
    var me = new lib.Mecanica({type: 'empty'});
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

var inputs = {
  gear: function (actuator) {
    actuator = 'motor';
    var type = 'gear';
    var template = {
      servo: {
        'angle(°)': {type: 'range', min: -180, max: 180, step: 5}
      },
      motor: {
        velocity: {type: 'range', min: -5, max: 5, step: 1},
        binary: {type: 'range', min: 0, max: 50, step: 1}
      }
    };
    var ui = {
      add: function () {
        var c = factory.getObject('constraint', type);
        c.add();
      },
      remove: function () {
        var c = factory.getObject('constraint', type);
        c.remove();
      },
      motor: {
        velocity: 1,
        binary: 1,
        enable: function () {
          var c = factory.getObject('constraint', actuator);
          var values = this.getValues().motor;
          c.enable(values.velocity, values.binary);
        },
        disable: function () {
          var c = factory.getObject('constraint', actuator);
          c.disable();
        }
      }
    };
    var editor = new Editor();
    editor.useTemplate(template);
    editor.setValues(ui);
    editor.showEditor('#triggers');
  }
};

var defaultOptions = {
  type: 'point',
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
  var options = utils.deepCopy(defaultOptions);
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
  var options = utils.deepCopy(defaultOptions);
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
  var options = utils.deepCopy(defaultOptions);
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
  var options = utils.deepCopy(defaultOptions);
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

function addAllTests() {

  var type;
  var ca, cb;
  var bodyBCopy;

  type = 'fixed';
  ca = utils.deepCopy(connectorA);
  cb = utils.deepCopy(connectorB);
  ca.base = {x: -1, y: -1, z: -1};
  ca.up = {z: 1};
  ca.front = {y: 1};
  cb.base = {x: 1, y: 1, z: 1};
  cb.up = {z: 1};
  cb.front = {y: 1};
  bodyBCopy = utils.deepCopy(bodyB);
  bodyBCopy.mass = 1;
  test[type] = makeTest(bodyA, bodyBCopy, ca, cb, type, _.extend({}, constraintOptions, {approach: false}));

  type = 'slider';
  ca = utils.deepCopy(connectorA);
  cb = utils.deepCopy(connectorB);
  ca.base = {x: 0, y: 0, z: 0};
  ca.up = {z: 1};
  ca.front = {y: 1};
  cb.base = {x: 0, y: 0, z: 5};
  cb.up = {z: 1};
  cb.front = {y: 1};
  bodyBCopy = utils.deepCopy(bodyB);
  bodyBCopy.position = {z: -5, x: 4, y: 5};
  test[type] = makeTest(bodyA, bodyBCopy, ca, cb, type, constraintOptions);

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

function gearTest() {
  //type = 'gear';
  return {
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
        a: 'wA',
        b: 'cA',
        bodyA: 'wall',
        bodyB: 'a',
        approach: true
      },
      wb: {
        type: 'hinge',
        a: 'wB',
        b: 'cB',
        bodyA: 'wall',
        bodyB: 'b',
        approach: true
      },
      wc: {
        type: 'hinge',
        a: 'wC',
        b: 'cC',
        bodyA: 'wall',
        bodyB: 'c',
        approach: true
      },
      gear: {
        type: 'gear',
        a: 'cA',
        b: 'cB',
        bodyA: 'a',
        bodyB: 'b',
        ratio: 0.25,
        approach: false
      },
      gear2: {
        type: 'gear',
        a: 'cB',
        b: 'cC',
        bodyA: 'b',
        bodyB: 'c',
        ratio: 1.5,
        approach: false
      },
      wcons: {
        type: 'fixed',
        a: 'cwa',
        b: 'cww',
        bodyA: 'a',
        bodyB: 'weight',
        approach: true
      }
    }
  };
}

test['point'] = pointTest();
test['hinge'] = hingeTest();
test['motor'] = motorTest();
test['servo'] = servoTest();


module.exports.test = test;
module.exports.clearObjects = clearObjects;
