var utils = require('tests/test-utils.js');
var director = require('../director.js');
var test = {
};

_.each(['basic.js'], function (script) {
  test[script] = function () {
    director.loadScene(script, {
      canvasContainer: '#container',
      axisHelper: 5,
      autoStart: true
    });
  };
});

test.all = utils.all(test);
module.exports.test = test;
utils.run(test, process.argv, __filename);
