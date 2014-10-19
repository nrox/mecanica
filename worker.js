/**
 * worker.js
 * Runs in browser (window), or worker environment (self), or server (node.js)
 * Aims to run Ammo simulations in the worker environment or server side
 * and at the same time provide communication between the running Ammo simulation
 * and the browser window.
 * The 3 possible environments are recognized and necessary functions are adapted
 * for those different uses.
 * The choice to have a unique file for all environments is to avoid code duplication
 * and to be compact.
 */

(function () {
  var RETURN = 'return';
  var COMMENTS = 'comments';
  var ALLOW_EVAL = true;
  var worker;
  var factory = {};

  var environment = {
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

  var workerActions = {
    require: function (script) {
      return !!require(script);
    },
    eval: function (s) {
      if (!ALLOW_EVAL) return 'eval not allowed';
      return eval(s);
    }
  };

  var onMessageReceive = function (e) {
    var data = e.data;
    if (typeof data == 'string') {
      postMessage(e.data);
    } else if (typeof data == 'object') {
      var postReturn = data[RETURN];
      for (var key in data) {
        if (workerActions.hasOwnProperty(key) && key != RETURN && key != COMMENTS) {
          var returnValue = workerActions[key].apply(this, data[key]);
          if (postReturn) {
            var comments = data.comments || (key + ': done');
            postMessage({
              action: RETURN,
              returnValue: returnValue,
              comments: comments
            });
          }
        }
      }
    }
  };

  var loadFactory = function () {
    return undefined;
  };
  var createWorker = function () {
    return undefined;
  };

  if (environment.isBrowserWindow()) {
    createWorker = function () {
      var script = 'worker.js';
      if (require(script) || require(script = '../' + script)) {
        worker = new Worker(script);
        worker.onmessage = onMessageReceive;
      } else {
        worker = undefined;
      }
      return worker;
    };
  } else if (environment.isBrowserWorker()) {

    onmessage = onMessageReceive;
    /**
     * Use importScripts to emulate require
     * all paths are converted to absolute and scripts location are predefined
     * @param script
     */
    function require(script, arg) {

      arg || (arg = undefined);
      function scriptName(script) {
        return script.substr(script.lastIndexOf('/') + 1);
      }

      function scriptFolder(script) {
        var name = scriptName(script);
        var folder = (['ammo.js', 'three.js', 'underscore.js', 'jquery.js'].indexOf(name) > -1) ? '/lib/' : undefined;
        if (script.indexOf('/ware/' + name) > -1) folder = '/ware/';
        folder = folder || ((name.indexOf('test') == 0) ? '/tests/' : '/');
        return folder;
      }

      function requireRoot() {
        var hrefFolder = scriptFolder(location.href);
        var hrefName = scriptName(location.href);
        var index = location.href.indexOf(hrefFolder + hrefName);
        return location.href.substring(0, index);
      }

      function scriptURL(script) {
        return requireRoot() + scriptFolder(script) + scriptName(script);
      }

      function isAmmoScript(script) {
        return scriptName(script) == 'ammo.js';
      }

      if (script.lastIndexOf('.js') < 0) return;
      var url = scriptURL(script);

      //node.js stubs
      var process = {
        //an argument is necessary for some test-....js scripts
        argv: ['node', script, arg]
      };
      var __filename = script;
      var module = {
        exports: {}
      };
      var exports = module.exports;
      //in case of ammo remove stubs, or it will require fs and path
      if (isAmmoScript(script)) {
        module = process = exports = undefined;
      }

      importScripts(url);

      if (isAmmoScript(script)) {
        if (typeof(Ammo) === 'object')
          return Ammo;
      }

      return module.exports;
    }

    loadFactory = function () {
      factory = require('test-utils.js');
      //factory.addLibrary(require('ammo.js'));
      return !!factory.make;
    };

    var consoleFunctions = ['log', 'error', 'info', 'warn'];
    var console = { };
    for (var i = 0; i < consoleFunctions.length; i++) {
      console[consoleFunctions[i]] = function () {
      };
    }
  } else if (environment.isNode()) {

  }

  workerActions.loadFactory = loadFactory;

  if (typeof(module) === 'undefined') {
    module = {};
  }

  module.exports = {
    environment: environment,
    createWorker: createWorker,
    workerActions: workerActions,
    loadFactory: loadFactory
  };
  return module.exports;
})();

