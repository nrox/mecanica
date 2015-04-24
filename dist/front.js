window.onload = function () {
  var client = new MecanicaClient();
};


function MecanicaClient() {
  _.extend(this, {
    socket: undefined,
    lib: undefined,
    mecanica: undefined,
    controls: undefined,
    options: undefined,
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
  _.each(['options', 'load', 'ui', 'start', 'stop', 'request', 'stream'], function (key) {
    inputs[key] = function () {
      var script = _this.controls.getValues().script;
      console.log(key, script);
      _this.socket.emit(key, {script: script, options: _this.options ? _this.options.getValues() : undefined});
    };
  });

  var template = {
    script: {type: 'list', values: list}
  };
  this.controls = new this.lib.UserInterface({
    values: inputs, template: template, container: '#triggers'
  }, this.mecanica);
};

MecanicaClient.prototype.buildListeners = function () {
  this.lib = require('../dist/mecanica.js');
  var _this = this;
  var me = this.mecanica = new this.lib.Mecanica({
    runsPhysics: false
  });
  me.import('./ware/settings/tests.js');
  me.import('./ware/scene/simple.js');
  me.import('./ware/light/set3.js');
  me.import('./ware/monitor/satellite.js');

  this.socket.on('status', function (message) {
    console[message.type || 'log'](message.channel, message.script, message.status);
  });

  this.socket.on('options', function (message) {
    if (!message.data.values) {
      if (_this.options) _this.options.destroy();
      return;
    }
    message.data.container = '#triggers';
    message.data.title = 'Load Options';
    if (_this.options) {
      _this.options.reuseWith(message.data);
    } else {
      _this.options = new _this.lib.UserInterface(message.data, me);
    }
    options = _this.options;
  });

  this.socket.on('stream', function (message) {
    me.unpackPhysics(message.data);
    me.physicsDataReceived(true);
    me.startRender();
  });

  this.socket.on('request', function (message) {
    var script = message.script;
    try {
      me.loadSystem(message.data, script);
      me.addToScene();
    } catch (e) {
      console.error(e);
    }
  });
};
