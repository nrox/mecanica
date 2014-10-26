(function () {

  if (typeof(module) !== 'object') {
    module = {};
  }

  module.exports = {
    stringify: function (obj) {
      return JSON.stringify(obj,
        function (k, v) {
          return v === undefined ? null : v;
        }, '  ');
    },
    deepCopy: function (json) {
      return JSON.parse(JSON.stringify(json));
    },
    randomLinear: function (min, max) {
      min = min || 0;
      max = max || 0;
      return min + (max - min) * Math.random();
    },
    randomColor: function () {
      var color = 0;
      for (var i = 0; i < 3; i++) {
        color = ( color << 8) | ~~(0xff * Math.random());
      }
      return color;
    },
    randomItem: function (list) {
      return list[~~(Math.random() * list.length)];
    },
    isNode: function () {
      return typeof(self) === 'undefined';
    },
    isBrowserWindow: function () {
      return typeof(window) === 'object';
    },
    isBrowserWorker: function () {
      return (typeof(self) === 'object') && !self.window;
    }
  };
  return module.exports;
})();