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

    <script src='lib/jquery.js'></script>
    <script src='require.js'></script>

Load the predefined script.js with the world description

    var director = require('director.js')

    director.loadScene('world.js');

#todo

* allow joining and removing systems (collections of bodies and constraints)

* properly define and test constraints axis of movement

* properly dispose/destroy objects

* add hinge constraint methods in ammo.js

* add heightfield shape for ground shapes

* tests for factory.pack, unpack, getObject

* add gear constraint

* experiment with soft bodies

* add convex shapes

* proper test for gear constraint

* fix worker tests