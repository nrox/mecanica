var utils = require('./test-utils.js');
var Ammo = require('../dist/lib/ammo.js');
var _ = require('../dist/lib/underscore.js');
var genetic = require('../intel/ga.js');

var test = {
  'constructors': function () {
    utils.checkKeys(genetic, [
      'Feature', 'Genetic'
    ], 'has required constructors');
  }
};

test.all = utils.all(test);
module.exports.test = test;
utils.run(test, process.argv, __filename);

