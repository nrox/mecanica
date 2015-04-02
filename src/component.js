/**
 * component.js
 * super class
 */


var UNDEFINED = undefined;
var RUNS_PHYSICS = true;
var RUNS_WEBGL = true;

var _ = require('lib/underscore.js');
var ammoHelper = require('lib/ammo.js');
var utils = require('util/utils.js');

var Ammo = undefined;
var THREE = undefined;

if (RUNS_PHYSICS){
  Ammo = ammoHelper;
}
if (RUNS_WEBGL){
  THREE = require('lib/three.js');
}

function extend(target, source) {
  _.defaults(target.prototype, source.prototype);
}

function Component() {

}

Component.prototype.runsPhysics = function () {
  return RUNS_PHYSICS;
};

Component.prototype.runsWebGL = function () {
  return RUNS_WEBGL;
};

Component.prototype.system = function () {
  if (arguments[0]) this._parent = arguments[0];
  return this._parent;
};

Component.prototype.include = function (options, defaults) {
  var target = this;
  options = _.extend(defaults, _.pick(options, _.keys(defaults), [
    'id', 'group', 'type', 'comment'
  ]));
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

Component.prototype.hasUndefined = function (keys) {
  var obj = this;
  if (!keys) keys = _.keys(obj._options);
  return _.some(keys, function (key) {
    return obj._options[key] === UNDEFINED;
  });
};

Component.prototype.notifyUndefined = function (keys) {
  var obj = this;
  if (this.hasUndefined(keys)) {
    console.error('object has undefined values:');
    console.warn(keys);
    console.warn(JSON.stringify(obj._options,
      function (k, v) {
        return v === undefined ? null : v;
      }, ' '));
    return true;
  }
  return false;
};

Component.prototype.nextId = (function () {
  var index = 0;
  return function (prefix) {
    //use == here, never === because null values should be handled the same way
    if (prefix == undefined) {
      prefix = 'id';
    }
    return prefix + index++;
  };
})();

Component.prototype.construct = function(options, system, defaultType){
  if (!this.types[options.type]) options.type = defaultType;
  var cons = this.types[options.type];
  this.system = system;
  cons.call(this, options, system);
};

Component.prototype.types = {};

Component.prototype.maker = {};

Component.prototype.debug = function () {
  return false;
};

Component.prototype.addPhysicsMethod = function (funName, reference) {
  if (this.runsPhysics()) {
    this[funName] = reference;
  } else {
    //let it be executed in worker
    this[funName] = function () {
      post(['execMethod', [this.group, this.id], funName, utils.argList(arguments) ]);
    }
  }
};

function Mecanica(options) {
  this.include(options, {
    worker: false, //use web worker for simulations
    server: false,//runs simulation in ndoe.js server side
    render: true //render using webgl
  });
}

Mecanica.prototype.destroy = function () {

};

extend(Mecanica, Component);



