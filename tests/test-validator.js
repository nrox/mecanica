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
    var cons = valid.constructorFor('constraint', 'servo');
    var required = valid.parseRequired(cons);
    console.log('required', required);
    testUtils.checkList(required, ['connectorA', 'connectorB', 'bodyA', 'bodyB'], 'required options for constraint servo');
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
      "material": ["_intro", "basic", "phong"], "light": ["directional", "ambient"], "body": ["copy", "basic"], "connector": ["relative"],
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
    console.log(servoOptions);
    testUtils.checkKeys(servoOptions, ['connectorA', 'bodyB', 'maxBinary', 'angle'], 'connector has options as expected');
  }
};

test.all = testUtils.all(test);
module.exports.test = test;
module.exports.clearObjects = clearObjects;
