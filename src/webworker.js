function WebWorker(options, system) {
  this.construct(options, system, 'front');
}

WebWorker.prototype.types = {
  front: function (options) {
    this.include(options, {
      url: '../dist/worker.js'
    });
    if (!utils.isBrowserWindow())  throw new Error("WebWorker is not supported in this environment. Browser: false");
    this.worker = new Worker(this.url);
    this.callbacks = {};
    this.createListeners();
    this.rootSystem.webWorker = this;
  }
};

WebWorker.prototype.callbacks = function () {
};
WebWorker.prototype.createListeners = function () {
  var _this = this;
  this.worker.addEventListener('message', function (e) {
    var data = e.data;
    var channel = data.channel;
    try {
      if (channel == 'window') {
        window[data.object][data.method].apply(window[data.object], data['arguments']);
      } else if (channel == 'mecanica') {
        this.rootSystem[data.method].apply(this.rootSystem, data['arguments']);
      } else if (channel == 'result') {
        var callback = data.callback && _this.callbacks[data.callback];
        if (typeof callback == 'function') {
          callback.call(null, data.result);
          delete _this.callbacks[data.callback];
        }
      } else if ((channel == 'socket') && _this.socket) {
        _this.socket.trigger(data.emit, data.data);
      } else {
        console.log('unregistered callback for worker message:', e.data);
      }
    } catch (err) {
      console.log(err, e.data);
      throw err;
    }
  }, false);
};

/**
 * Executes in worker environment
 * @param data: a function or {method: function [, object: this] [, callback: function] [,arguments: list ]
 * @param callback: an optional function
 */
WebWorker.prototype.execute = function (data, callback) {
  var callbackId;
  if ((typeof data == 'function')) {
    var message = {
      channel: 'execute',
      method: "" + data
    };
    if (callback) {
      callbackId = this.nextId('callback');
      this.callbacks[callbackId] = callback;
      message.callback = callbackId;
    }
    this.postMessage(message);
  } else if ((typeof data == 'object')
    && data.method
    && (!data['arguments'] || (data['arguments'] instanceof Array))
    && (!data.object || (typeof data.object == 'string'))) {
    if (callback = (callback || data.callback)) {
      callbackId = this.nextId('callback');
      this.callbacks[callbackId] = callback;
      data.callback = callbackId;
    }
    data.channel = "execute";
    this.postMessage(data);
  } else {
    console.log('error: ', data);
    throw new Error('in WebWorker.execute');
  }
};

WebWorker.prototype.postMessage = function (message) {
  if (this.worker) this.worker.postMessage(message);
};

WebWorker.prototype.destroy = function () {
  if (this.worker) this.worker.terminate();
  if (this.rootSystem.webWorker) delete this.rootSystem.webWorker;
  delete this.worker;
};

WebWorker.prototype.mockServer = function () {
  var _this = this;
  var socket;
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
      _this.worker.postMessage({
        channel: 'socket',
        emit: channel,
        data: data || {}
      });
    }
  };
  this.socket = socket;
  this.execute({
    method: "mockServer",
    arguments: ['../server/server.js']
  });
  return socket;
};

extend(WebWorker, Component);
