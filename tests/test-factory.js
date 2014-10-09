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
  'unpack': function () {
    utils.checkKeys(factory, ['unpack'], 'factory.unpack')
  },
  'include' : function(){
    var defaults = {a:1, b:2, c:3, e:4};
    var options = {a:9, b:8, d:1, e:undefined, g:3};
    var target = {a:3, e: 1, f:3, g:4};
    factory.include(target, options, defaults);
    utils.checkValues(target, {
      a:9, //from options
      b:8, //from options
      c:3, //from defaults
      d: undefined, //does not exist in defaults
      e:undefined, //overwritten from options, though undefined
      f:3, //already there in target, not in defaults or options
      g: 4 //is not overwritten by options because its not in defaults
    }, 'include results');
  },
  'shape.box': function () {
    var options = {dx: 4, dy: 3, dz: 6};
    var titlePrefix = 'shape.box';
    var obj = factory.make('shape', 'box', options);
    utils.checkValues(obj, options, titlePrefix + ' property values');
    utils.checkKeys(obj.ammo, ['setLocalScaling', 'calculateLocalInertia'], titlePrefix + '.ammo keys');
    utils.checkKeys(obj.three, ['vertices', 'boundingBox'], titlePrefix + '.three keys');
    utils.instanceOf(obj.ammo, Ammo.btBoxShape, titlePrefix + '.ammo is btBoxShape');
    utils.instanceOf(obj.three, THREE.BoxGeometry, titlePrefix + '.three is BoxGeometry');
  },
  'physics.velocity': function () {
    var pars = {x: 4, y: 3, z: 1.1};
    var titlePrefix = 'physics.velocity';
    var obj = factory.make('physics', 'velocity', pars);
    utils.checkValues(obj, pars, titlePrefix + ' property values');
    utils.checkKeys(obj.ammo, ['x', 'y', 'z'], titlePrefix + '.ammo keys');
    utils.checkKeys(obj.three, ['x', 'y', 'z'], titlePrefix + '.three keys');
    utils.instanceOf(obj.ammo, Ammo.btVector3, titlePrefix + '.ammo is btVector3');
    utils.instanceOf(obj.three, THREE.Vector3, titlePrefix + '.three is Vector3');
  },
  'material.phong': function () {
    var pars = {color: utils.randomColor(), friction: 0.12, restitution: 0.11};
    var titlePrefix = 'material.phong';
    var obj = factory.make('material', 'phong', pars);
    utils.checkValues(obj, pars, titlePrefix + ' property values');
    utils.checkKeys(obj.three, ['color', 'ambient', 'specular', 'metal'], titlePrefix + '.three keys');
    utils.instanceOf(obj.three, THREE.MeshPhongMaterial, titlePrefix + '.three is MeshPhongMaterial');
  },
  'scructure': function () {
    console.log('\n\n', 'structure');
    console.log(JSON.stringify(factory.structure(), null, '  '));
  }
};

test.all = utils.all(test);
utils.run(test, process.argv, __filename);

