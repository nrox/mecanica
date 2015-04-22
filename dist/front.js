function init() {

}


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
  var inputs = {

  };
  var template = {

  };
  this.ui = new this.lib.UserInterface({
    values: inputs, template: template, container: '#triggers'
  }, this.mecanica);
};

MecanicaClient.prototype.buildListeners = function () {
  this.lib = require('../dist/mecanica.js');
  var me = this.mecanica = new this.lib.Mecanica();
  me.import('./ware/settings/tests.js');
  me.import('./ware/scene/simple.js');
  me.import('./ware/light/set3.js');
};