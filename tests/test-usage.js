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
    me.import('../ware/basic2.js', 'basic2');
    testUtils.checkKeys(me.getObject().system, [
      'basic2'
    ], 'system imported');
  },
  'mec.toJSON()': function () {
    var me = new (require('../mecanica.js').Mecanica)();
    me.import('../ware/basic2.js','basic2');
    var json = me.toJSON();
    console.log('import basic2.js, and then .toJSON');
    testUtils.checkKeys(json, [
      'light','system','scene','monitor','settings'
    ], 'json top properties');
    testUtils.checkKeys(json.system, [
      'basic2'
    ], 'system key present');
    testUtils.checkKeys(json.system['basic2'].body, [
      'id6','id5'
    ], 'system basic2 bodies');
  },
  'mec.start()': function () {
    var me = new (require('../mecanica.js').Mecanica)();
    me.import('../ware/basic2.js', 'basic2');
    me.start();
  }
};

test.all = testUtils.all(test);
module.exports.test = test;
module.exports.clearObjects = clearObjects;
