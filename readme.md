Mecânica
========

mechanism simulation with ammo.js and three.js

current state: _unusable/broken_

[gh-pages](https://nrox.github.io/mecanica/)

#usage

First Define the scene/world in a json object. Save it to the /ware folder. Call is for example

    /ware/world.js

##browser + web worker

Include require.js

    <script src='require.js'></script>

Load the predefined script.js with the world description

    var director = require('director.js')

    director.show('world.js');

#todo

* properly dispose/destroy objects

* improve ammo.js by forking and changing ammo.idl krippen/ammo.js repository

* add hinge constraint methods in ammo.js

* add heightfield shape for ground shapes

* make require.js more generic, maybe using a bash scripts to list files in the directory

* tests for factory.pack, unpack, getObject

#objects structure

    {
      "physics": {
        "vector": {
          "x": 0,
          "y": 0,
          "z": 0
        },
        "quaternion": {
          "x": 1,
          "y": 0,
          "z": 0,
          "w": null
        },
        "position": {
          "x": 0,
          "y": 0,
          "z": 0
        },
        "rotation": {
          "x": 0,
          "y": 0,
          "z": 0
        },
        "velocity": {
          "x": 0,
          "y": 0,
          "z": 0
        }
      },
      "shape": {
        "default": {
          "r": 1,
          "segments": 12
        },
        "sphere": {
          "r": 1,
          "segments": 12
        },
        "box": {
          "dx": 1,
          "dy": 1,
          "dz": 1,
          "segments": 1
        },
        "cylinder": {
          "r": 1,
          "dy": 1,
          "segments": 12
        },
        "cone": {
          "r": 1,
          "dy": 1,
          "segments": 12
        }
      },
      "material": {
        "default": {
          "friction": 0.3,
          "restitution": 0.2,
          "color": 3355443,
          "opacity": 1,
          "wireframe": false
        },
        "basic": {
          "friction": 0.3,
          "restitution": 0.2,
          "color": 3355443,
          "opacity": 1,
          "wireframe": false
        },
        "phong": {
          "friction": 0.3,
          "restitution": 0.2,
          "color": 3355443,
          "opacity": 1,
          "emissive": 3430008
        }
      },
      "body": {
        "default": {
          "shape": {
            "type": "box"
          },
          "material": {
            "type": "basic",
            "wireframe": false,
            "color": 10066329
          },
          "mass": 0.1,
          "position": {},
          "quaternion": null,
          "rotation": null
        },
        "basic": {
          "shape": {
            "type": "box"
          },
          "material": {
            "type": "basic",
            "wireframe": false,
            "color": 10066329
          },
          "mass": 0.1,
          "position": {},
          "quaternion": null,
          "rotation": null
        }
      },
      "connector": {
        "default": {
          "body": null,
          "base": {
            "x": 0,
            "y": 0,
            "z": 0
          },
          "up": {
            "x": 0,
            "y": 0,
            "z": 0
          },
          "front": {
            "x": 0,
            "y": 0,
            "z": 0
          }
        },
        "relative": {
          "body": null,
          "base": {
            "x": 0,
            "y": 0,
            "z": 0
          },
          "up": {
            "x": 0,
            "y": 0,
            "z": 0
          },
          "front": {
            "x": 0,
            "y": 0,
            "z": 0
          }
        }
      },
      "constraint": {
        "default": {
          "a": null,
          "b": null
        },
        "point": {
          "a": null,
          "b": null
        },
        "hinge": {
          "a": null,
          "b": null
        },
        "_abstract": {
          "a": null,
          "b": null
        }
      },
      "scene": {
        "default": {
          "gravity": {
            "x": 0,
            "y": -9.81,
            "z": 0
          }
        },
        "basic": {
          "gravity": {
            "x": 0,
            "y": -9.81,
            "z": 0
          }
        }
      },
      "renderer": {
        "default": {
          "width": 500,
          "height": 500
        },
        "webgl": {
          "width": 500,
          "height": 500
        },
        "canvas": {
          "width": 500,
          "height": 500
        }
      },
      "camera": {
        "default": {
          "fov": 45,
          "aspect": 1,
          "near": 0.1,
          "far": 1000,
          "position": {
            "x": 5,
            "y": 7,
            "z": 10
          },
          "lookAt": {}
        },
        "perspective": {
          "fov": 45,
          "aspect": 1,
          "near": 0.1,
          "far": 1000,
          "position": {
            "x": 5,
            "y": 7,
            "z": 10
          },
          "lookAt": {}
        },
        "tracker": {
          "fov": 45,
          "aspect": 1,
          "near": 0.1,
          "far": 1000,
          "axis": {
            "x": 1,
            "y": 0.2,
            "z": 0.3
          },
          "distance": 15,
          "inertia": 1,
          "body": null
        }
      }
    }