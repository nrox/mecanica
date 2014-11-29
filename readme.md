Mecânica
========

mechanism simulation with ammo.js and three.js

[gh-pages](https://nrox.github.io/mecanica/)

##usage

Define the scene/world in a json object. Examples in ware/ folder

    /ware/world.js

Include jquery.js and the custom require.js in an html page

    <script src='lib/jquery.js'></script>
    <script src='util/require.js'></script>

Load the predefined world.js with the world description

    var f = require('factory.js');
    f.loadScene('http://...world.js');


##json editor

##todo

* allow joining and removing systems (collections of bodies and constraints)

* properly define and test constraints axis of movement

* properly dispose/destroy objects, check memory leaks

* add hinge constraint methods in ammo.js

* add heightfield shape for ground shapes

* tests for factory.pack, unpack, getObject

* add gear constraint

* experiment with soft bodies

* add convex shapes

* proper test for gear constraint

* fix worker tests

* make default material and lights look nice
