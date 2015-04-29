
var _ = require('../dist/lib/underscore.js');

function Feature(options) {
  _.extend(this, options || {});
}

Feature.prototype.getName = function () {
  return this.name;
};

Feature.prototype.random = function () {
  return Math.random();
};

Feature.prototype.mutate = function (value) {
  return value * (1 + 0.01 * (0.5 - Math.random()));
};

function Genetic(options) {
  this.features = {};
  this.featureKeys = [];
  this.mutationProbability = 0.01;
  this.best = null;
  this.size = 50;
  this.steps = 1000;
  this.options = options;
  _.extend(this, options || {});
}

Genetic.prototype.reset = function (options) {
  var f = this.features;
  var fk = this.featureKeys;
  Genetic.call(this, _.extend(this.options, options || {}));
  this.featureKeys = fk;
  this.features = f;
};

//override with options! should return a positive number. the lower the best.
Genetic.prototype.fitness = function (c1) {
  return Math.random();
};

Genetic.prototype.criteria = function () {
  return this.bestFitness() < 0.001;
};

Genetic.prototype.add = function (feature) {
  this.featureKeys.push(feature.getName());
  this.features[feature.getName()] = feature;
};

Genetic.prototype.createChromosome = function () {
  var c = {};
  _.each(this.features, function (feature, name) {
    c[name] = feature.random.call(feature);
  });
  return c;
};

Genetic.prototype.createPopulation = function () {
  var c, count;
  this.size = Math.max(this.size, 3);
  count = this.size;
  this.population = [];
  while (count--) {
    c = this.createChromosome();
    c._fitness = this.fitness.call(this, c);
    if (!this.best || (c._fitness < this.best._fitness)) {
      this.best = c;
    }
    this.population.push(c);
  }
  return this.population;
};

Genetic.prototype.cross = function (c1, c2) {
  var c = {};
  _.each(this.featureKeys, function (name) {
    c[name] = (Math.random() < 0.67) ? c1[name] : c2[name];
  });
  return c;
};

Genetic.prototype.mutate = function (c, p) {
  p = p || this.mutationProbability;
  _.each(this.features, function (feature, name) {
    if (Math.random() > p) return;
    c[name] = feature.mutate.call(feature, c[name]);
  });
  return c;
};

Genetic.prototype.randomPair = function (list) {
  var c1 = (list || this.population)[Math.floor(this.size * Math.random())];
  var c2 = c1;
  while (c2 === c1) {
    c2 = (list || this.population)[Math.floor(this.size * Math.random())];
  }
  return [c1, c2];
};

Genetic.prototype.battle = function (c1, c2) {
  var total = c1._fitness + c2._fitness;
  if (total * Math.random() > c1._fitness) {
    return c1;
  } else {
    return c2;
  }
};

Genetic.prototype.bestFitness = function () {
  return this.best._fitness;
};

Genetic.prototype.step = function () {
  var winners = [], c;
  //select best, allow repetition
  while (winners.length < this.size) {
    winners.push(_.clone(this.battle.apply(this, this.randomPair())));
  }
  //replace the population
  this.population = [];
  //keep the best -> improves stability
  this.population.push(this.best);
  while (this.population.length < this.size) {
    //crossover
    c = this.cross.apply(this, this.randomPair(winners));
    //mutation
    c = this.mutate.call(this, c);
    //memo the fitness value
    c._fitness = this.fitness.call(this, c);
    if (c._fitness < this.best._fitness) {
      this.best = c;
    }
    this.population.push(c);
  }
};

Genetic.prototype.solve = function () {
  this.stepCount = 0;
  while (!this.criteria.call(this) && (this.stepCount++ < this.steps)) {
    this.step();
  }
};

Genetic.prototype.status = function () {
  var status = {};
  status.achieved = this.criteria();
  status.fitness = this.bestFitness();
  status.steps = this.stepCount;
  status.best = _.clone(this.best);
  delete status.best._fitness;
  return status;
};

if ((typeof module != 'undefined') && (typeof module.exports != 'undefined')) {
  module.exports = {
    Genetic: Genetic,
    Feature: Feature
  };
}