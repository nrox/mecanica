/**
 * component.js
 * super class
 */


var _ = require('./lib/underscore.js');
var ammoHelper = require('./lib/ammo.js');
var utils = require('../dist/utils.js');

var UNDEFINED = undefined;
var RUNS_PHYSICS = true;
var RUNS_RENDER = !utils.isNode();

var Ammo, THREE, jQuery;

if (RUNS_PHYSICS) {
  Ammo = ammoHelper;
}

if (RUNS_RENDER) {
  THREE = require('./lib/three.js');
  jQuery = require('./lib/jquery.js');
}

function extend(target, source) {
  _.defaults(target.prototype, source.prototype);
}

function Component() {
}

Component.prototype.RUNS_PHYSICS = true;
Component.prototype.RUNS_RENDER = !utils.isNode();


Component.prototype.runsPhysics = function () {
  return this.RUNS_PHYSICS;
};

Component.prototype.runsRender = function () {
  return this.RUNS_RENDER;
};

Component.prototype.runsInWorker = function () {
  return utils.isBrowserWorker();
};

Component.prototype.include = function (options, defaults) {
  var target = this;
  //target._originalOptions = options;
  options = _.extend(defaults, _.pick(options || {}, _.keys(defaults), [
    'id', 'group', 'type', 'comment'
  ]));
  _.extend(target, options);
  if (!target._options) target._options = {};
  _.defaults(target._options, options);
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

Component.prototype.construct = function (options, system, defaultType) {
  if (!options) options = {};
  if (!this.types[options.type]) options.type = defaultType;
  var cons = this.types[options.type];
  this.parentSystem = system;
  this.rootSystem = system.rootSystem;
  cons.call(this, options, system);
};

Component.prototype.types = {};

Component.prototype.maker = {};

Component.prototype.debug = function () {
  return false;
};

Component.prototype.getSettings = function () {
  if (this.parentSystem == this) {
    return this.getObject('settings', _.keys(this.objects['settings'])[0]) || {};
  } else if (this.parentSystem) {
    return this.parentSystem.getSettings();
  }
};

Component.prototype.getScene = function () {
  return this.rootSystem.getObject('scene', _.keys(this.objects['scene'])[0]);
};

Component.prototype.destroy = function () {
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

Component.prototype.addRenderMethod = function (funName, reference) {
  if (this.runsRender()) {
    this[funName] = reference;
  }
};

Component.prototype.toJSON = function () {
  return utils.deepCopy(this._options);
};

