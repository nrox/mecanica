window.onload = function () {
  new MecanicaClient(true || !isLocalhost());
};


function MecanicaClient(inWorker) {
  _.extend(this, {
    socket: undefined,
    lib: undefined,
    mecanica: undefined,
    controls: undefined,
    options: undefined,
    ui: undefined
  });
  if (!inWorker) {
    this.initSocket();
  } else {
    console.log('using web worker');
    this.lib = require('../dist/mecanica.js');
    this.mecanica = new this.lib.Mecanica({
      useDefaults: true, runsPhysics: false
    });
    var worker = new this.lib.WebWorker({}, this.mecanica);
    this.socket = worker.mockServer();
    this.initSocket();
    this.socket.emit('connect');
  }
}

MecanicaClient.prototype.initSocket = function () {
  var url = location.href.substr(0, location.href.indexOf('/dist'));
  this.socket = this.socket || io.connect(url, {reconnection: false});
  var _this = this;
  this.socket.on('connect', function () {
    console.log('websocket: connected');
    $('#loading').show();
    setTimeout(function () {
      _this.buildListeners();
      _this.buildInputs();
      $('#loading').hide();
    }, 1);
  });
  _this.socket.on('error', function () {
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
  _.each(['options', 'load', 'ui', 'start', 'request', 'stream', 'stop', 'destroy'], function (key) {
    inputs[key] = function () {
      var script = _this.controls.getValues().script;
      //console.log('command', key, script);
      _this.socket.emit(key, {script: script, options: _this.options ? _this.options.getValues() : undefined});
    };
  });

  var template = {
    script: {type: 'list', values: list}
  };
  this.controls = new this.lib.UserInterface({
    values: inputs, template: template, container: '#triggers', title: 'Server Commands'
  }, this.mecanica);
};

MecanicaClient.prototype.buildListeners = function () {
  this.lib = this.lib || require('../dist/mecanica.js');
  var _this = this;
  var me = this.mecanica = (this.mecanica || new this.lib.Mecanica({
    useDefaults: true, runsPhysics: false
  }));
  //me.import('./ware/settings/tests.js');
  //me.import('./ware/scene/simple.js');
  //me.import('./ware/light/set3.js');
  //me.import('./ware/monitor/satellite.js');

  this.socket.on('status', function (message) {
    console[message.type || 'log']('response', message.channel, message.script, message.status);
  });

  this.socket.on('options', function (message) {
    if (!message.data.values) {
      if (_this.options) _this.options.destroy();
      return;
    }
    message.data.container = '#triggers';
    message.data.title = 'Options';
    message.data.css = {
      '.key': {
        'text-align': 'right',
        'min-width': '10em'
      }
    };
    if (_this.options) {
      _this.options.reuseWith(message.data);
    } else {
      _this.options = new _this.lib.UserInterface(message.data, me);
    }
  });

  this.socket.on('stream', function (message) {
    me.unpackPhysics(message.data);
    me.physicsDataReceived(true);
    me.startRender();
  });

  this.socket.on('request', function (message) {
    var script = message.script;
    try {
      _.each(me.objects.system, function (sys) {
        sys.destroy();
      });
      me.loadSystem(message.data, script);
      me.addToScene();
      me.physicsDataReceived(true);
      me.startRender();
    } catch (e) {
      console.error(e.message);
    }
  });

  this.socket.on('ui', function (message) {
    var script = message.script;
    var obj = require(script);
    if (!_this.ui) {
      _this.ui = new _this.lib.UserInterface({
        container: '#triggers',
        title: 'Controls',
        overrideCallbacks: true,
        css: {
          '.key': {
            'text-align': 'right',
            'min-width': '10em'
          }
        }
      }, me);
    }
    if (obj.userInterface) {
      var options = obj.userInterface({
        system: script, container: '#triggers'
      }, _this.lib);
      _this.ui.reuseWith(options);
      _this.ui.setCallback(function (data) {
        _this.socket.emit('ui-trigger', {script: script, data: data});
      });
    }
  });

  this.socket.on('destroy', function (message) {
    var script = message.script;
    try {
      var sys = me.getSystem(script);
      if (sys) {
        sys.destroy();
        _this.options && _this.options.destroy();
        _this.ui && _this.ui.destroy();
      }
    } catch (e) {
      console.error(e.message);
    }
  });

};
