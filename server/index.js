var express = require('express');
var http = require('http');
var app = express();
var server = http.Server(app);
var io = require('socket.io')(server);

var path = require('path');
var distFolder = path.join(__dirname, '..', 'dist');

app.use("/dist", express.static(distFolder));

server.listen(8081);

app.get('/', function (req, res) {
  res.redirect(301, 'dist/front.html');
});

io.on('connection', function (socket) {
  socket.emit('news', { hello: 'world' });
  socket.on('my other event', function (data) {
    console.log(data);
  });
});
