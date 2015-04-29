function System(options, system) {
  this.objects = {
    settings: {},
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
    this.include(options, {
      position: undefined,
      rotation: undefined
    });
    this.buildSystemPosition(options);
    this.load(options);
  },
  imported: function (options) {
    this.include(options, {
      url: undefined,
      position: undefined,
      rotation: undefined,
      importOptions: {}
    });
    this.notifyUndefined(['url']);
    this.buildSystemPosition(options);
    this.import(this.url, this.importOptions);
  },
  loaded: function (options) {
    this.include(options, {
      position: undefined,
      rotation: undefined,
      json: {}
    });
    this.buildSystemPosition(options);
    this.load(this.json);
  }
};

System.prototype.buildSystemPosition = function (options) {
  if (this.runsPhysics() && (this.rotation || this.position)) {
    this.quaternion = new Quaternion(this.rotation || this.quaternion || {w: 1});
    this.position = new Vector(options.position || {});
    //TODO check if this should be done with reference to local settings not from parent
    this.applyLengthConversionRate(this.position);
    this.ammoTransform = new Ammo.btTransform(this.quaternion.ammo, this.position.ammo);
  }
};

System.prototype.applyTransform = function (ammoTransform) {
  //FIXME: not working properly, just works for 1 level
  if (this.isRoot() || !this.ammoTransform) return;
  ammoTransform.mult(this.ammoTransform, ammoTransform);
  this.parentSystem.applyTransform(ammoTransform);
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
  try {
    var arg0 = arguments[0];
    if (arg0 instanceof Array) {
      return this.getObject.apply(this, arg0);
    }
    if ((typeof arg0 == 'object') && arg0.group && arg0.id) {
      var sys = this;
      if (arg0.system) {
        if (typeof arg0.system == 'string') arg0.system = [arg0.system];
        for (var s = 0; s < arg0.system.length; s++) {
          sys = sys.getSystem(arg0.system[s]);
        }
      }
      return sys.getObject(arg0.group, arg0.id);
    }
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
  } catch (e) {
    console.log('error in system.', this.id, '.geObject with arguments', arguments);
    throw e;
  }
};

System.prototype.getSome = function (group) {
  var obj = this.getObject(group);
  return obj[_.keys(obj)[0]];
};

System.prototype.getSystem = function (id) {
  if (id == '.') return this;
  if (id == '..') return this.parentSystem;
  return this.getObject('system', id);
};

System.prototype.getBody = function (idOrMap) {
  return this.getObjectOfGroup('body', idOrMap);
};

System.prototype.getConstraint = function (idOrMap) {
  return this.getObjectOfGroup('constraint', idOrMap);
};

System.prototype.getObjectOfGroup = function (group, idOrMap) {
  if (typeof idOrMap == 'string') {
    idOrMap = {id: idOrMap};
  }
  idOrMap.group = group;
  idOrMap.system = idOrMap.system || [];
  return this.getObject(idOrMap);
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
  var cons = this.maker[group];
  var obj;
  if (typeof cons == 'function') {
    if (typeof(options) != 'object') options = {};
    if (!options.id) options.id = this.nextId(type);
    options.group = group;
    options.type = type;
    if (options.skip) {
      if (this.debug) console.warn('skip', group, options.id);
      return undefined;
    } else {
      if (this.debug) console.log('make ', group, options.id);
    }
    try {
      obj = new cons(options, this);
      if (!options._dontSave && this.objects[group]) {
        if (this.objects[group][obj.id]) throw group + '.' + obj.id + ' already exists';
        this.objects[group][obj.id] = obj;
      }
    } catch (e) {
      console.log(e.message);
      console.log('in system', this.id, '    during make ', group, options.id, '   with options:');
      console.log(options);
      throw e;
    }
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
    console.log('in System.import: ' + url);
    console.log(e.message);
    throw e;
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
    console.log('in System.importSystem: ' + id + ' @ ' + url);
    console.log(e.message);
    throw e;
  }
};

System.prototype.loadSystem = function (json, id) {
  try {
    json = json || {};
    json.id = id;
    return this.make('system', json);
  } catch (e) {
    console.log('in System.loadSystem: ' + id);
    console.log(e.message);
    throw e;
  }
};

System.prototype.destroy = function (scene) {
  if (!scene) scene = this.rootSystem.getScene();
  _.each(_.keys(this.objects).reverse(), function (groupName) {
    var groupObjects = this.objects[groupName];
    _.each(groupObjects, function (obj, key) {
      obj.destroy(scene);
      delete groupObjects[key];
    });
  }, this);
  try {
    if (this.ammoTransform) {
      Ammo.destroy(this.ammoTransform);
      delete this.ammoTransform;
    }
    if (!this.isRoot()) {
      delete this.parentSystem.objects['system'][this.id];
    }
  } catch (e) {
    console.log(this.group, this.id, e.message || e);
    throw e;
  }
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
  //no need to set position and rotation as the system is already transformed
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

System.prototype.unpackPhysics = function (myPack) {

  _.each(this.objects.body, function (body, id) {
    body.unpackPhysics(myPack.body[id]);
  });

  _.each(this.objects.system, function (sys, id) {
    sys.unpackPhysics(myPack.system[id]);
  });
};

System.prototype.callBeforeStep = function () {
  _.each(this.objects.system, function (s) {
    s.callBeforeStep();
  });
  _.each(this.objects.constraint, function (c) {
    if (c.beforeStep) {
      c.beforeStep();
    }
  });
  if (this.beforeStep) {
    this.beforeStep();
  }
};

System.prototype.callAfterStep = function () {
  _.each(this.objects.system, function (s) {
    s.callAfterStep();
  });
  _.each(this.objects.constraint, function (c) {
    if (c.afterStep) {
      c.afterStep();
    }
  });
  if (this.afterStep) {
    this.afterStep();
  }
};

extend(System, Component);
Component.prototype.maker.system = System;