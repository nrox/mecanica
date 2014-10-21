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
    console.log('create a worker with webworker.js and echo a messages');
    clean();
    worker = new Worker("../webworker.js");
    var msg = 'random:' + Math.random();
    worker.onmessage = function (e) {
      console.log(e.data);
      testUtils.logStatus(e.data == msg, 'echo ' + msg);
    };
    worker.postMessage(msg);
  },
  'webworker.js require': function () {
    console.log('check if require / importScripts works properly');
    clean();
    worker = new Worker("../webworker.js");
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
  }
};

module.exports.test = test;
testUtils.run(test, process.argv, __filename);
