window.onload = function () {
  var client = new MecanicaClient();
};


function MecanicaClient() {
  _.extend(this, {
    socket: undefined,
    lib: undefined,
    mecanica: undefined,
    ui: undefined
  });
  this.initSocket();
}

MecanicaClient.prototype.initSocket = function () {
  var socket = io.connect(location.origin, {reconnection: false});
  var _this = this;
  socket.on('news', function (data) {
    console.log(data);
    socket.emit('my other event', { my: 'data' });
  });
  socket.on('connect', function () {
    _this.socket = socket;
    console.log('websocket: connected');
    $('#loading').show();
    setTimeout(function () {
      _this.buildListeners();
      _this.buildInputs();
      $('#loading').hide();
    }, 1);
  });
  socket.on('error', function () {
    console.error(arguments);
  });
};

MecanicaClient.prototype.buildInputs = function () {
  var _this = this;
  var list = _.filter(availablePaths(), function (p) {
    if ((p.indexOf('dist/ware/') == 0) && p.indexOf('.js') > 0) {
      return p;
    }
  });
  list = list.sort();
  var inputs = {
    script: list[0]
  };

  //some simple controls
  _.each(['load', 'start', 'stop', 'request', 'stream'], function (key) {
    inputs[key] = function () {
      var script = _this.ui.getValues().script;
      console.log(key, script);
      _this.socket.emit(key, {script: script});
    };
  });

  var template = {
    script: {type: 'list', values: list}
  };
  this.ui = new this.lib.UserInterface({
    values: inputs, template: template, container: '#triggers'
  }, this.mecanica);
};

MecanicaClient.prototype.buildListeners = function () {
  this.lib = require('../dist/mecanica.js');
  var me = this.mecanica = new this.lib.Mecanica({
    runsPhysics: false
  });
  me.import('./ware/settings/tests.js');
  me.import('./ware/scene/simple.js');
  me.import('./ware/light/set3.js');
  me.import('./ware/monitor/satellite.js');
  this.socket.on('status', function (data) {
    console[data.type || 'log']('status for', data.channel, ' - ', data.message);
  });
  this.socket.on('stream', function (data) {
    me.unpackPhysics(data.json);
    me.physicsDataReceived(true);
    me.startRender();
  });
  this.socket.on('request', function (data) {
    var script = data.script;
    var json = JSON.parse(data.json);
    try {
      me.loadSystem(json, script);
      me.addToScene();
      console.log('loaded system received from server: ' + script);
    } catch (e) {
      console.error(e);
    }
  });
};
