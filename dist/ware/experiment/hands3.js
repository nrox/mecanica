var _ = require('../../lib/underscore.js');
var utils = require('../../utils.js');
var handData = require('../../ware/experiment/hand.js');

var defaultOptions = {
  distance: 4
};

function getObject(options) {
  var o = _.defaults(options || {}, defaultOptions);
  var hand = function (angle) {
    var x = Math.sin(angle);
    var z = Math.cos(angle);
    return {
      type: 'loaded',
      position: {x: x * o.distance, z: z * o.distance},
      rotation: {y: angle + Math.PI / 2},
      json: handData.getObject()
    };
  };
  var objects = {
    rotation: {x: Math.PI / 6, y: Math.PI / 4},
    position: {y: -1},
    system: {
      left: hand(-2 * Math.PI / 3),
      center: hand(0),
      right: hand(2 * Math.PI / 3)
    }
  };
  return objects;
}


function userInterface(options) {
  options = _.defaults(options || {}, {
    system: undefined,
    container: 'body'
  });
  var uiOptions = {
    values: {
      'start demo': function () {
        var par = {
          left: {
            tilt: 3.65,
            pan: 1
          },
          right: {
            tilt: 2.2,
            pan: 2
          },
          center: {
            tilt: 2.5,
            pan: 2.1
          }
        };
        var sys = this.rootSystem.getSystem(options.system);
        var _this = this;
        this._timeout = setInterval(function () {
          var time = utils.time() / 1000.0;
          _.each(['left', 'center', 'right'], function (finger) {
            var fin = sys.getSystem(finger);
            if (!fin) {
              clearTimeout(_this._timeout);
              return;
            }
            _.each(['left', 'center', 'right'], function (fingerChild) {
              var finChild = fin.getSystem(fingerChild);

              finChild.setAngle(Math.sin(2 * Math.PI * time / par[fingerChild].tilt));
              fin[fingerChild + 'Pan'](Math.sin(Math.PI * time / par[fingerChild].pan));
            });
          });
        }, 100);
      },
      'stop demo': function () {
        clearTimeout(this._timeout);
      }
    },
    template: {},
    container: options.container
  };

  return uiOptions;
}

module.exports.userInterface = userInterface;
module.exports.defaultOptions = defaultOptions;
module.exports.getObject = getObject;


