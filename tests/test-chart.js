var testUtils = require('../util/test.js');
var utils = require('../util/utils.js');
var $ = require('../lib/jquery.js');
var _ = require('../lib/underscore.js');
var Chart = require('../lib/Chart.js');

function clearObjects() {
  $('#container').empty();
  $('#triggers').empty();
  $('#status').empty();
  clearInterval(Chart._sid);
}

var test = {
  'sinusoidal': function () {
    $('#container').append('<canvas id="myChart" style="background-color: white;" width="600" height="400"></canvas>');
    // Get the context of the canvas element we want to select
    var data = {
      labels: [],
      datasets: [
        {label: 'sin',
          strokeColor: "rgb(100,0,0)",
          data: []},
        {label: 'cos',
          strokeColor: "rgb(0,0,100)",
          data: []}
      ]
    };

    var ctx = document.getElementById("myChart").getContext("2d");
    utils.configChart(Chart);
    var myChart = new Chart(ctx).Line(data, getGraphOptions());
    var count = 0;
    Chart._sid = setInterval(function () {
      if (data.labels.length > 100) {
        myChart.removeData();
      }
      var x = utils.time() / 1000.0;
      myChart.addData([3 * Math.sin(4 * x), Math.cos(x)], '');
      //if (!(count++ % 10)) myChart.update();
    }, 33);
  }
};

function getGraphOptions() {
  return  {

    ///Boolean - Whether grid lines are shown across the chart
    scaleShowGridLines: false,

    //String - Colour of the grid lines
    scaleGridLineColor: "rgba(0,0,0,.05)",

    //Number - Width of the grid lines
    scaleGridLineWidth: 1,

    //Boolean - Whether the line is curved between points
    bezierCurve: false,

    //Number - Tension of the bezier curve between points
    bezierCurveTension: 0.4,

    //Boolean - Whether to show a dot for each point
    pointDot: false,

    //Number - Radius of each point dot in pixels
    pointDotRadius: 4,

    //Number - Pixel width of point dot stroke
    pointDotStrokeWidth: 1,

    //Number - amount extra to add to the radius to cater for hit detection outside the drawn point
    pointHitDetectionRadius: 20,

    //Boolean - Whether to show a stroke for datasets
    datasetStroke: true,

    //Number - Pixel width of dataset stroke
    datasetStrokeWidth: 3,

    //Boolean - Whether to fill the dataset with a colour
    datasetFill: false,

    //String - A legend template
    legendTemplate: "<ul class=\"<%=name.toLowerCase()%>-legend\"><% for (var i=0; i<datasets.length; i++){%><li><span style=\"background-color:<%=datasets[i].lineColor%>\"></span><%if(datasets[i].label){%><%=datasets[i].label%><%}%></li><%}%></ul>"

  };
}

module.exports.test = test;
module.exports.clearObjects = clearObjects;
testUtils.run(test, process.argv, __filename);