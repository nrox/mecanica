/**
 * this will only work in the browser, as a worker script
 * @param script
 * @param arg
 * @returns {*}
 */

var allowEval = true;
/**
 * Use importScripts to emulate require
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

  //all paths are converted to absolute
  if (script.lastIndexOf('.js') < 0) return;
  //and scripts location are predefined
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
    var Ammo = Ammo || {};
    module = {
      exports: Ammo
    };
  }

  return module.exports;
}

var consoleFunctions = ['log', 'error', 'info', 'warn'];
var console = {
};

for (var i = 0; i < consoleFunctions.length; i++) {
  console[consoleFunctions[i]] = function () {
  };
}

onmessage = function (e) {
  var data = e.data;
  if (typeof data == 'string') {
    postMessage(e.data);
  } else if (typeof data == 'object') {
    for (var key in data) {
      if (actions.hasOwnProperty(key)) {
        var res = actions[key].apply(this, data[key]);
        postMessage(res);
      }
    }
  }
};

var actions = {
  require: function (script) {
    return !!require(script);
  },
  eval: function (s) {
    if (!allowEval) return 'eval not allowed';
    return eval(s);
  }
};


