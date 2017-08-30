var express = require('express'),
    app = module.exports = express.createServer(express.logger()),
    io = require('socket.io').listen(app);
    Stopwatch = require('./models/stopwatch'),
    routes = require('./routes');

// Configuration

app.configure(function() {
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function() {
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function() {
  app.use(express.errorHandler());
});

// Heroku won't actually allow us to use WebSockets
// so we have to setup polling instead.
// https://devcenter.heroku.com/articles/using-socket-io-with-node-js-on-heroku
io.configure(function () {
  io.set("transports", ["xhr-polling"]);
  io.set("polling duration", 10);
});

// Routes

// Use the port that Heroku provides or default to 5000
var port = process.env.PORT || 5000;
app.listen(port, function() {
  console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
});

app.get('/', routes.index);
app.get('/admin', function(req, res) {
  res.render('admin');
});

var stopwatch = new Stopwatch();
stopwatch.on('tick:stopwatch', function(time) {
  io.sockets.emit('time', { time: time });
});

stopwatch.on('reset:stopwatch', function(data) {
  io.sockets.emit('time', { time: data.time });
  io.sockets.emit('bid', data.bid);
  io.sockets.emit('reset');
});

stopwatch.on('bid:received', function(data) {
  io.sockets.emit('time', { time: data.time } );
  io.sockets.emit('bid', data.bid)
});

stopwatch.on('player:changed', function (player) {
  io.sockets.emit('player', player);
});

stopwatch.on('stop:stopwatch', function (player) {
  io.sockets.emit('stop');
});

//stopwatch.start();

io.sockets.on('connection', function (socket) {
  io.sockets.emit('time', { time: stopwatch.getTime() });
  io.sockets.emit('bid', stopwatch.getBid());

  socket.on('click:start', function () {
    stopwatch.start();
  });

  socket.on('click:stop', function () {
    stopwatch.stop();
  });

  socket.on('click:reset', function () {
    stopwatch.reset();
  });

  socket.on('bid:received', function (amount) {
    stopwatch.bidReceived(amount);
  });

  socket.on('player:changed', function (player) {
    stopwatch.setPlayer(player);
  });

  socket.on('bid:set', function (bid) {
    stopwatch.setBid(bid);
  });

  socket.on('timer:start:set', function (seconds) {
    stopwatch.setStartTime(parseInt(seconds) * 1000);
  });
});