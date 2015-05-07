var _ = require('../../lib/underscore.js');
var defaultOptions = {
  opacity: 0.7,
  beamThickness: 0.4,
  longBeamLength: 6,
  shortBeamLength: 3,
  segmentMass: 0.1
};

var getObject = function (o) {
  _.defaults(o || {}, defaultOptions);

  var object = {
    shape: {
      vertical: {type: 'box', dy: o.longBeamLength, dx: o.beamThickness, dz: o.beamThickness},
      horizontal: {type: 'box', dy: o.beamThickness, dx: o.beamThickness, dz: o.longBeamLength}
    },
    material: {
      red: {color: 0x883333, opacity: o.opacity},
      green: {color: 0x338833, opacity: o.opacity},
      blue: {color: 0x333388, opacity: o.opacity},
      gray: {color: 0x666666, opacity: o.opacity}
    },
    body: {
      center: {shape: 'vertical', material: 'red', mass: 0}
    }
  };

  return object;
};


//module.exports.userInterface = userInterface;
module.exports.defaultOptions = defaultOptions;
module.exports.getObject = getObject;