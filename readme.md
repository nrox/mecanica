Mecânica
========

Mechanism simulation with Ammo.js and THREE.js.

[experiments/interactive tests](https://nrox.github.io/mecanica/)

#Current state

Alpha

#Supported Features

##Simulation control

* speed
* step frequency

##Actuators

* Rotational motors
* Servos, with angle feedback
* Linear Motors, with position feedback

##Sensors

* ?

##Constraints

* Point
* Fixed
* Slider
* Hinge

##Bodies

* Sphere
* Box
* Cylinder
* Cone
* Composites

##Materials

* THREE.js supported materials


#Usage: How it should work

##Creating and Saving, Controlling Simulation

###Initialization

    var world = new Mecanica.World({
        worker: true, //use web worker
        server: false, //run simulation in server side
        browser: true //render objects with three.js scene and webgl canvas
    });

    //several ways to import objects
    world.importLocal('scenario.js');
    world.importURL('http://robots.com/hexapode.js');
    world.importFromRemoteDatabase({});
    world.importObject({});

    //create object from json to three.js or ammo.js
    world.build();

    //activate simulation and/or rendering
    world.startSimulation({});
    world.startRendering({});

###Control

    world.pauseSimulation();
    world.pauseRendering();
    world.continueSimulation();
    world.continueRendering();

    world.setSpeed(speed);

###Insertion, removal

    world.insert({...});
    world.remove({});

###Saving

    #in object form
    var json = world.toJSON({});

    #to some database
    world.saveToRemoteDatabase({});

###Finishing

    world.destroy();

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
    //if not, it will be added in the current, top level system,
    // overriding bodies, materials and shapes with colliding ids

    world.import(json, systemID);//or world.require(.js);

###Lights, camera

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

    world.import(json);//or world.require(.js);
    world.useScene('s1'); //just 1 scene
    world.useMonitor('s1'); //just 1 monitor at each time, previous id disabled
    world.useLight('l1'); //several lights possible

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

    //applying to the world
    world.import(json); //or world.require(.js);
    world.useSettings('debug'); //override current settings with the new ones


#TODO

* implement proper usage

* allow joining and removing systems (collections of bodies and constraints)

* properly dispose/destroy objects, check memory leaks

* add heightfield shape for ground shapes

* experiment with soft bodies

* add convex shapes

* fix worker tests

* make default material and lights look nice
