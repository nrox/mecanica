/**
 * director.js rules the simulation and renders the world/environment
 * it can build worlds defined in /ware/ folder.
 * see ware/basic.js example
 */

var memo = {};
var _ = require('lib/underscore.js');
var Ammo = require('lib/ammo.js');
var THREE = require('lib/three.js');
var utils = require('utils.js');
var factory = require('factory.js');

factory.addLibrary(THREE);





module.exports = {
  loadScene: loadScene,
  startRender: startRender,
  stopRender: stopRender,
  factory: factory
};