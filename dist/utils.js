module.exports = {
  stringify: function (obj) {
    return JSON.stringify(obj,
      function (k, v) {
        if (v === undefined) return null;
        if (typeof v == 'function') return '' + v;
        return v;
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
  randomXYZ: function (min, max) {
    return {
      x: this.randomLinear(min, max),
      y: this.randomLinear(min, max),
      z: this.randomLinear(min, max)
    };
  },
  pathObject: function (obj, path) {
    for (var i = 0; i < path.length; i++) {
      if (!obj) break;
      obj = obj[path[i]];
    }
    return obj;
  },
  argList: function (args) {
    //args is like arguments, transform it into an array
    var a = [];
    for (var i = 0; i < args.length; i++) {
      a.push(args[i]);
    }
    return a;
  },
  isNode: function () {
    return typeof(self) === 'undefined';
  },
  isBrowserWindow: function () {
    return (typeof(window) === 'object') && (typeof(window.document) === 'object');
  },
  isBrowserWorker: function () {
    return (typeof(self) === 'object') && !self.window;
  },
  time: function (from) {
    return new Date().getTime() - (from || 0);
  },
  seconds: function (from) {
    return this.time((from || 0) * 1000) / 1000.0;
  },
  clearTimeoutsAndIntervals: function () {
    if (!this.isBrowserWindow()) return;
    var id = window.setTimeout(function () {
    }, 0);

    while (id--) {
      window.clearTimeout(id); // will do nothing if no timeout with id is present
    }
    id = window.setInterval(function () {
    }, 0);

    while (id--) {
      window.clearInterval(id); // will do nothing if no timeout with id is present
    }
  }
};
