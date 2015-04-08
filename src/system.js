/**
 * system.js
 *
 */

function System(options, system) {
  this.construct(options, system, 'basic');
}

System.prototype.types = {
  //base and axis are specified in local coordinates
  basic: function (options) {
    this.include(options, {});
    this.objects = {
      shape: {}, //sphere, box, cylinder, cone ...
      material: {}, //basic, phong, lambert ? ...
      body: {}, //shape + mesh
      connector: {}, //this should not be here! it should be accessed and destroyed within the body
      system: {}, //high level structure of objects, identified by keys
      constraint: {}, //point, slider, hinge ...
      method: {} //methods available to the system
    };
  }
};

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
  type = type || '_default';
  var cons = this.maker[group];
  var obj;
  if (typeof cons == 'function') {
    if (typeof(options) != 'object') options = {};
    if (!options.id) options.id = this.nextId(type);
    options.group = group;
    options.type = type;
    obj = new cons(options, this);
    if (!options._dontSave && this.objects[group]) this.objects[group][obj.id] = obj;
    this.debug() && console.log('make ' + group + '.' + type + ' ' + JSON.stringify(obj.options()));
  } else {
    console.warn('incapable of making object:');
    console.log(JSON.stringify(arguments));
  }
  return obj;
};

System.prototype.loadJSON = function (json) {
  var _this = this;
  _.each(_this.objects, function (groupObject, groupName) {
    groupObject = json[groupName];
    _.each(groupObject, function (objectOptions, objectId) {
      objectOptions.id = objectId;
      _this.make(groupName, objectOptions);
    });
  });

  var scene = this.getScene();

  loadSystem(this.objects);

  function loadSystem(objs) {
    _.each(objs.system, loadSystem);
    _.each(objs.body, function (body) {
      if (!body._added && (body._added = true)) {
        body.updateMotionState();
        if (_this.runsWebGL()) scene.three.add(body.three);
        if (_this.runsPhysics()) scene.ammo.addRigidBody(body.ammo);
      }
    });
    _.each(objs.constraint, function (cons) {
      cons.add();
    });
  }
};

extend(System, Component);
Component.prototype.maker.system = System;

