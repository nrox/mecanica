GA.js
=====

Genetic Algorithm with tournament selection and elite (the best solution always go further).

Example
-----
[Example](http://nrox.github.io/GA.js/)

Read test.js and index.html.

Usage
--------

Include underscore.js and ga.js in the header of the html file.

Create a new instance of Genetic. Pass as argument an object with the fitness function and the stop criteria as properties:

    var ga = new Genetic({
        size: 100,
        steps: 1000,
        fitness:  function(c){
            return Math.sqrt(c.x*c.x+c.y*c.y);
        },
        criteria: function (){
            //bestFitness will give the fitness of the best, at any moment
            return this.bestFitness()<0.001;
        }
    });

Add the features. The constructor must be called with functions to generate (random) and mutate features, and also the feature name:


    ga.add(new Feature({
        name: 'x',
        random: function(){
            return Math.random();
        },
        mutate: function (x){
            return x * (1 + 0.1 * (0.5-Math.random()));
        }
    }));

    ga.add(new Feature({
        name: 'y',
        random: function(){
            return Math.random();
        },
        mutate: function (x){
            return x * (1 + 0.1 * (0.5-Math.random()));
        }
    }));

Then:

    ga.createPopulation();
    ga.solve();

Access status:

    var status = ga.status();
    var result = ga.bestResult();

Results are satisfactory? If not, call solve again to iterate over more steps:

    ga.solve();

To reset the GA, and create new population, pass some or none of the same arguments used in the constructor:

    ga.reset({
        size: 100
    });

