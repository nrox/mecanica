var testUtils = require('../util/test.js');
var ammo = require('../lib/ammo.js');
var three = require('../lib/three.js');
var _ = require('../lib/underscore.js');

function clearObjects() {

}

var test = {
  'mec = new Mecanica()': function () {
    var me = new (require('../mecanica.js').Mecanica)();
    //console.log(me);
    testUtils.checkKeys(me, [
      'import', 'destroy', 'make'
    ], 'methods');
  },
  'mec.import(url)': function () {
    var me = new (require('../mecanica.js').Mecanica)();
    me.import('../ware/basic2.js');
  }
};

test.all = testUtils.all(test);
module.exports.test = test;
module.exports.clearObjects = clearObjects;
