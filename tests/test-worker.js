var testUtils = require('./test-utils.js');
var utils = require('utils.js');
var _ = require('../lib/underscore.js');
var worker;

function clean() {
  worker && worker.terminate();
  worker = undefined;
}
var test = {
  'availability': function () {
    if (typeof(Worker) !== "undefined") {
      console.log('yupiii! web workers are available');
    } else {
      console.warn('web workers are not available in your browser.');
    }
  },
  'inline worker, with blob': function () {
    console.log('create a worker using a blob');
    clean();
    var msg = {data: 'random:' + Math.random()};
    var blob = new Blob([
      "onmessage = function(e) {postMessage(e.data); }"]);

    //Obtain a blob URL reference to our worker 'file'.
    var blobURL = window.URL.createObjectURL(blob);

    worker = new Worker(blobURL);
    worker.onmessage = function (e) {
      testUtils.checkValues(e, msg, 'check echoed message');
    };
    worker.postMessage(msg.data);
  },
  'worker with script file': function () {
    console.log('create a worker, using a predefined javascript file: test-worker-script.js');
    clean();
    worker = new Worker("test-worker-script.js");
    var msg = {data: 'random:' + Math.random()};
    worker.onmessage = function (e) {
      console.log(e);
      testUtils.checkValues(e, msg, 'check echoed message');
    };
    worker.postMessage(msg.data);
  },
  'worker.js basic': function () {
    console.log('create a worker with worker.js');
    clean();
    worker = new Worker("../worker.js");
    var msg = {data: 'random:' + Math.random()};
    worker.onmessage = function (e) {
      console.log(e);
      testUtils.checkValues(e, msg, 'check echoed message');
    };
    worker.postMessage(msg.data);
  },
  'worker.js environment': function () {
    clean();

    console.log('check env. recon. browser window');
    var windowWorker = require('worker.js');
    var checks = {};
    _.each(windowWorker.environment, function (f, k) {
      checks[k] = f();
    });
    testUtils.checkValues(checks, {
      isBrowserWindow: true,
      isBrowserWorker: false,
      isNode: false
    }, 'only isBrowserWindow === true ?');

    console.log('check env. recon. in web worker');
    worker = new Worker("../worker.js");
    worker.onmessage = function (e) {
      console.log(utils.stringify(e.data));
    };
    worker.postMessage({
      require: ['underscore.js'],
      'return': false
    });
    worker.postMessage({
      eval: ['_.map(environment, function(f,k){return k +"() => " + f(); });'],
      'return': true,
      'comments': "environment check in web worker"
    });
  },
  'worker.js require underscore.js': function () {
    console.log('require underscore in the web worker env and do simple check _.each property');
    clean();
    worker = new Worker("../worker.js");
    worker.onmessage = function (e) {
      console.log(utils.stringify(e.data));
    };
    worker.postMessage({
      require: ['underscore.js'],
      'return': true,
      'comments': '_ = require(underscore.js)'
    });
    worker.postMessage({
      eval: ['_ && !!_.each'],
      'return': true,
      'comments': 'check _.each'
    });
  },
  'worker.js require ammo.js': function () {
    console.log('require ammo.js and check some properties');
    clean();
    worker = new Worker("../worker.js");
    worker.onmessage = function (e) {
      console.log(utils.stringify(e.data));
    };
    worker.postMessage({
      require: ['ammo.js'],
      'return': true,
      'comments': 'Ammo = require(ammo.js)'
    });
    worker.postMessage({
      eval: ['Ammo && !!Ammo.btVector3'],
      'return': true,
      'comments': 'check Ammo.btVector3'
    });
  },
  'worker.js loadFactory': function () {
    clean();
    worker = new Worker("../worker.js");
    worker.onmessage = function (e) {
      console.log(utils.stringify(e.data));
    };
    worker.postMessage({
      loadFactory: [],
      'return': true,
      'comments': 'loadFactory()'
    });
    worker.postMessage({
      eval: ['factory && factory.objects'],
      'return': true,
      'comments': 'check factory.objects'
    });
  }
};

module.exports.test = test;
testUtils.run(test, process.argv, __filename);

