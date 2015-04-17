function Method(options, system) {
  this.construct(options, system, 'extended');
}

Method.prototype.types = {
  extended: function (options) {
    this.include(options, {
      method: undefined
    });
    this.notifyUndefined(['method']);
    if (typeof this.method == 'string') {
      this.method = eval(this.method);
    }
    if (typeof this.method == 'function') {
      this.parentSystem[this.id] = this.method;
    }
  }
};

extend(Method, Component);
Component.prototype.maker.method = Method;
