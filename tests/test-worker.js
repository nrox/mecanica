var testUtils = require('./test-utils.js');
var utils = require('../dist/utils.js');
var _ = require('../dist/lib/underscore.js');
var lib = require('../dist/mecanica.js');

var test = {
  'worker supported': function () {
    testUtils.assert((typeof Worker == 'function'), 'Worker function exists in environment');
  },
  'worker creation': function () {
    var worker = new Worker('../dist/worker.js');
    testUtils.assert((typeof worker == 'object'), 'Worker created');
    worker.terminate();
  },
  'WebWorker instance': function () {
    var mecanica = new lib.Mecanica();
    var worker = new lib.WebWorker({url: '../dist/worker.js'}, mecanica);
    testUtils.checkKeys(worker, ['url', 'worker', 'destroy', 'rootSystem'], 'worker instance keys');
    worker.destroy();
  },
  'simple execute': function () {
    var mecanica = new lib.Mecanica();
    var worker = new lib.WebWorker({url: '../dist/worker.js'}, mecanica);
    worker.execute(function () {
      console.log('worker logged something :)');
      return self.availablePaths;
    }, function (paths) {
      testUtils.assert((paths instanceof Array) && (paths.length > 10), 'simple execute: returned value as expected');
      worker.destroy();
    });
  },
  'complex execute': function () {
    var mecanica = new lib.Mecanica();
    var worker = new lib.WebWorker({url: '../dist/worker.js'}, mecanica);
    worker.execute({
      channel: 'execute',
      object: 'console',
      method: "" + function (arg1, arg2) {
        return {arg1: arg1, arg2: arg2,
          console: !!(this.error && this.warn && this.log && this.info && !this.availablePaths)
        };
      },
      'arguments': ["foo", "bar"],
      callback: function (result) {
        testUtils.checkValues(result, {
          arg1: "foo", arg2: "bar", console: true
        }, 'complex execute: returned value as expected');
      }
    });
  },
  'require utils.js': function () {
    var mecanica = new lib.Mecanica();
    var worker = new lib.WebWorker({url: '../dist/worker.js'}, mecanica);
    worker.execute(function () {
      console.log('worker will require utils.js');
      var lib = require('../dist/utils.js');
      console.log('worker finished requiring utils.js');
      return typeof lib.stringify == 'function';
    }, function (status) {
      testUtils.assert(status, 'required utils.js');
      worker.destroy();
    });
  },
  'require mecanica.js': function () {
    var mecanica = new lib.Mecanica();
    var worker = new lib.WebWorker({url: '../dist/worker.js'}, mecanica);
    worker.execute(function () {
      console.log('worker will require mecanica.js');
      var lib = require('../dist/mecanica.js');
      console.log('worker finished requiring mecanica.js');
      return typeof lib.Mecanica == 'function';
    }, function (status) {
      testUtils.assert(status, 'required mecanica.js');
      worker.destroy();
    });
  }
};

test.all = testUtils.all(test);
module.exports.test = test;
testUtils.run(test, process.argv, __filename);

