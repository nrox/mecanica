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
    'id', 'group', 'type', 'comment', 'lengthUnits', 'forceUnits'
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

Component.prototype.assertOneOf = function (key, values, allowAlso) {
  if ((arguments.length === 3) && (this[key] === allowAlso)) return;
  if (values.indexOf(this[key]) < 0) {
    var msg = 'in ' + this.id + '.' + key + ' = ' + this[key] + ' but should be one of' + utils.stringify(values);
    console.log(msg);
    throw new Error(msg);
  }
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
  try {
    cons.call(this, options, system);
  } catch (e) {
    console.log('...................');
    console.log('error in Component.construct ' + options.group + '.' + options.id + ':');
    console.log(e.message);
    console.log(options);
    console.log(this);
    console.log('...................');
    throw e;
  }
};

Component.prototype.isRoot = function () {
  return false;
};

Component.prototype.types = {};

Component.prototype.maker = {};

Component.prototype.debug = function () {
  return false;
};

Component.prototype.getSettings = function () {
  return this.globalSettings();
};

Component.prototype.globalSettings = function () {
  try {
    if (!this.rootSystem) return {};
    return this.rootSystem.getObject('settings', _.keys(this.rootSystem.objects['settings'])[0]) || {};
  } catch (e) {
    console.log('in globalSettings in ', this.group, this.id);
    console.log(e.message);
    throw e;
  }
};

Component.prototype.localSettings = function () {
  try {
    return this.parentSystem.getObject('settings', _.keys(this.parentSystem.objects['settings'])[0]) || {};
  } catch (e) {
    console.log('in globalSettings in ', this.group, this.id);
    console.log(e.message);
    throw e;
  }
};

Component.prototype.settingsFor = function (key) {
  var local = this.localSettings()[key];
  if (local !== undefined) {
    return local;
  } else {
    return this.globalSettings()[key];
  }
};

Component.prototype.getScene = function () {
  return this.rootSystem.getObject('scene', _.keys(this.objects['scene'])[0]);
};

Component.prototype.lengthConversionRate = function () {
  var globalUnit = this.globalSettings().lengthUnits;
  var localUnit = this.lengthUnits || this.localSettings().lengthUnits;
  if (localUnit === undefined) return 1;
  if (globalUnit === localUnit) return 1;
  var settingsInstance = this.globalSettings();
  return settingsInstance.availableLengthUnits[localUnit] / settingsInstance.availableLengthUnits[globalUnit];
};

Component.prototype.forceConversionRate = function () {
  var globalUnit = this.globalSettings().forceUnits;
  var localUnit = this.forceUnits || this.localSettings().forceUnits;
  if (localUnit === undefined) return 1;
  if (globalUnit === localUnit) return 1;
  var settingsInstance = this.globalSettings();
  return settingsInstance.availableForceUnits[localUnit] / settingsInstance.availableForceUnits[globalUnit];
};

Component.prototype.applyLengthConversionRate = function (target) {
  var rate = this.lengthConversionRate();
  if (rate == 1) return target;
  if (target instanceof Vector) return target.setScale(rate);
  if (typeof(target) === 'number') return target * rate;
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



