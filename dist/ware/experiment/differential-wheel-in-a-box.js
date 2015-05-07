(function () {

  var _ = require('../../lib/underscore.js');
  var robot = require('../../ware/robot/differential.js');
  var box = require('../../ware/world/open-box.js');

  var defaultOptions = {
    bodyMass: 0.5,
    boxWidth: 100,
    boxHeight: 10
  };

  function getObject(options) {
    var o = _.defaults(options || {}, defaultOptions);
    var objects = {
      system: {
        box: box.getObject({
          width: o.boxWidth,
          depth: o.boxWidth,
          height: o.boxHeight,
          color: 0xaaeeee
        }),
        robot: robot.getObject({
          bodyMass: o.bodyMass, bodyLength: 5
        })
      }
    };
    return objects;
  }

  var userInterface = function (options) {
    options = _.defaults(options || {}, {
      system: undefined,
      container: 'body'
    });

    function make(dir) {
      return {type: 'range', min: -10, max: 10, step: 1,
        change: function () {
          var v = this.getValues()[dir];
          var c = this.rootSystem.getConstraint({
            id: dir,
            system: [options.system, 'robot']
          });
          c.enable(v)
        }
      };
    }

    var interval;
    return {
      values: {
        demo: function () {
          var _this = this;

          function randomVelocities() {
            _.each(['left', 'right'], function (dir) {
              var c = _this.rootSystem.getConstraint({
                id: dir,
                system: [options.system, 'robot']
              });
              c.enable(10 * 2 * (Math.random() - 0.5));
            });
          }

          if (!interval) {
            randomVelocities();
            interval = setInterval(randomVelocities, 3000);
          } else {
            clearInterval(interval);
          }
        },
        left: 0,
        right: 0
      },
      template: {
        left: make('left'), right: make('right')
      },
      container: options.container
    };

  };

  module.exports.userInterface = userInterface;
  module.exports.defaultOptions = defaultOptions;
  module.exports.getObject = getObject;

})();




