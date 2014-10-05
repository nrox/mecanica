'use strict';
/*
 Data representation of objects
 */
var _ = require('./lib/underscore.js');

var library = {
  ammo: undefined,
  three: undefined
};

var descriptionFormat = {
  //format
  group: {
    type: {
      extends: ['group', 'type'],
      parameters: {
        p1: 0, p2: 1, etc: 'default'
      },
      constructors: {
        library1: ['fun', 'etc', 'p2'],
        library2: ['fun', ['fun2', 'p1', 1]]
      }
    },
    type2: {
      extends: ['group', 'type'],
      parameters: {
        etc: 'overwritten'
      },
      constructors: {
        library1: ['fun', 'p1', 'p2', 'etc'],
        library3: ['fun3', 'p1']
      }
    }
  },
  group2: {
    type: {

    }
  }
};

var description = {
  physics: {
    position: {
      parameters: {
        x: 0, y: 0, z: 0
      },
      constructors: {
        ammo: ['btVector3', 'x', 'y', 'z'],
        three: ['Vector3', 'x', 'y', 'z']
      }
    },
    velocity: {
      extends: ['physics', 'position']
    }
  },
  //shapes
  shape: {
    sphere: {
      parameters: {
        r: 1
      },
      constructors: {
        ammo: ['btSphereShape', 'r'],
        three: ['SphereGeometry', 'r']
      }
    },
    box: {
      parameters: {
        dx: 1, dy: 1, dz: 1
      },
      constructors: {
        ammo: ['btBoxShape', ['btVector3', 'dx', 'dy', 'dz']],
        three: ['BoxGeometry', 'dx', 'dy', 'dz']
      }
    },
    cylinder: {
      parameters: {
        r: 1, dy: 1
      },
      constructors: {
        ammo: ['btCylinderShape', ['btVector3', 'r', 'dy', 'r']],
        three: ['CylinderGeometry', 'r', 'r', 'dy']
      }
    },
    cone: {
      parameters: {
        r: 1, dy: 1
      },
      constructors: {
        ammo: ['btConeShape', 'r', 'dy'],
        three: ['CylinderGeometry', 0, 'r', 'dy']
      }
    }
  },
  material: {
    basic: {
      parameters: {
        friction: 0.3,
        restitution: 0.2,
        color: 0x333333,
        opacity: 1,
        wireframe: false
      },
      constructors: {
        three: ['MeshBasicMaterial', 'parameters']
      }
    },
    phong: {
      extends: ['material', 'basic'],
      parameters: {
        emmissive: 0x000000
      },
      constructors: {
        three: ['MeshPhongMaterial','parameters']
      }
    }
  },
  body: {
    physics: {},
    shape: {},
    material: {}
  }
};

function ifEval(s) {
  try {
    eval(s);
    return true;
  } catch (e) {
    return false;
  }
}

function tryEval(s) {
  try {
    return eval(s);
  } catch (e) {
    return s;
  }
}


//create an instance using a list of arguments
var instantiateCache = [];
function instantiate(constructor, args) {
  args || (args = []);
  var expression = instantiateCache[args.length];
  if (!expression){
    var list = [];
    for (var i = 0; i < args.length; i++){
      list.push('args[' + i + ']');
    }
    expression = 'new constructor(' + list.join(',') + ');';
    instantiateCache[args.length] = expression;
  }
  return eval(expression);
}

//create an instance of an object, using the description
function construct(lib, list, parameters) {
  parameters || (parameters = {});
  var argumentsList = [];
  var arg;
  var fn;
  for (var i in list) {
    if (!list.hasOwnProperty(i)) continue;
    arg = list[i];
    //if its the first entry in the array, check if we can use it as a function
    if (i == 0) {
      if (typeof lib[arg] == 'function') {
        //if its a function in the library, use it to make an instance
        fn = lib[arg];
      } else if (lib[arg]) {
        //else if its a parameters, use the value
        argumentsList.push(lib[arg]);
      } else {
        //try using the environment value, or the literal string if fails
        argumentsList.push(tryEval(arg));
      }
    } else {
      switch (typeof arg) {
        //if its a number use as is
        case 'number':
          argumentsList.push(arg);
          break;
        case 'string':
          if (arg == 'parameters') {
            argumentsList.push(_.clone(parameters));
          } else if (parameters[arg] !== undefined) {
            //if its a string and is a parameters, use parameters value
            argumentsList.push(parameters[arg]);
          } else {
            //evaluate the value
            argumentsList.push(tryEval(arg));
          }
          break;
        case 'object':
          //when the arg is a list, use recursion
          argumentsList.push(construct(lib, arg, parameters));
          break;
        default:
          //numbers, undefined, boolean
          argumentsList.push(arg);
      }
    }
  }
  if (fn) {
    return instantiate(fn, argumentsList);
  } else {
    return argumentsList;
  }
}

function addLibrary(lib) {
  var checks = {
    three: ['Vector3'],
    ammo: ['btVector3']
  };
  lib = lib || {};
  _.each(checks, function (checkList, libName) {
    if (_.every(checkList, function (property) {
      return !!lib[property];
    })) {
      library[libName] = lib;
    }
  });
}

//extend an object using a description
function extendFromDescription(obj, group, type, parameters) {
  if (!description[group] || !description[group][type]){
    throw 'undefined description["' + group + '"]["' + type + '"]';
  }
  //if should extend from other description, do it first
  var ext = description[group][type].extends;
  if (ext) {
    extendFromDescription(obj, ext[0], ext[1], parameters);
  }
  //pick properties mentioned in the description
  var relevant = _.pick(parameters || {}, _.keys(description[group][type].parameters));
  //override default values
  parameters = _.extend(_.clone(description[group][type].parameters), relevant);
  //add this properties to the object
  _.extend(obj, parameters);
  //get the constructors
  var constructionLists = description[group][type].constructors || {};
  //for each library create the object and add it as a property with the library name as key
  for (var l in library) { //lib{ammo, three}
    if (library.hasOwnProperty(l) && library[l] && constructionLists[l])
      obj[l] = construct(library[l], constructionLists[l], parameters);
  }
}

function Shape(type, parameters) {
  extendFromDescription(this, 'shape', type, parameters);
}

function Material(type, parameters) {
  extendFromDescription(this, 'material', type, parameters);
}

module.exports = {
  addLibrary: addLibrary,
  description: description,
  construct: construct,
  Shape: Shape,
  Material: Material
};
