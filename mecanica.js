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


/**
 * system.js
 *
 */

function System() {

}

/**
 * arguments for this function are keys leading to the deep nested element in object
 * we want to retrieve (by reference)
 * example0: getObject()
 * return all objects
 * example1: getObject('body')
 * return a map with all bodies
 * example2: getObject('body','bodyId1')
 * return body with id bodyId1
 * example3: getObject('body','bodyId1', 'connector', 'connectorId1')
 * return connector with id connectorId1 in body with id bodyId1
 * @returns {*}
 */
System.prototype.getObject = function () {
  if (arguments[0] instanceof Array) {
    return this.getObject.apply(this, arguments[0]);
  }
  var obj = this.objects;
  for (var i = 0; i < arguments.length; i++) {
    obj = obj[arguments[i]];
    if (!obj) break;
  }
  return obj;
};

/**
 * create objects using templates in constructor
 * usage:
 * make(group, type, options)
 * make(group, options) //options should have a type property
 * make(options) //options should have a group and type properties
 * example:
 * make('shape','box',{dx: 2, dy: 4, dz:3}) will return a box with those dimensions
 * make({group:'shape', type:'box', dx: 2, dy: 4, dz:3}) returns an identical object
 * @returns {object}
 */
System.prototype.make = function () {
  var group, type, options;
  switch (arguments.length) {
    case 3:
      options = arguments[2];
      group = arguments[0];
      type = arguments[1];
      break;
    case 2:
      options = arguments[1];
      group = arguments[0];
      type = options.type;
      break;
    case 1:
      options = arguments[0];
      group = options.group;
      type = options.type;
      break;
  }
  if (!group) {
    console.log('make', arguments);
    console.error('group is not defined');
    return undefined;
  }
  type = constructor[group][type] && type || '_default';
  var cons = constructor[group] && constructor[group][type];
  var obj;
  if (typeof cons == 'function') {
    if (typeof(options) != 'object') options = {};
    if (!options.id) options.id = nextId(type);
    obj = new cons(options, this);
    if (group !== SYSTEM) obj.group = group;
    if (group !== SYSTEM) obj.type = type;
    if (!options._dontSave && this.objects[group]) this.objects[group][obj.id] = obj;
    debug && console.log('make ' + group + '.' + type + ' ' + JSON.stringify(opt(obj)));
  } else {
    console.warn('incapable of making object:');
    console.log(JSON.stringify(arguments));
  }
  return obj;
};

