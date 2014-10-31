var ALLOW_EVAL = true;
defineConsole();
defineRequire();
var _ = require('lib/underscore.js');
var Ammo = require('lib/ammo.js');
var factory = require('factory.js');
var utils = require('utils.js');

factory.addLibrary(Ammo);

var actions = {
  require: function (script) {
    return !!require(script);
  },
  eval: function (s) {
    if (!ALLOW_EVAL) return 'eval not allowed';
    return eval(s);
  },
  factory: function () {
    var args = utils.argList(arguments);
    var fun = args.shift();
    return factory[fun].apply(factory, args);
  }
};

onmessage = function (e) {
  var request = e.data;
  if ((typeof request == 'object') && actions[request.action]) {
    if (request.action != 'result') {
      var result = actions[request.action].apply(self, request.arguments);
      var response = {};
      if (request.id) response.id = request.id;
      if (request.comment) response.comment = request.comment;
      response.result = result;
      postMessage(response);
    }
  } else {
    postMessage(request); //echo
  }
};

function defineRequire() {

  availablePaths = undefined;

  var url = ['../list.js', 'list.js', '../../list.js'];
  for (var p = 0; !availablePaths && (p < url.length); p++) {
    try {
      importScripts(url[p]);
    } catch (e) {
    }
    if (availablePaths) {
      break;
    }
  }

  if (availablePaths) {
    for (var i = 0; i < availablePaths.length; i++) {
      availablePaths[i] = availablePaths[i].substr(2);
      if (availablePaths[i].indexOf('/') === 0) {
        availablePaths[i] = availablePaths[i].substr(1);
      }
    }
  } else {
    console.warn('availablePaths: ' + availablePaths);
  }

  self.require = function (script) {

    function fileName(script) {
      return script.substr(script.lastIndexOf('/') + 1);
    }

    function httpRoot() {
      var locationHref = location.href.split('').reverse().join('');
      if (locationHref.indexOf('/') === 0) locationHref = locationHref.substr(1);
      var longest = 0;
      for (var i = 0; i < availablePaths.length; i++) {
        if (locationHref.indexOf(availablePaths[i].split('').reverse().join('')) == 0) {
          if (availablePaths[i].length > longest) {
            longest = availablePaths[i].length;
          }
        }
      }
      var root;
      if (longest) {
        root = locationHref.substr(longest).split('').reverse().join('');
      }
      return root;
    }

    function requiredPath(script) {
      script = script.replace('/../', '/');
      while (script.indexOf('/../') > 0) script = script.replace('/../', '/');
      if (script.indexOf('./') == 0) script = script.substr(2);
      if (script.indexOf('../') == 0) script = script.substr(3);
      while (script.indexOf('//') > 0) script = script.replace('//', '/');
      while (script.indexOf('/') == 0) script = script.substr(1);
      var fragments = script.split('/');
      for (var i = 0; i < availablePaths.length; i++) {
        var pos = -1;
        for (var j = 0; j < fragments.length; j++) {
          pos = availablePaths[i].indexOf(fragments[j], pos);
        }
        if (pos > -1) {
          return availablePaths[i];
        }
      }
      return undefined;
    }

    function isAmmoScript(script) {
      return fileName(script) == 'ammo.js';
    }

    var path = requiredPath(script);

    var url;
    if (!path) {
      url = script;
      console.warn(script + ' is not registered. Use: bash listdir.sh');
    } else {
      url = httpRoot() + path;
    }

    module = {
      exports: {}
    };
    exports = module.exports;
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
  };
}

function defineConsole() {
  var types = ['log', 'info', 'warn', 'error'];
  self.console = {};
  while (types.length) {
    var type = types.shift();
    self.console[type] = (function (type) {
      return function () {
        var args = [type];
        for (var i = 0; i < arguments.length; i++) {
          args.push(arguments[i]);
        }
        postMessage({
          action: 'console',
          arguments: args
        });
      };
    })(type);
  }
}


