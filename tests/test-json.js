var testUtils = require('../util/test.js');
var utils = require('../util/utils.js');
var $ = require('../lib/jquery.js');
var _ = require('../lib/underscore.js');
var editorConstructor = require('../util/json-ui.js');

function clearObjects() {
  $('#container').empty();
  $('#triggers').empty();
  $('#status').empty();
}

function makeGetValues(editor) {
  var b = $('<button>get values</button>');
  $('#triggers').append(b);
  b.on('click', function () {
    $('#status').text(utils.stringify(editor.getValues()));
  });
}

var test = {
  'all types': function () {
    var template = {
      root: {
        number: 'number',
        range1: {type: 'range', min: '-50', max: '100', step: '2'},
        range2: {type: 'range', min: '-0.1', max: '2.3', step: '0.01'},
        string: {type: 'string', tag: 'div', val: 'text'},
        var1: {type: 'range', min: 0, max: 1, step: 0.1},
        randomColor: {type: 'function', caption: 'set random color'},
        darkGrayColor: {type: 'function', caption: 'set dark gray'},
        boolean1: {type: 'boolean', t: true, f: false},
        boolean2: {type: 'boolean', t: 'on', f: 'off'},
        boolean3: {type: 'boolean', t: '▣', f: '▢'},
        color: {type: 'color'},
        folder: {
          folded: true
        },
        'folder 2': {
          'more defs': {folded: true}
        },
        sizes: {type: 'range', values: [8, 16, 32, 64, 128, 256, 512, 1024]},
        name: {type: 'range', values: ['Maria', 'Jürgen', '鑫', 'Carla', '石', 'Tomás'], minus: '<', plus: '>'},
        list: {type: 'list', values: [0, 1, 2, 3, 4, 5, 'a', 'b', 'bananas', true, false]}
      }
    };
    var obj = {
      root: {
        number: 3,
        range1: 4,
        range2: 0.3,
        string: 'hello',
        'var1 = random()': function () {
          this.getReference().root.var1.setValue(Math.random());
        },
        var1: 0.3,
        randomColor: function () {
          function r() {
            return utils.randomItem([0, 1, 2, 3, 4, 5/*, 6, 7, 8, 9, 'a', 'b', 'c', 'd', 'e', 'f'*/]);
          }

          $('#container').css('background-color', '#' + r() + r() + r());
        },
        darkGrayColor: function () {
          $('#container').css('background-color', '#151515');
        },
        color: '#345',
        'set background from color variable': function () {
          $('#container').css('background-color', this.getReference().root.color.getValue());
        },
        boolean1: true,
        boolean2: 'off',
        boolean3: '▢',
        folder: {
          boolean1: false,
          string2: 'world'
        },
        'folder 2': {
          boolean1: false,
          string2: 'hello',
          'more defs': {
            boolean1: false,
            string2: 'scissor',
            nested: {
              boolean1: false,
              string2: 'maria'
            }
          }
        },
        parameters: {
          par1: false,
          par2: 'foo bar'
        },
        sizes: 32,
        name: 'John',
        list: 'a'
      }
    };
    var editor = new editorConstructor();
    editor.useTemplate(template);
    editor.setValues(obj);
    editor.showEditor('#container');
    makeGetValues(editor);
  },
  'factory settings': function () {
    var template = {
      axisHelper: {type: 'range', min: '0', max: '5', step: '0.5'},
      connectorHelper: {type: 'range', min: '0', max: '5', step: '0.5'},
      canvasContainer: 'body', //container for renderer,
      simSpeed: {type: 'range', min: '0.1', max: '5', step: '0.1'},
      renderFrequency: {type: 'range', min: '1', max: '60', step: '1'},
      simFrequency: {type: 'range', min: '1', max: '60', step: '1'},
      shadowMapSize: {type: 'range', values: [8, 16, 32, 64, 128, 256, 512, 1024]}
    };
    var defaultSettings = {
      wireframe: false, //show wireframes
      axisHelper: 0, //show an axis helper in the scene and all bodies
      connectorHelper: 0,
      canvasContainer: 'body', //container for renderer,
      reuseCanvas: true,
      webWorker: true, //use webworker if available
      autoStart: true, //auto start simulation and rendering
      simSpeed: 1, //simulation speed factor, 1 is normal, 0.5 is half, 2 is double...
      renderFrequency: 30, //frequency to render canvas
      simFrequency: 30, //frequency to run a simulation cycle,
      castShadow: true, //light cast shadows,
      shadowMapSize: 1024 //shadow map width and height
    };
    var editor = new editorConstructor();
    editor.useTemplate(template);
    editor.setValues(defaultSettings);
    editor.showEditor('#container');
    makeGetValues(editor);
  },
  'ware object': function () {
    var obj = require('../ware/random-shapes.js').getObject();
    var template = {};
    _.each(obj, function (o, k) {
      template[k] = {folded: true};
    });
    var editor = new editorConstructor();
    editor.useTemplate(template);
    editor.setValues(obj);
    editor.showEditor('#container');
    makeGetValues(editor);
  }
};

module.exports.test = test;
module.exports.clearObjects = clearObjects;
testUtils.run(test, process.argv, __filename);
