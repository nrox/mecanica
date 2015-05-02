function WebWorker(options, system) {
  this.construct(options, system, 'basic');
}

WebWorker.prototype.types = {
  basic: function (options) {
    this.include(options, {
      url: '../dist/worker.js'
    });
    if (!utils.isBrowserWindow())  throw new Error("WebWorker is not supported in this environment. Browser: false");
    this.worker = new Worker(this.url);
    this.callbacks = {};
    this.createListeners();
  }
};

WebWorker.prototype.callbacks = function () {
};
WebWorker.prototype.createListeners = function () {
  var _this = this;
  this.worker.addEventListener('message', function (e) {
    var data = e.data;
    var channel = data.channel;
    if (channel == 'window') {
      window[data.object][data.method].apply(window[data.object][data.method], data['arguments']);
    } else if (channel == 'result') {
      var callback = data.callback && _this.callbacks[data.callback];
      if (typeof callback == 'function') {
        callback.call(null, data.result);
        delete _this.callbacks[data.callback];
      }
    } else if (channel == 'echo') {
      console.log('worker echoed:', data.echo);
    } else {
      console.log('unregistered callback for worker message:', e.data);
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
  delete this.worker;
};


extend(WebWorker, Component);
