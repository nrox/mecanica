var lib = require('../dist/mecanica.js');
var utils = require('../dist/utils.js');
var path = require('path');

var _ = require('underscore');
var VERBOSE = false;

var simulations = {
};

var userInterfaces = {
};

function registerAll(socket) {

  new Listener(socket, 'disconnect', function () {
    _.each(simulations, function (m) {
      clearTimeout(m._streamIntervalId);
    });
  });

  new Listener(socket, 'options', function () {
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

  new Listener(socket, 'ui', function () {
    if (this.loadedUI()) {
      this.emitWarn('ui already loaded');
      this.emit();
      return;
    }
    var mecanica = this.loadedMecanica();
    var obj = this.require();
    if (obj.userInterface) {
      var options = obj.userInterface({
        system: this.script
      });
      var ui = new lib.UserInterface(options, mecanica);
      this.loadedUI(ui);
      this.emit();
    }
  });

  new Listener(socket, 'ui-trigger', function (data) {
    var ui = this.loadedUI();
    if (ui) {
      ui.applyRemote(data.data);
    } else {
      this.emitWarn('ui not loaded');
    }
  });

  new Listener(socket, 'start', function () {
    var mecanica = this.loadedMecanica();
    if (!mecanica) {
      this.emitError('not yet loaded');
    } else if (mecanica.isSimulationRunning()) {
      this.emitWarn('already running');
    } else {
      mecanica.startSimulation();
    }
  });

  new Listener(socket, 'stop', function () {
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

  new Listener(socket, 'request', function () {
    var mecanica = this.loadedMecanica();
    if (!mecanica) {
      this.emitError('not yet loaded');
    } else {
      var json = mecanica.getSystem(this.script).toJSON();
      this.emit(json);
    }
  });

  new Listener(socket, 'stream', function () {
    var mecanica = this.loadedMecanica();
    if (!mecanica) {
      this.emitError('not yet loaded');
    } else if (!mecanica.isSimulationRunning()) {
      this.emitWarn('not running');
    } else {
      var _this = this;
      clearInterval(mecanica._streamIntervalId);
      mecanica._streamIntervalId = setInterval(function () {
        try {
          _this.emitVolatile(mecanica.physicsPack);
        } catch (e) {
          _this.emitError(e);
        }
      }, 1000 / mecanica.getSettings().renderFrequency);
    }
  });

  new Listener(socket, 'destroy', function () {
    var ui = this.loadedUI();
    if (!ui) {
      this.emitWarn('UI not yet loaded');
    } else {
      this.loadedUI(null);
      ui.destroy();
    }

    var mecanica = this.loadedMecanica();
    if (!mecanica) {
      this.emitWarn('Mecanica not yet loaded');
    } else {
      mecanica.stopSimulation();
      clearInterval(mecanica._streamIntervalId);
      this.loadedMecanica(null);
      mecanica.destroy();
    }
    this.emit();
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
  var root = path.join(__dirname, '..');
  var clean = path.normalize(this.script);
  var absolute = path.join(root, clean);
  var ware = path.join(root, 'dist', 'ware');
  if (absolute.indexOf(ware) !== 0) throw new Error('path ' + this.script + ' resolving to ' + absolute + ' was rejected');
  return absolute;
};

Responder.prototype.require = function () {
  return require(this.scriptPath());
};

Responder.prototype.loadedMecanica = function (obj) {
  if (obj) {
    simulations[this.script] = obj;
  } else if (obj === null) {
    delete simulations[this.script];
  }
  return simulations[this.script];
};

Responder.prototype.loadedUI = function (obj) {
  if (obj) {
    userInterfaces[this.script] = obj;
  } else if (obj === null) {
    delete userInterfaces[this.script];
  }
  return userInterfaces[this.script];
};

Responder.prototype.initMecanica = function (options) {
  var me = new lib.Mecanica();
  me.import('../dist/ware/settings/tests.js');
  me.import('../dist/ware/scene/simple.js');
  me.importSystem(this.scriptPath(), this.script, options);
  me.addToScene();
  return me;
};

module.exports = function (socket) {
  registerAll(socket);
};