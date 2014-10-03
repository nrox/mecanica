/*
 Data representation of objects
 */
var _ = require('./lib/underscore.js');

var library = {
  ammo: undefined,
  three: undefined
};

var description = {
  physics: {
    //position x,y,z and as an array
    x: 0, y: 0, z: 0,
    position: [0, 0, 0],
    //velocity in each coordinate and as array
    vx: 1, vy: 1, vz: 1,
    velocity: [0, 0, 0]
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
    friction: 0.1,
    restitution: 0.1,
    color: 333333, //hex
    opacity: 1,
    type: {
      phong: {

      }
    }
  },
  body: {
    physics: {},
    shape: {},
    material: {}
  }
};

//create an instance using a list of arguments
function instantiate(constructor, args) {
  //http://stackoverflow.com/questions/1606797/use-of-apply-with-new-operator-is-this-possible
  function F() {
    return constructor.apply(this, args);
  }

  F.prototype = constructor.prototype;
  return new F();
}

//create an instance of an object, using the description
function construct(lib, list, desc) {
  var args = [];
  var arg;
  var s;
  var fn;
  for (var i in list) {
    if (!list.hasOwnProperty(i)) continue;
    arg = list[i];
    if (i == 0) {
      fn = lib[arg];
      continue;
    }
    switch (typeof arg) {
      case 'number':
        args.push(arg);
        break;
      case 'string':
        if (desc[arg] !== undefined) {
          args.push(desc[arg]);
        } else {
          args.push(arg);
        }
        break;
      case 'object':
        args.push(construct(lib, arg, desc));
        break;
      default:
        args.push(arg);
    }
  }
  return instantiate(fn, args);
}

function addLibrary(lib) {
  var checks = {
    three: ['Vector3'],
    ammo: ['btVector3']
  };
  lib = lib | {};
  _.map(checks, function (checkList, libName) {
    if (_.every(checkList, function (property) {
       return !!lib[property];
    })) {
      library[libName] = lib;
    }
  });
}

//extend an object using a description
function extendFromDescription(obj, group, type, parameters) {
  parameters = _.extend(_.clone(description[group][type].parameters), parameters || {});
  _.extend(obj, parameters);
  var constructionLists = description[group][type].constructors || {};
  for (var l in library) { //lib{ammo, three}
    if (library.hasOwnProperty(l) && library[l] && constructionLists[l])
      obj[l] = construct(library[l], constructionLists[l], parameters);
  }
}

function Shape(type, parameters) {
  var group, obj;
  extendFromDescription(obj = this, group = 'shape', type, parameters);
}

module.exports = {
  addLibrary: addLibrary,
  description: description,
  construct: construct,
  Shape: Shape
};
