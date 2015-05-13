function Exception() {
  this.stack = [];
}

Exception.prototype.append = function (str) {
  if (str !== undefined) this.stack.push(str);
};

Exception.prototype.rethrow = function (str) {
  this.append(str);
  throw this;
};

Exception.prototype.log = function () {
  for (var i = 0; i < this.stack.length; i++) {
    console.log(this.stack[i]);
  }
};