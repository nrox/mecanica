Mecânica
========

- Mechanisms simulation with Javascript, for the browser and Node.

- 3D physics.

- Uses WebGL/Three.js and Bullet/Ammo.js

- Coherent axis system for constraints

- Dantzig and Progressive Gauss-Seidel solvers

- Objects definitions with json

[experiments/tests](https://nrox.github.io/mecanica/)

#Current state

Experimental, but working

#Usage

All you need is inside dist/ folder

##Creating and Saving, Controlling Simulation

###Initialization

    var lib = require('mecanica.js');

    var mec = new lib.Mecanica({type: 'empty'});

    //import required components to have it working
    mec.import('ware/settings/simple.js');
    mec.import('ware/scene/simple.js');
    mec.import('ware/light/simple.js');
    mec.import('ware/monitor/simple.js');

    //import a system, with id sys1
    mec.importSystem('ware/basic2.js', 'sys1');

    me.addToScene();

    me.start();

###Control

    // start stop simulation and rendering
    me.start();
    me.stop();

    //start/stop just simulation
    mec.startSimulation();
    mec.stopSimulation();

    //start/stop just rendering
    mec.startRender()
    mec.stopRender();

    //change simulation speed
    mec.setSpeed(speed);

###Insertion, removal

    var system = mec.importSystem('system/url.js','sys2', {option: ''});

    // var system = mec.getSystem('sys2');

    system.destroy();

###Saving

    var json = mec.toJSON();

###Finishing

    mec.destroy();

##Defining objects

In a .js file, or json object.

###Bodies, materials, constraints

    module.exports = json = {
      shape: {
        fixed: { type: 'sphere', r: 2, segments: 32 },
        satellite: { type: 'sphere', r: 1, segments: 16 }
      },
      material: {
        id3: {type: 'phong', color: 0x772244 },
        id4: {type: 'phong', color: 0x224477 }
      },
      body: {
        id5: { mass: 0, shape: 'fixed', material: 'id4',
          connector: {c1: {}}
        },
        id6: { mass: 1, shape: 'satellite', material: 'id3', position: {z: 3},
          connector: {c2: {base: {z: -3}}}
        }
      },
      constraint: {
        cons: {
          type:'point', a: 'c1', b: 'c2', bodyA: 'id5', bodyB: 'id6'
        }
      }
    };

    //if systemID is provided, the imported object will be added to a new system

    mec.import(json, systemID);//or mec.require(.js);

###Lights, camera, scene

    module.exports = json = {
      scene: {
        s1: {}
      },
      monitor: {
        cam: {camera: 'tracker', lookAt: 'id6', axis: {x: 1, y: 0.5, z: 0.3}, distance: 20, inertia: 5}
      },
      light: {
        l1: {type:'directional', color: 0xaaaaaa, position: {x: 5, y: 5, z: 5}}
      }
    };

    mec.import(json);


###Settings

    module.exports = json = {
      settings: {
        debug: {
          wireframe: true,
          webWorker: false
        },
        production: {
          wireframe: false,
          webWorker: true
        }
      }
    };

    mec.import(json); //or mec.require(.js);



