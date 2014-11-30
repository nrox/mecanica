var testUtils = require('../util/test.js');
var utils = require('../util/utils.js');
var $ = require('../lib/jquery.js');
var _ = require('../lib/underscore.js');
//var d3 = require('../lib/d3.js');
function clearObjects() {
  $('#container').empty();
  $('#triggers').empty();
  $('#status').empty();
}

var test = {
  'sinusoidal': function () {

    utils.appendSVG($, '#container', {id: 'chart', height: '500px', width: '500px'});
    //$('#container').append('<svg  height="500px" class="chart"></svg>');

    var chart;
    nv.addGraph(function () {
      chart = nv.models.lineChart()
        .options({
          margin: {left: 100, bottom: 100},
          x: function (d, i) {
            return i
          },
          showXAxis: true,
          showYAxis: true
        })
      ;
      // chart sub-models (ie. xAxis, yAxis, etc) when accessed directly, return themselves, not the parent chart, so need to chain separately
      chart.xAxis
        .axisLabel("Time (s)")
        .tickFormat(d3.format(',.1f'));
      chart.yAxis
        .axisLabel('Voltage (v)')
        .tickFormat(d3.format(',.2f'))
      ;
      d3.select('svg')
        .datum(sinAndCos())
        .call(chart);
      //TODO: Figure out a good way to do this automatically
      //nv.utils.windowResize(chart.update);
      //nv.utils.windowResize(function() { d3.select('#chart1 svg').call(chart) });
      //chart.dispatch.on('stateChange', function (e) {
      //  nv.log('New State:', JSON.stringify(e));
      //});
      return chart;
    });
    //setInterval(updateChart, 1000);
    function updateChart() {
      chart.update();
    }

    function sinAndCos() {
      var cos = [];
      var rand = [];
      var i;

      function addOne(i) {
        cos.push({x: i, y: .5 * Math.cos(i / 10)});
        rand.push({x: i, y: Math.random() / 10});
      }

      function removeOne() {
        cos.shift();
        rand.shift();
      }

      for (i = 0; i < 100; i++) {
        addOne(i);
      }

      setInterval(function () {
        var c = 1;
        while (c--) {
          removeOne();
          addOne(++i);
        }
        chart.update();
      }, 100);

      return [
        {
          values: cos,
          key: "Cosine Wave",
          color: "#2ca02c"
        },
        {
          values: rand,
          key: "Random Points",
          color: "#2222ff"
        }
      ];
    }

  }
};

module.exports.test = test;
module.exports.clearObjects = clearObjects;
testUtils.run(test, process.argv, __filename);
