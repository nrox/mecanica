(function (self, $) {
  defineConsole();

  availablePaths = undefined;
  socket = undefined;
  var url = ['./list.js', '../dist/list.js', '../../dist/list.js'];

  //load available paths
  (function () {
    //availablePaths = undefined;
    for (var u = 0; !list && (u < url.length); u++) {
      if (availablePaths) break;
      try {
        importScripts(url[u]);
      } catch (e) {
      }
      if (!availablePaths) continue;
      var list = availablePaths;
      for (var i = 0; i < list.length; i++) {
        list[i] = list[i].substr(2);
        if (list[i].indexOf('/') === 0) list[i] = list[i].substr(1);
      }
      availablePaths = list;
    }
  })();

  if (!availablePaths) {
    throw new Error('Worker failed to load availablePaths in list.js');
  }

  function httpRoot() {
    var locationHref = (location.origin + location.pathname).split('').reverse().join('');
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
    //TODO make this more understandable
    script = script.replace('/../', '/');
    while (script.indexOf('/../') > 0) script = script.replace('/../', '/');
    while (script.indexOf('./') == 0) script = script.substr(2);
    while (script.indexOf('../') == 0) script = script.substr(3);
    while (script.indexOf('//') > 0) script = script.replace('//', '/');
    while (script.indexOf('/') == 0) script = script.substr(1);
    var fragments = script.split('/');
    var ret;
    var failed;
    for (var i = 0; i < availablePaths.length; i++) {
      if (script == availablePaths[i]) {
        ret = script;
        break;
      }
      failed = false;
      var pathFragments = availablePaths[i].split('/');
      for (var j = 0; j < fragments.length; j++) {
        if (fragments[fragments.length - j - 1] != pathFragments[pathFragments.length - j - 1]) {
          failed = true;
          break;
        }
      }
      if (!failed) {
        ret = availablePaths[i];
        break;
      }
    }
    return ret;
  }

  self.requireURL = function (script) {
    return httpRoot() + requiredPath(script);
  };

  /**
   * A custom version of require for this library purpose
   * It was developed, instead of using browserify, because of Ammo.js trying to require fs and path
   * @param script the relative the url
   * @param arg the argument for test scripts
   * @returns {module.exports || undefined}
   */
  self.require = function (script, arg) {

    if (arg === undefined) arg = undefined;

    function fileName(script) {
      return script.substr(script.lastIndexOf('/') + 1);
    }


    function isAmmo(script) {
      return fileName(script) == 'ammo.js';
    }

    function isLocalhost() {
      return location.hostname == 'localhost';
    }

    if (script.lastIndexOf('.js') < 0) return;
    var path = requiredPath(script);

    var url;
    if (!path) {
      url = script;
      console.warn(script + ' is not registered. Use: bash listdir.sh');
    } else {
      url = httpRoot() + path;
    }

    var backup;

    if (typeof module != 'undefined') {
      backup = module;
    }
    //node.js stubs
    process = {
      //an argument is necessary for some test-....js scripts
      argv: ['node', script, arg]
    };
    __filename = script;
    module = {
      exports: {}
    };

    exports = module.exports;
    //in case of ammo remove stubs, or it will require fs and path
    if (isAmmo(script)) {
      module = process = exports = undefined;
    }

    //console.log('require', script);

    importScripts(url);
    if (isAmmo(script)) {
      if (typeof(Ammo) === 'object')
        return Ammo;
    }

    var ret = module.exports;
    if (backup) {
      module.exports = backup;
    }
    //console.log('after import', script);
    return ret;
  };
})(self, {});

var _ = require('./lib/underscore.js');

function defineConsole() {
  var types = ['log', 'info', 'warn', 'error'];
  self.console = {};
  while (types.length) {
    var type = types.shift();
    self.console[type] = (function (type) {
      return function () {
        var args = [];
        for (var i = 0; i < arguments.length; i++) {
          args.push(arguments[i]);
        }
        self.postMessage({
          channel: 'window',
          object: 'console',
          method: type,
          arguments: args
        });
      };
    })(type);
  }
}

function mockServer(url) {
  console.log('will mock server', url);
  socket = {
    callbacks: {}, //should be an array
    on: function (channel, callback) {
      socket.callbacks[channel] = callback;
    },
    trigger: function (channel, data) {
      if (typeof socket.callbacks[channel] == 'function') {
        socket.callbacks[channel].call(null, data);
      }
    },
    emit: function (channel, data) {
      self.postMessage({
        channel: 'socket',
        emit: channel,
        data: data
      });
    },
    volatile: {
      emit: function (c, d) {
        socket.emit(c, d);
      }
    }
  };
  require(url)(socket);
}

self.onmessage = function (e) {
  var data = e.data;
  var channel = data.channel;
  if (channel == 'echo') {
    self.postMessage(e.data);
  } else if ((channel == 'socket') && socket) {
    socket.trigger(data.emit, data.data);
  } else if (channel == 'execute') {
    try {
      var fun = eval('(' + data.method + ')');
      if (typeof fun != 'function') throw new Error('method is not a function');
      data.channel = 'result';
      data.result = fun.apply(self[data.object], data['arguments']);
      self.postMessage(data);
    } catch (e) {
      console.log('error in worker execute: ', e.message, data);
      throw e;
    }
  } else {
    console.log('worker has no callback for message:', e.data);
  }
};
