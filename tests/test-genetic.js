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
    console.warn('TODO');
    var me = new lib.Mecanica();
  }
};

test.all = testUtils.all(test);
module.exports.test = test;
testUtils.run(test, process.argv, __filename);

