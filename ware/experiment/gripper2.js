var _ = require('../../lib/underscore.js');
var utils = require('../../util/utils.js');

var defaultOptions = {
  fingerRadius: 0.5,
  fingerHeight: 3,
  handHeight: 1,
  handDepth: 2,
  distance: 3
};

function getObject(options) {
  var o = _.defaults(options || {}, defaultOptions);
  var finger = {
    type: 'imported',
    url: '../../ware/experiment/finger.js',
    position: {x: -o.distance / 2},
    importOptions: {r: o.fingerRadius, tip: 2 * o.fingerHeight / 3, base: o.fingerHeight / 3}
  };
  var objects = {
      shape: {
        hand: { type: 'box', dx: o.distance + 2 * o.fingerRadius, dy: o.handHeight, dz: o.handDepth}
      },
      material: {
        hand: {type: 'phong', color: 0x337722 }
      },
      body: {
        hand: {position: {y: -o.handHeight / 2}, mass: 0, shape: 'hand', material: 'hand',
          connector: {
            left: {base: {x: -o.distance / 2, y: o.handHeight / 2}},
            center: {base: {x: 0, y: o.handHeight / 2}},
            right: {base: {x: o.distance / 2, y: o.handHeight / 2}}
          }
        }
      },
      system: {
        left: _.extend(utils.deepCopy(finger), {position: {x: -o.distance / 2}}),
        center: _.extend(utils.deepCopy(finger), {position: {x: 0}}),
        right: _.extend(utils.deepCopy(finger), {position: {x: o.distance / 2}})
      },
      constraint: {
      }
    }
    ;
  return objects;
}


module.exports.defaultOptions = defaultOptions;
module.exports.getObject = getObject;


