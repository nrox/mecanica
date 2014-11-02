

var utils = require('../util/test.js');
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
    var obj = factory.make('shape', type, parameters);
    /*
     util.logKeys(obj, type + ' properties');
     util.logKeys(obj.prototype, type + '.prototype properties');
     util.logKeys(obj.ammo, type + '.ammo properties');
     util.logKeys(obj.three, type + '.three properties');
     */
    utils.checkValues(obj,
      _.pick(parameters, _.keys(factory.options(obj))),
      'checking ' + type + ' values');
  };
}

var test = {
};

_.each(factory.constructor.shape, function (cons, type) {
  test[type] = shape(type);
});

test.all = utils.all(test);
module.exports.test = test;
utils.run(test, process.argv, __filename);
