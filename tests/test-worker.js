var testUtils = require('../util/test.js');
var utils = require('../util/utils.js');
var _ = require('../lib/underscore.js');
var worker;

function clearObjects() {
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
  'worker.js basic': function () {
    console.log('create a worker with worker-web.js');
    worker = new Worker("../worker-web.js");
    var msg = 'random:' + Math.random();
    worker.onmessage = function (e) {
      console.log(e.data);
      testUtils.logStatus(e.data == msg, 'echo ' + msg);
    };
    worker.postMessage(msg);
  },
  'worker-web.js require': function () {
    console.log('check if require / importScripts works properly');
    worker = new Worker("../worker-web.js");
    worker.onmessage = function (e) {
      console.log(utils.stringify(e.data));
    };
    worker.postMessage({
      comment: 'underscore loaded',
      action: 'eval',
      arguments: ['_ && !!_.each']
    });
    worker.postMessage({
      comment: 'Ammo loaded',
      action: 'eval',
      arguments: ['Ammo && !!Ammo.btVector3']
    });
    worker.postMessage({
      comment: 'factory loaded',
      action: 'eval',
      arguments: ['factory && !!factory.make']
    });
  },
  'worker-web.js with factory.js': function () {
    var factory = require('factory.js');
    worker = factory.createWorker();
    worker.postMessage({
      comment: 'factory loaded',
      action: 'eval',
      arguments: ['factory && !!factory.make']
    });
    worker.postMessage({
      comment: 'run a factory function: make({group: shape, type: box})',
      action: 'factory',
      arguments: ['make', {group: 'shape', type: 'box'}]
    })
  }
};

module.exports.test = test;
module.exports.clearObjects = clearObjects;
testUtils.run(test, process.argv, __filename);
