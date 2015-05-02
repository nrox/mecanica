/**
 * component.js
 * super class
 */


var _ = require('./lib/underscore.js');
var ammoHelper = require('./lib/ammo.js');
var utils = require('../dist/utils.js');

var UNDEFINED = undefined;
var RUNS_PHYSICS = true;
var RUNS_RENDER = utils.isBrowserWindow();

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

Component.prototype.runsPhysics = function () {
  if (this.rootSystem) return this.rootSystem.runsPhysics();
  return RUNS_PHYSICS;
};

Component.prototype.runsRender = function () {
  if (this.rootSystem) return this.rootSystem.runsRender();
  return RUNS_RENDER;
};

Component.prototype.runsInWorker = function () {
  return utils.isBrowserWorker();
};

Component.prototype.include = function (options, defaults) {
  var target = this;
  //target._originalOptions = options;
  options = _.extend(defaults, _.pick(options || {}, _.keys(defaults), [
    'id', 'group', 'type', 'debug', 'comment', 'lengthUnits'
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
    console.log('error in Component.construct ', utils.argList(arguments));
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

Component.prototype.CONVERSION = {
  LENGTH: {
    'm': 1,
    'dm': 0.1,
    'in': 0.0254,
    'cm': 0.01,
    'mm': 0.001
  },
  FORCE: {
    'N': 1,
    'Kg': 9.81
  },
  TORQUE: {
    'N.m': 1,
    'Kg.m': 9.81,
    'Kg.cm': 9.81 / 100,
    'N.cm': 0.01
  }
};

Component.prototype.conversionRate = function (type, settingsProperty) {
  //TODO memoize
  var globalUnit = this.globalSettings()[settingsProperty];
  var localUnit = this[settingsProperty] || this.localSettings()[settingsProperty];
  if (globalUnit === localUnit) return 1;
  if (localUnit === undefined) return 1; //FIXME search parent ?
  return this.CONVERSION[type][localUnit] / this.CONVERSION[type][globalUnit];
};

Component.prototype.applyConversionRate = function (type, settingsProperty, target, rate) {
  rate = rate || this.conversionRate(type, settingsProperty);
  if (rate == 1) return target;
  //vectors
  if (target instanceof Vector) return target.setScale(rate);
  //numbers
  if (typeof(target) === 'number') return target * rate;
  //this numeric properties
  if ((typeof(target) === 'string') && (typeof(this[target]) === 'number')) return this[target] *= rate;
  //an array of objects: works just with properties and vectors, not useful with numbers
  if (target instanceof Array) {
    for (var i = 0; i < target.length; i++) target[i] = this.applyConversionRate(null, null, target[i], rate);
    return target;
  }
  return target;
};

Component.prototype.applyLengthConversionRate = function (target, rate) {
  return this.applyConversionRate('LENGTH', 'lengthUnits', target, rate);
};

Component.prototype.applyForceConversionRate = function (target, rate) {
  return this.applyConversionRate('FORCE', 'forceUnits', target, rate);
};

Component.prototype.applyTorqueConversionRate = function (target, rate) {
  return this.applyConversionRate('TORQUE', 'torqueUnits', target, rate);
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
  var json = utils.deepCopy(this._options);
  delete json.id;
  delete json.group;
  return json;
};

Component.prototype.destroy = function () {
  try {
    if (this.ammo) Ammo.destroy(this.ammo);
  } catch (e) {
    console.log(this.group, this.id, e.message || e);
    throw e;
  }
};


