var testUtils = require('../util/test.js');
var ammo = require('../lib/ammo.js');
var three = require('../lib/three.js');
var _ = require('../lib/underscore.js');
var editorConstructor = require('../util/json-ui.js');

function clearObjects() {
  $("canvas").remove();
  $('#container').empty();
  $('#triggers').empty();
  $('#status').empty();
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
    testUtils.checkKeys(me.getObject('system', 'basic2', 'system', 'subsystem', 'body'), [
      'body2'
    ], 'subsystem imported');
  },
  'mec.toJSON()': function () {
    var me = new (require('../mecanica.js').Mecanica)();
    me.import('../ware/basic2.js', 'basic2');
    //me.useMonitor();
    me.useLight({def: {}});
    var json = me.toJSON();
    console.log('import basic2.js, and then .toJSON');
    testUtils.checkKeys(json, [
      'light', 'system', 'scene', 'settings'
    ], 'json top properties');
    testUtils.checkKeys(json.system, [
      'basic2'
    ], 'system key present');
    testUtils.checkKeys(json.system['basic2'].body, [
      'id6', 'id5'
    ], 'system basic2 bodies');
    testUtils.checkKeys(json.system.basic2.system.subsystem.body.body2, [
      'position'
    ], 'subsystem included');
  },
  'mec.start/stop()': function () {
    var me = new (require('../mecanica.js').Mecanica)({
      settings: {use: {canvasContainer: '#container', type: 'global'}}
    });
    me.import('../ware/basic2.js', 'basic2');
    me.useLight({def: {}});
    me.addToScene();
    me.start();
    var buttons = {
      start: function () {
        me.start();
      },
      stop: function () {
        me.stop();
      },
      speed: 1
    };
    var template = {
      speed: {type: 'range', min: 0, max: 20, step: 0.2, onChange: setSpeed}
    };

    function setSpeed() {
      me.setSpeed(editor.getValues().speed);
    }

    var editor = new editorConstructor();
    editor.setValues(buttons);
    editor.useTemplate(template);
    editor.showEditor('#triggers');
  }
};

test.all = testUtils.all(test);
module.exports.test = test;
module.exports.clearObjects = clearObjects;
