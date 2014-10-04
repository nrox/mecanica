/**
 * Test ammo.js library
 * @type {exports}
 */

var utils = require('./test-utils.js');
var ammo = require('../lib/ammo.js');
var _ = require('../lib/underscore.js');

var test = {
  btVector3: function () {
    var
      x = 1.2,
      y = 2.3,
      z = 3.4;
    var keys = ['getX', 'getY', 'getZ', 'x', 'y', 'z'];
    var obj = new ammo.btVector3(x, y, z);
    utils.logKeys(obj, 'btVector3 properties');
    utils.checkKeys(obj, keys, 'checking btVector3 keys');
    utils.checkValues(obj, {
      x: x,
      y: y,
      z: z
    }, 'checking btVector3 values');
  }
};

test.all = utils.all(test);
utils.run(test, process.argv, __filename);

