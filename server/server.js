var lib = require('../dist/mecanica.js');
var utils = require('../dist/utils.js');
var _ = require('underscore');
var VERBOSE = true;

var simulations = {
};

var userInterfaces = {
};

function registerAll(socket) {

  new Listener(socket, 'disconnect', function (data) {
    _.each(simulations, function (m, id) {
      clearTimeout(m._streamIntervalId);
      //m.stop();
    });
  });

  new Listener(socket, 'options', function (data) {
    var obj = this.require();
    this.emit({values: obj.defaultOptions});
  });

  new Listener(socket, 'load', function (data) {
    if (this.loadedMecanica()) {
      this.emitWarn('already loaded');
    } else {
      this.loadedMecanica(this.initMecanica(data.options));
    }
  });

  new Listener(socket, 'ui', function (data) {
    var mecanica = this.loadedMecanica();
    var obj = this.require();
    if (obj.userInterface) {
      var ui = obj.userInterface({
        system: mecanica.getSystem(this.script)
      }, mecanica);
      this.loadedUI(ui);
    }
  });

  new Listener(socket, 'ui-trigger', function (data) {
    var ui = this.loadedUI();
    var path = data.path;
    var values = data.values;

    if (ui) {
      var ui = obj.userInterface({
        system: mecanica.getSystem(this.script)
      }, mecanica);
      this.loadedUI(ui);
    }
  });

  new Listener(socket, 'start', function (data) {
    var mecanica = this.loadedMecanica();
    if (!mecanica) {
      this.emitError('not yet loaded');
    } else if (mecanica.isSimulationRunning()) {
      this.emitWarn('already running');
    } else {
      mecanica.startSimulation();
    }
  });

  new Listener(socket, 'stop', function (data) {
    var mecanica = this.loadedMecanica();
    if (!mecanica) {
      this.emitError('not yet loaded');
    } else if (!mecanica.isSimulationRunning()) {
      this.emitWarn('not running');
    } else {
      clearInterval(mecanica._streamIntervalId);
      mecanica.stopSimulation();
    }
  });

  new Listener(socket, 'request', function (data) {
    var mecanica = this.loadedMecanica();
    if (!mecanica) {
      this.emitError('not yet loaded');
    } else {
      var json = mecanica.getSystem(this.script).toJSON();
      this.emit(json);
    }
  });

  new Listener(socket, 'stream', function (data) {
    var mecanica = this.loadedMecanica();
    if (!mecanica) {
      this.emitError('not yet loaded');
    } else if (!mecanica.isSimulationRunning()) {
      this.emitWarn('not running');
    } else {
      var _this = this;
      mecanica._streamIntervalId = setInterval(function () {
        try {
          _this.emitVolatile(mecanica.physicsPack);
        } catch (e) {
          _this.emitError(e);
        }
      }, 1000 / mecanica.getSettings().renderFrequency);
    }
  });


}

function Listener(socket, channel, callback) {
  socket.on(channel, function (data) {
    new Responder(channel, socket, callback, data);
  });
}

function Responder(channel, socket, callback, data) {
  if (VERBOSE) console.log(channel, data.script);
  this.socket = socket;
  this.script = data.script;
  this.channel = channel;
  try {
    callback.call(this, data);
    if (VERBOSE) this.emitStatus('OK');
  } catch (e) {
    this.emitError(e);
  }
}

Responder.prototype.emit = function (data) {
  this.socket.emit(this.channel, {channel: this.channel, script: this.script, data: data});
};

Responder.prototype.emitVolatile = function (data) {
  this.socket.volatile.emit(this.channel, {channel: this.channel, script: this.script, data: data});
};

Responder.prototype.emitStatus = function (status, type) {
  this.socket.volatile.emit('status', {channel: this.channel, script: this.script, status: status, type: type || 'log'});
};

Responder.prototype.emitError = function (e) {
  if (VERBOSE) console.error('error: ', e.message);
  this.emitStatus(e.message, 'error');
};

Responder.prototype.emitWarn = function (message) {
  if (VERBOSE) console.warn('warn: ', message);
  this.emitStatus(message, 'warn');
};

Responder.prototype.scriptPath = function () {
  //TODO security filter, validation, pick from folder
  return '../' + this.script;
};

Responder.prototype.require = function () {
  return require(this.scriptPath());
};

Responder.prototype.loadedMecanica = function (obj) {
  if (obj) simulations[this.script] = obj;
  return simulations[this.script];
};

Responder.prototype.loadedUI = function (obj) {
  if (obj) userInterfaces[this.script] = obj;
  return userInterfaces[this.script];
};

Responder.prototype.initMecanica = function (options) {
  var me = new lib.Mecanica();
  me.import('../dist/ware/settings/tests.js');
  me.import('../dist/ware/scene/simple.js');
  me.importSystem(this.scriptPath(), this.script, options);
  me.addToScene();
  return me;
}

module.exports = function (socket) {
  registerAll(socket);
};