/**
 * Test ammo.js library
 * @type {exports}
 */

var utils = require('./test-utils.js');
var Ammo = require('../lib/ammo.js');
var THREE = require('../lib/three.js');
var factory = require('../factory.js');
var _ = require('../lib/underscore.js');

factory.addLibrary(Ammo);
factory.addLibrary(THREE);

var test = {
  'shape.box': function () {
    var obj = {};
    var pars = {dx: 4, dy: 3, dz: 6};
    var titlePrefix = 'shape.box';
    factory.extendFromDescription(obj, 'shape', 'box', pars);
    utils.checkValues(obj, pars, titlePrefix + ' property values');
    utils.checkKeys(obj.ammo, ['setLocalScaling', 'calculateLocalInertia'], titlePrefix + '.ammo keys');
    utils.checkKeys(obj.three, ['vertices', 'boundingBox'], titlePrefix + '.three keys');
    utils.instanceOf(obj.ammo, Ammo.btBoxShape, titlePrefix + '.ammo is btBoxShape');
    utils.instanceOf(obj.three, THREE.BoxGeometry, titlePrefix + '.three is BoxGeometry');
  },
  'physics.velocity': function () {
    var obj = {};
    var pars = {x: 4, y: 3, dz: 1};
    var titlePrefix = 'physics.velocity';
    factory.extendFromDescription(obj, 'physics', 'velocity', pars);
    utils.checkValues(obj, pars, titlePrefix + ' property values');
    utils.checkKeys(obj.ammo, ['x', 'y', 'z'], titlePrefix + '.ammo keys');
    utils.checkKeys(obj.three, ['x', 'y', 'z'], titlePrefix + '.three keys');
    utils.instanceOf(obj.ammo, Ammo.btVector3, titlePrefix + '.ammo is btVector3');
    utils.instanceOf(obj.three, THREE.Vector3, titlePrefix + '.three is Vector3');
  },
  'material.phong': function () {
    var obj = {};
    var pars = {color: utils.randomColor(), friction: 0.12, restitution: 0.11};
    var titlePrefix = 'material.phong';
    factory.extendFromDescription(obj, 'material', 'phong', pars);
    utils.checkValues(obj, pars, titlePrefix + ' property values');
    utils.checkKeys(obj.three, ['color', 'ambient', 'specular','metal'], titlePrefix + '.three keys');
    utils.instanceOf(obj.three, THREE.MeshPhongMaterial, titlePrefix + '.three is MeshPhongMaterial');
  }
};

test.all = utils.all(test);
utils.run(test, process.argv, __filename);

