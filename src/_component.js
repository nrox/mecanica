/**
 * component.js
 * super class
 */

var _ = require(lib/underscore.js);

function Component() {

}

Component.prototype.system = function () {
  if (arguments[0]) this._parent = arguments[0];
  return this._parent;
};

/**
 * returns a copy of defaults extend by options,
 * removing all properties not present in original defaults
 * also:
 * target.options = options;
 * @param target object
 * @param options object
 * @param defaults object
 */
Component.prototype.include = function (target, options, defaults) {
  options = _.extend(defaults, _.pick(options, _.keys(defaults), ['id', 'group', 'type', 'comment']));
  _.extend(target, options);
  target._options = options;
  return options;
};

Component.prototype.options = function () {
  return this._options;
};

Component.prototype.optionsWithoutId = function () {
  return _.omit(this._options, 'id');
};

