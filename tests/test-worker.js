var utils = require('./test-utils.js');
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
      utils.checkValues(e, msg, 'check echoed message');
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
      utils.checkValues(e, msg, 'check echoed message');
    };
    worker.postMessage(msg.data);
  },
  'worker.js creation': function () {
    console.log('create a worker with worker.js');
    clean();
    worker = new Worker("../worker.js");
    var msg = {data: 'random:' + Math.random()};
    worker.onmessage = function (e) {
      console.log(e);
      utils.checkValues(e, msg, 'check echoed message');
    };
    worker.postMessage(msg.data);
  },
  'worker.js require underscore.js': function () {
    console.log('create a worker with worker.js');
    clean();
    worker = new Worker("../worker.js");
    var msg = {
      require: ['underscore.js'],
      eval: ['!!_']
    };
    worker.onmessage = function (e) {
      console.log(e.data);
    };
    worker.postMessage(msg);
  }
};

module.exports.test = test;
utils.run(test, process.argv, __filename);

