var _ = require('../../lib/underscore.js');
var pendulum = require('../../ware/experiment/double-pendulum.js');

var defaultOptions = pendulum.defaultOptions;

function getObject(options) {
  var o = _.defaults(options || {}, defaultOptions);
  console.info('Here we see what a chaotic system is.', 'Original positions are the same but systems diverge.');
  var objects = {
    system: {
      left: _.extend(pendulum.getObject(o), {position: {x: -2}}),
      center: _.extend(pendulum.getObject(o), {position: {x: 0}}),
      right: _.extend(pendulum.getObject(o), {position: {x: +2}})
    }
  };
  return objects;
}

module.exports.defaultOptions = defaultOptions;
module.exports.getObject = getObject;


