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
      this.method = eval('(' + this.method + ')');
    }
    if (typeof this.method == 'function') {
      this.parentSystem[this.id] = this.method;
    }
  }
};

Method.prototype.toJSON = function () {
  var json = utils.deepCopy(this._options);
  json.method = "" + this.method;
  delete json.id;
  delete json.group;
  return json;
};

Method.prototype.destroy = function () {
  try {
    delete this.parentSystem[this.id];
  } catch (e) {
    console.log(this.group, this.id, e.message || e);
    throw e;
  }
};


extend(Method, Component);
Component.prototype.maker.method = Method;
Component.prototype.defaultType.method = 'extended';
