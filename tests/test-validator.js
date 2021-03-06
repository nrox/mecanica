var testUtils = require('./test-utils.js');
var utils = require('../dist/utils.js');
var _ = require('../dist/lib/underscore.js');
var lib = require('../dist/mecanica.js');
var Validator = lib.Validator;

function clearObjects() {
  $("canvas").remove();
  $('#container').empty();
  $('#triggers').empty();
  $('#status').empty();
}

var test = {
  'constructorFor': function () {
    var valid = new Validator();
    var cons = valid.constructorFor('shape', 'box');
    testUtils.assert(typeof cons === 'function', 'constructor is a function');
  },
  'parseOptions': function () {
    var valid = new Validator();
    var cons = valid.constructorFor('shape', 'box');
    var options = valid.parseOptions(cons);
    testUtils.checkKeys(options, ['dx', 'dy', 'gap'], 'options for box shape');
  },
  'parseRequired': function () {
    var valid = new Validator();
    var cons = valid.constructorFor('body', 'basic');
    var required = valid.parseRequired(cons);
    testUtils.checkList(required, ['mass', 'shape', 'material'], 'required options for body basic');
  },
  listGroups: function () {
    var valid = new Validator();
    var groups = valid.listGroups();
    var expected = ["settings", "system", "method", "shape", "material", "light", "body", "connector", "constraint", "scene", "camera", "monitor", "renderer", "ui"];
    testUtils.checkList(groups, expected, 'list has expected groups');
    testUtils.checkList(expected, groups, 'list has only expected groups');

  },
  listTypes: function () {
    var valid = new Validator();
    var groups = valid.listGroups();
    var collection = {};
    _.each(groups, function (g) {
      collection[g] = valid.listTypes(g);
    });
    var expected = {
      "settings": ["global", "local"], "system": ["basic", "imported", "loaded"], "method": ["extended"], "shape": ["sphere", "box", "cylinder", "cone", "compound"],
      "material": ["_intro", "basic", "phong"], "light": ["directional", "ambient"], "body": ["copy", "basic"], "connector": ["basic"],
      "constraint": ["_abstract", "point", "motor", "servo", "hinge", "gear", "linear", "slider", "fixed"], "scene": ["basic"],
      "camera": ["perspective", "tracker", "satellite", "orbital"], "monitor": ["complete"], "renderer": ["available", "_intro", "_outro", "webgl", "canvas"], "ui": ["basic"]};
    _.each(collection, function (types, group) {
      testUtils.checkList(types, expected[group], group + ' types list has expected types');
      testUtils.checkList(expected[group], types, group + ' types list has the same content as expected values');
    });
  },
  optionsFor: function () {
    var valid = new Validator();
    var boxOptions = valid.optionsFor('shape', 'box');
    testUtils.checkKeys(boxOptions, ['dx', 'dy', 'dz'], 'box options are as expected');
    var servoOptions = valid.optionsFor('constraint', 'servo');
    testUtils.checkKeys(servoOptions, ['connectorA', 'bodyB', 'maxBinary', 'angle'], 'connector has options as expected');
  },
  requiredFor: function () {
    var valid = new Validator();
    var boxRequired = valid.requiredFor('body', 'basic');
    testUtils.checkList(boxRequired, ['mass', 'shape', 'material'], 'box required options are as expected');
    var servoRequired = valid.requiredFor('constraint', 'servo');
    testUtils.checkList(servoRequired, ['connectorA', 'bodyB', 'maxBinary', 'maxVelocity'], 'constraint servo has expected required options');
    var connectorRequired = valid.requiredFor('connector', 'basic');
    testUtils.checkList(connectorRequired, ['up', 'front', 'base'], 'connector basic required options has expected entries');
  },
  reportErrors: function () {
    var valid = new Validator();
    var json = {
      garbage: {},
      shape: {
        shape1: {},
        shape2: {}
      },
      material: {
        red: {color: 0x663333}
      },
      body: {
        body1: {type: 'wrong'},
        body2: {mass: 0}
      },
      system: {
        system1: {
          shape3: {},
          shape: {
            shape4: {}
          }
        }
      }
    };
    var expected = {
      garbage: [valid.STATUS.UNKNOWN_GROUP],
      shape: {
        shape1: valid.STATUS.OK,
        shape2: valid.STATUS.OK
      },
      material: {
        red: valid.STATUS.OK
      },
      body: {
        body1: [valid.STATUS.WRONG_TYPE, 'wrong'],
        body2: [valid.STATUS.UNDEFINED_VALUES, 'shape', 'material']
      },
      system: {
        system1: {
          shape3: [valid.STATUS.UNKNOWN_GROUP],
          shape: {
            shape4: valid.STATUS.OK
          }
        }
      }
    };
    var report = valid.reportErrors(json);

    testUtils.assert(report.system.system1.shape3[0] == expected.system.system1.shape3[0], 'expected system result for unknown group');
    testUtils.assert(report.system.system1.shape.shape4 == expected.system.system1.shape.shape4, 'expected system result for shape');

    testUtils.assert(report.garbage[0] === expected.garbage[0], 'expected "garbage" as unknown group');
    testUtils.checkValues(report.shape, expected.shape, 'expected shape result');
    testUtils.assert(report.material.red == expected.material.red, 'material is OK');

    testUtils.checkList(report.body.body1, expected.body.body1, 'expected body1 result');
    testUtils.checkList(report.body.body2, expected.body.body2, 'expected body2 result for undefined types');
    var resume = valid.resumeErrors(report);
    console.warn('TODO resumeErrors');
    console.log(utils.stringify(resume));
  }
};

test.all = testUtils.all(test);
module.exports.test = test;
module.exports.clearObjects = clearObjects;
