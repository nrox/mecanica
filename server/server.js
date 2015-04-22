var lib = require('../dist/mecanica.js');
var utils = require('../dist/utils.js');
var underscore = require('underscore');
var STATUS = 'status';

var simulations = {

};

function register(socket) {

  socket.on('load', function (data) {
    var channel = 'load';
    console.log(channel, data);
    var script = data.script;
    if (simulations[script]) {
      socket.emit(STATUS, {channel: channel, message: 'already loaded: ' + script, type: 'warn'});
    } else {
      simulations[script] = initMecanica(script, data.options);
      socket.emit(STATUS, {channel: channel, message: 'loaded: ' + script});
    }
  });

  socket.on('start', function (data) {
    var channel = 'start';
    console.log(channel, data);
    var script = data.script;
    var mecanica = simulations[script];
    if (!mecanica) {
      socket.emit(STATUS, {channel: channel, message: 'not yet loaded: ' + script, type: 'error'});
    } else if (mecanica.isSimulationRunning()) {
      socket.emit(STATUS, {channel: channel, message: 'already running: ' + script, type: 'warn'});
    } else {
      try {
        mecanica.startSimulation();
        socket.emit(STATUS, {channel: channel, message: 'running: ' + script});
      } catch (e) {
        socket.emit(STATUS, {channel: channel, message: e, type: 'error'});
      }
    }
  });

  socket.on('stop', function (data) {
    var channel = 'stop';
    console.log(channel, data);
    var script = data.script;
    var mecanica = simulations[script];
    if (!mecanica) {
      socket.emit(STATUS, {channel: channel, message: 'not yet loaded: ' + script, type: 'error'});
    } else if (!mecanica.isSimulationRunning()) {
      socket.emit(STATUS, {channel: channel, message: 'not running: ' + script, type: 'warn'});
    } else {
      try {
        mecanica.stopSimulation();
        socket.emit(STATUS, {channel: channel, message: 'stopped: ' + script});
      } catch (e) {
        socket.emit(STATUS, {channel: channel, message: e, type: 'error'});
      }
    }
  });

  socket.on('request', function (data) {
    var channel = 'request';
    console.log(channel, data);
    var script = data.script;
    var mecanica = simulations[script];
    if (!mecanica) {
      socket.emit(STATUS, {channel: channel, message: 'not yet loaded: ' + script, type: 'error'});
    } else {
      try {
        var json = utils.stringify(mecanica.getSystem(script).toJSON());
        socket.emit(channel, {script: script, json: json});
      } catch (e) {
        socket.emit(STATUS, {channel: channel, message: e, type: 'error'});
      }
    }
  });

}

function initMecanica(script, options) {
  var me = new lib.Mecanica();
  me.import('../dist/ware/settings/tests.js');
  me.import('../dist/ware/scene/simple.js');
  me.importSystem(fileFor(script), script, options);
  me.addToScene();
  return me;
}
function fileFor(script) {
  //TODO security
  return '../' + script;
}


module.exports = function (socket) {
  register(socket);
};