var ALLOW_EVAL = true;

var _ = require('lib/underscore.js');
var Ammo = require('lib/ammo.js');
var factory = require('factory.js');
factory.addLibrary(Ammo);

var actions = {
  require: function (script) {
    return !!require(script);
  },
  eval: function (s) {
    if (!ALLOW_EVAL) return 'eval not allowed';
    return eval(s);
  }
};

onmessage = function (e) {
  var request = e.data;
  if ((typeof request == 'object') && actions[request.action]) {
    var result = actions[request.action].apply(self, request.arguments);
    if (request.action != 'result') {
      var response = {};
      if (request.id) response.id = request.id;
      if (request.comment) response.comment = request.comment;
      response.result = result;
      postMessage(response);
    }
  } else if (typeof request == 'string') {
    postMessage(request); //echo
  }
};


function require(script) {
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

  var url = scriptURL(script);
  module = {
    exports: {}
  };
  var exports = module.exports;
  //in case of ammo remove stubs, or it will require fs and path
  if (isAmmoScript(script)) {
    module = exports = undefined;
  }
  importScripts(url);
  if (isAmmoScript(script)) {
    if (typeof(Ammo) === 'object')
      return Ammo;
  }
  return module.exports;
}

