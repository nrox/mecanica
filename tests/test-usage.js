var testUtils = require('test-utils.js');
var ammo = require('../lib/ammo.js');
var three = require('../lib/three.js');
var _ = require('../lib/underscore.js');

function clearObjects() {
  $("canvas").remove();
  $('#container').empty();
  $('#triggers').empty();
  $('#status').empty();
}

var test = {
  'mec = new Mecanica()': function () {
    var me = new (require('../mecanica.js').Mecanica)();
    testUtils.checkKeys(me, [
      'import', 'destroy', 'make'
    ], 'methods');
  },
  'mec.import(url)': function () {
    var me = new (require('../mecanica.js').Mecanica)();
    me.importSystem('../ware/experiment/basic2.js', 'basic2');
    testUtils.checkKeys(me.getObject().system, [
      'basic2'
    ], 'system imported ?');
    testUtils.checkKeys(me.getObject('system', 'basic2', 'system', 'subsystem', 'body'), [
      'body2'
    ], 'subsystem imported');
  },
  'mec.toJSON()': function () {
    var me = new (require('../mecanica.js').Mecanica)({type: 'complete'});
    me.importSystem('../ware/experiment/basic2.js', 'basic2');
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
    var lib = require('../mecanica.js');
    var me = new lib.Mecanica({
      type: 'complete',
      settings: {canvasContainer: '#container', type: 'global'}
    });
    me.importSystem('../ware/experiment/basic2.js', 'basic2', {coneRadius: 1, coneY: 2.5});
    me.useLight({def: {}});
    me.addToScene();
    me.start();
    var buttons = {
      speed: 1,
      start: function () {
        me.start();
      },
      stop: function () {
        me.stop();
      },
      remove: function () {
        me.getSystem('basic2').getConstraint('cons').removeFromScene(me.getScene());
      },
      add: function () {
        me.getSystem('basic2').getConstraint('cons').addToScene(me.getScene());
      }
    };
    var template = {
      speed: {type: 'range', min: 0, max: 20, step: 0.1, onChange: setSpeed}
    };

    function setSpeed() {
      me.setSpeed(editor.getValues().speed);
    }

    var editor = new lib.UserInterface({
      values: buttons,
      template: template,
      container: '#triggers'
    }, me);

  },
  'mec.load(json)': function () {
    console.log("settings, scene, monitor and lights are all imported into a new Mecanica()");
    console.log("using importSystem, 2 files are imported");
    var me = new (require('../mecanica.js').Mecanica)();
    me.import('../ware/settings/simple.js', {canvasContainer: '#container'});
    me.import('../ware/scene/simple.js');
    me.import('../ware/light/simple.js');
    me.importSystem('../ware/experiment/basic2.js', 'basic2');
    me.importSystem('../ware/world/surface.js', 'surf', {
      position: {y: -5},
      color: 0xaa1111,
      dx: 1,
      dz: 10,
      dy: 1
    });
    me.import('../ware/monitor/tracker.js', {distance: 20, lookAt: me.getSystem('basic2').getBody('id6')});
    me.addToScene();
    me.start();
  },
  'import/destroy()': function () {
    console.log("settings, scene, monitor and lights are all imported into a new Mecanica()");
    console.log("using importSystem, 2 files are imported");
    var lib = require('../mecanica.js');
    var me = new lib.Mecanica();
    me.import('../ware/settings/tests.js');
    me.import('../ware/scene/simple.js');
    me.import('../ware/light/set3.js');
    me.importSystem('../ware/experiment/basic2.js', 'basic2');
    me.import('../ware/monitor/satellite.js', {lookAt: me.getSystem('basic2').getBody('id5'), distance: 30});

    var url = '../ware/world/surface.js';
    var options = {
      'options': {
        position: {y: -6},
        color: 0xaa1111,
        dx: 1,
        dz: 10,
        dy: 1
      },
      'remove box': function () {
        var sys = me.getObject('system', 'box');
        sys.destroy();
      },
      'add box': function () {
        var values = editor.getValues();
        me.importSystem(url, 'box', values.options);
        me.addToScene();
      }
    };
    me.addToScene();
    me.start();
    var editor = new lib.UserInterface({
      values: options,
      container: '#triggers'
    }, me);
  }
};

test.all = testUtils.all(test);
module.exports.test = test;
module.exports.clearObjects = clearObjects;
