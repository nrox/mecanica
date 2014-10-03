'use strict';

var Ammo = require('./lib/ammo.js');
var _ = require('./lib/underscore.js');
var description = require('./factory.js');

function send(data){

}

function Simulator(params){

  var collisionConfiguration = new Ammo.btDefaultCollisionConfiguration();
  var dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration);
  var solver = new Ammo.btSequentialImpulseConstraintSolver();
  var broadphase = new Ammo.btDbvtBroadphase();

  this.world = new Ammo.btDiscreteDynamicsWorld(dispatcher, broadphase, solver, collisionConfiguration);

  var fixedTimeStep = params.fixedTimeStep;
  var rateLimit = params.rateLimit;

  send({ cmd: 'worldReady' });
}

_.extend(Simulator.prototype, {
  add: function(desc){

  },
  remove: function(desc){

  }
});


//tools

//communication

//shapes

//constraints

//simulation


module.exports = Simulator;