var _ = require('underscore');

var options = {
  '-p PORT, --port PORT': 'port to run server, defaults to 8081',
  '-h, --help': 'print help'
};
var argv = require('minimist')(process.argv.slice(2));
var port = 8081;

try {
  if (argv.h || argv.help) {
    _.each(options, function (explain, command) {
      console.log(command, ':', explain);
    });
    return;
  }
  port = Number(argv.port || argv.p || port);
} catch (e) {
  console.error(e.message, 'while parsing arguments');
  return;

}

var express = require('express');
var http = require('http');
var app = express();
var server = http.Server(app);
var io = require('socket.io')(server);

var path = require('path');
var distFolder = path.join(__dirname, '..', 'dist');

app.use("/dist", express.static(distFolder));

server.listen(port);
console.log('listening on localhost:', port);

app.get('/', function (req, res) {
  res.redirect(301, 'dist/front.html');
});

io.on('connection', function (socket) {
  require('./server.js').registerAll(socket);
});


