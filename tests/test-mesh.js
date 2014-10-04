/**
 * Test ammo.js library
 * @type {exports}
 */

var utils = require('./test-utils.js');
var ammo = require('../lib/ammo.js');
var three = require('../lib/three.js');
var factory = require('../factory.js');
var _ = require('../lib/underscore.js');

factory.addLibrary(ammo);
factory.addLibrary(three);

function shape(type) {
  return function () {
    var parameters = {
      dx: 3,
      dy: 5,
      r: 4
    };
    var obj = new factory.Shape(type, parameters);
    utils.logKeys(obj, type + ' properties');
    utils.logKeys(obj.prototype, type + '.prototype properties');
    utils.logKeys(obj.ammo, type + '.ammo properties');
    utils.logKeys(obj.three, type + '.three properties');
    utils.checkValues(obj,
      _.pick(parameters, _.keys(factory.description.shape[type].parameters)),
      'checking ' + type + ' values');
  };
}

var test = {
};

_.each(factory.description.shape, function (desc, type) {
  if ((typeof desc == 'object') && desc.constructors)
    test[type] = shape(type);
});

test.all = utils.all(test);
utils.run(test, process.argv, __filename);

