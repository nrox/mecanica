Mecânica
========

- Mechanisms simulation with Javascript, for the browser and Node.

- 3D physics.

- Uses WebGL/Three.js and Bullet/Ammo.js

- Coherent axis system for constraints

- Dantzig and Progressive Gauss-Seidel solvers

- Objects definitions with json

#Current state

Experimental. [See available tests and experiments](https://nrox.github.io/mecanica/)

#Quickstart

##Basics
    var lib = require('./dist/mecanica.js');

    var me = new lib.Mecanica({useDefaults: true});

    me.importSystem('./dist/ware/template/template.js', 'id');

    me.addToScene();

    me.start();

##Control

    // start stop simulation and rendering
    me.start();

    me.stop();

    //change simulation speed
    me.setSpeed(speed);

##Insertion, removal

    var system = me.importSystem('system/url.js','sys2', {option: ''});

    //or
    //var system = me.getSystem('sys2');

    system.destroy();

    //destroy all
    me.destroy();

##Saving

    var utils = require('./dist/utils.js');

    var json = me.toJSON();

    console.log(utils.stringify(json));

##Defining objects in files

In this way we define modules, which can be reused inside other modules. See inside dist/ware/experiments: finger.js, hand.js and hand2.js.

In a .js file, or json object.


    module.exports.getObject = function(options) {
        var position = options.position || 10;
        return  {
          shape: {
            fixed: { type: 'sphere', r: 2, segments: 32 },
            satellite: { type: 'sphere', r: 1, segments: 16 }
          },
          material: {
            red: {type: 'phong', color: 0x772244 },
            blue: {type: 'phong', color: 0x224477 }
          },
          body: {
            fixed: { mass: 0, shape: 'fixed', material: 'red',
              connector: {c1: {}}
            },
            satellite: { mass: 1, shape: 'satellite', material: 'blue', position: {z: position},
              connector: {c2: {base: {z: -3}}}
            }
          },
          constraint: {
            cons: {
              type:'point', bodyA: 'fixed', bodyB: 'satellite', connectorA: 'c1', connectorB: 'c2'
            }
          }
        };
    };

Then do

    me.stop();

    me.importSystem('./path/to/file.js', 'Id', {position: 20});

    me.addToScene();

    me.start();

Or

    me.stop();

    var mod = require('./path/to/file.js');
    var json = mod.getObject({position: 20});
    mw.loadSystem(json, 'Id');

    me.addToScene();

    me.start();

#TODO

- validator for json objects
- tune servos and motors
- use cm as default measure unit