function System(options, system) {
  this.objects = {
    shape: {}, //sphere, box, cylinder, cone ...
    material: {}, //basic, phong, lambert ? ...
    body: {}, //shape + mesh
    system: {}, //high level structure of objects, identified by keys
    constraint: {}, //point, slider, hinge ...
    method: {} //methods available to the system
  };
  this.construct(options, system, 'basic');
}

System.prototype.types = {
  //base and axis are specified in local coordinates
  basic: function (options) {
    this.include(options, {});
    this.load(options);
  },
  imported: function (options) {
    this.include(options, {
      url: undefined,
      position: {},
      rotation: {},
      importOptions: {}
    });
    this.notifyUndefined(['url']);
    this.position = new Vector(options.position);
    this.quaternion = new Quaternion(options.rotation);
    this.import(this.url, this.importOptions);
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
  //TODO make this recursive
  var obj = this.objects;
  for (var i = 0; i < arguments.length; i++) {
    if ((obj instanceof System) || (obj instanceof Mecanica)) {
      obj = obj.objects[arguments[i]];
    } else {
      obj = obj[arguments[i]];
    }
    if (!obj) break;
  }
  return obj;
};

System.prototype.getSome = function (group) {
  var obj = this.getObject(group);
  return obj[_.keys(obj)[0]];
};

System.prototype.getSystem = function (id) {
  return this.getObject('system', id);
};

System.prototype.getBody = function (id) {
  var sys = this;
  if ((typeof id == 'object') && id.system && id.body) {
    for (var i = 0; i < id.system.length; i++) {
      sys = sys.getSystem(id.system[i]);
    }
    id = id.body;
  }
  return sys.getObject('body', id);
};

System.prototype.getConstraint = function (id) {
  return this.getObject('constraint', id);
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
  //type = type || '_default';
  var cons = this.maker[group];
  var obj;
  if (typeof cons == 'function') {
    if (typeof(options) != 'object') options = {};
    if (!options.id) options.id = this.nextId(type);
    options.group = group;
    options.type = type;
    obj = new cons(options, this);
    if (!options._dontSave && this.objects[group]) {
      if (this.objects[group][obj.id]) throw group + '.' + obj.id + ' already exists';
      this.objects[group][obj.id] = obj;
    }
    this.debug() && console.log('make ' + group + '.' + type + ' ' + JSON.stringify(obj.options()));
  } else {
    console.warn('incapable of making object:');
    console.log(JSON.stringify(arguments));
  }
  return obj;
};


System.prototype.import = function (url, options) {
  try {
    var json = require(url).getObject(options);
    this.load(json);
  } catch (e) {
    console.log('System.import: ' + url);
    console.error(e);
  }
};

System.prototype.load = function (json) {
  var _this = this;
  _.each(_this.objects, function (groupObject, groupName) {
    groupObject = json[groupName];
    _.each(groupObject, function (objectOptions, objectId) {
      objectOptions.id = objectId;
      _this.make(groupName, objectOptions);
    });
  });
};

System.prototype.importSystem = function (url, id, options) {
  try {
    console.log('System.importSystem: ' + id + ' @ ' + url);
    var json = require(url).getObject(options);
    return this.loadSystem(json, id);
  } catch (e) {
    console.error(e);
  }
};

System.prototype.loadSystem = function (json, id) {
  try {
    json = json || {};
    json.id = id;
    return this.make('system', json);
  } catch (e) {
    console.log('System.loadSystem: ' + id);
    console.error(e);
  }
};

System.prototype.destroy = function (scene) {
  if (!scene) scene = this.rootSystem.getScene();
  _.each(this.objects, function (groupObjects, groupName) {
    _.each(groupObjects, function (obj, key) {
      obj.destroy(scene);
      delete groupObjects[key];
    });
  });
  delete this.parentSystem.objects['system'][this.id];
};

System.prototype.addToScene = function (scene) {
  if (!scene) scene = this.rootSystem.getScene();
  _.each(this.objects.system, function (sys) {
    sys.addToScene(scene);
  });
  _.each(this.objects.body, function (body) {
    body.addToScene(scene);
  });
  _.each(this.objects.constraint, function (cons) {
    cons.addToScene(scene);
  });
};

System.prototype.syncPhysics = function () {
  //sync all bodies
  _.each(this.objects.body, function (body) {
    body.syncPhysics();
  });
  //and all child systems
  _.each(this.objects.system, function (system) {
    system.syncPhysics();
  });
};

System.prototype.toJSON = function () {
  var json = {};
  _.each(this.objects, function (groupObjects, groupName) {
    _.each(groupObjects, function (object, objectId) {
      if (!json[groupName]) json[groupName] = {};
      json[groupName][objectId] = object.toJSON();
    });
  });
  return json;
};

/**
 * update myPack with all subsystems and bodies position and rotation
 * @param myPack
 */
System.prototype.packPhysics = function (myPack) {

  //for each body
  if (!myPack.body) myPack.body = {};
  _.each(this.objects.body, function (body, id) {
    if (!myPack.body[id]) myPack.body[id] = {};
    body.packPhysics(myPack.body[id]);
  });

  //for each child system
  if (!myPack.system) myPack.system = {};
  _.each(this.objects.system, function (sys, id) {
    if (!myPack.system[id]) myPack.system[id] = {};
    sys.packPhysics(myPack.system[id]);
  });
};

System.prototype.callBeforeStep = function () {
  _.each(this.objects.constraint, function (c) {
    if (c.beforeStep) {
      c.beforeStep();
    }
  });
  _.each(this.objects.system, function (s) {
    s.callBeforeStep();
  })
};

extend(System, Component);
Component.prototype.maker.system = System;