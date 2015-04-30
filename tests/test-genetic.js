var testUtils = require('./test-utils.js');
var utils = require('../dist/utils.js');
var lib = require('../dist/mecanica.js');
var _ = require('../dist/lib/underscore.js');
var genetic = require('../intel/ga.js');

var test = {
  'constructors': function () {
    testUtils.checkKeys(genetic, [
      'Feature', 'Genetic'
    ], 'has required constructors');
  },
  'simple fitness': function () {
    var goal = {x: Math.random(), y: Math.random()};
    console.log('trying to converge to solution: ', utils.stringify(goal));
    var ga = new genetic.Genetic({
      size: 100,
      steps: 1000,
      fitness: function (c) {
        return Math.sqrt(Math.pow(goal.x - c.x, 2) + Math.pow(goal.y - c.y, 2));
      },
      criteria: function () {
        return this.bestFitness() < 0.001;
      }
    });

    ga.add(new genetic.Feature({
      name: 'x',
      random: function () {
        return Math.random();
      },
      mutate: function (x) {
        return x * (1 + 0.1 * (0.5 - Math.random()));
      }
    }));

    ga.add(new genetic.Feature({
      name: 'y',
      random: function () {
        return Math.random();
      },
      mutate: function (x) {
        return x * (1 + 0.1 * (0.5 - Math.random()));
      }
    }));

    ga.createPopulation();
    ga.solve();

    var result = ga.status();

    console.log('got: ', utils.stringify(result));

    testUtils.checkAproximateValues(result.best, goal, 'goal is achieved', 0.001);
  },
  'cube volume': function () {
    var me = new lib.Mecanica();
    var goal = {volume: 5};
    console.log('target volume: ', utils.stringify(goal));

    var ga = new genetic.Genetic({
      size: 100,
      steps: 1000,
      fitness: function (c) {
        var shape = new lib.Shape({type: 'box', dx: c.dx, dy: c.dy, dz: c.dz}, me);
        var volume = shape.dx * shape.dy * shape.dz;
        shape.destroy();
        return Math.abs(volume - goal.volume);
      },
      criteria: function () {
        return this.bestFitness() < 0.001;
      }
    });

    _.each(['dx', 'dy', 'dz'], function (dim) {
      ga.add(new genetic.Feature({
        name: dim,
        random: function () {
          return Math.abs(10 * Math.random() - 5);
        },
        mutate: function (x) {
          return x * (1 + 0.1 * (0.5 - Math.random()));
        }
      }));
    });

    ga.createPopulation();
    ga.solve();
    var result = ga.status();

    console.log('got: ', utils.stringify(result));

    var volume = result.best.dx * result.best.dy * result.best.dz;
    me.destroy();

    testUtils.checkAproximateValues(goal, {volume: volume}, 'goal is achieved', 0.001);
  },
  'with simulation': function () {
    console.log('finding the adequate weight to balance a symmetric lever with mass 1 KG in one side');
    console.log('using level.js, applying GA in mass2');
    var speed = 10;
    var timeout = 1000; //1 second, simulated = timeout * speed
    var showBestAfterNumberOfSteps = 5;
    var populationSize = 20;
    var minMass = 0.1;
    var mass1 = 1;
    var length1 = 4;
    var length2 = 4;
    var numSteps = 100;

    console.log('max steps', numSteps);
    console.log('best displayed each', showBestAfterNumberOfSteps, 'steps');

    //this Mecanica will make simulations, no rendering
    var simulator = new lib.Mecanica({useDefaults: true, runsRender: false, runsPhysics: true});
    simulator.setSpeed(speed);

    //this one will display the best results
    var show = new lib.Mecanica({useDefaults: true, runsRender: true, runsPhysics: true});
    show.setSpeed(speed);

    var lever = require('../dist/ware/experiment/lever.js');

    var ga = new genetic.Genetic({
      mutationProbability: 0.1,
      size: 20,
      steps: numSteps,
      fitness: function (c) {
        //fitness is given by a non rotation of beam === perfect balance
        var z = this.indexOfChromosome(c);
        var systemId = 'z=' + z;
        var q = simulator.getSystem(systemId).getBody('beam').getQuaternion();
        //simple geometric distance to {x: 0, y: 0, z: 0, w: 1}
        return Math.sqrt(q.x * q.x + q.y * q.y + q.z * q.z + (q.w - 1) * (q.w - 1));
      },
      criteria: function () {
        return this.bestFitness() < 0.01;
      }
    });

    ga.add(new genetic.Feature({
      name: 'mass2',
      random: function () {
        return Math.abs(10 * Math.random() + minMass);
      },
      mutate: function (x) {
        return Math.abs(x + (0.5 - Math.random()));
      }
    }));

    ga.createPopulation();

    function options(mass2, i) {
      return {
        mass2: mass2,
        position: {z: i * 10},
        mass1: mass1, length1: length1, length2: length2
      };
    }

    function showBest(mass2) {
      var z = 0;
      var id = "z=" + z;
      show.stop();
      var sys = show.getSystem(id);
      if (sys) sys.destroy();
      show.loadSystem(lever.getObject(options(mass2, z)), id);
      show.addToScene();
      show.start();
    }

    function step() {
      simulator.stop();
      _.each(simulator.getObject('system'), function (sys) {
        sys.destroy();
      });
      for (var z = 0; z < populationSize; z++) {
        var chromosome = ga.getChromosome(z);
        simulator.loadSystem(lever.getObject(options(chromosome.mass2, z)), 'z=' + z);
      }
      simulator.addToScene();
      simulator.start();
      setTimeout(function () {
        simulator.stop();
        simulator.syncPhysics();
        ga.step();
        var status = ga.status();
        ga.logStatus(status);
        if (status.terminated || (status.step % showBestAfterNumberOfSteps) === 0) {
          showBest(status.best.mass2);
        }
        if (!status.terminated) {
          step();
        }
      }, timeout);
    }

    step();

  }
};

test.all = testUtils.all(test);
module.exports.test = test;
testUtils.run(test, process.argv, __filename);

