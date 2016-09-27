var express = require('express');
var cookieSession = require('cookie-session');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var config = require('./config');

var port = config().port || 3000;
var HOSTNAME = config().host || "localhost";
var baseURL = HOSTNAME + ":" + port;

var routes = require('./routes/index');
var users = require('./routes/users');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieSession({ name: 'session', keys: ['key1', 'key2'] }));

app.use('/', routes);
app.use('/users', users);

//const HOSTNAME = "192.168.99.100";
//const PORT = 8989;
//var baseUri = "http://" + HOSTNAME + ":" + PORT;

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    //debugger;
    var sess = req.session;
    var hostUrl = sess.hostURL;
    var url = req.url;

    if (url && url.indexOf(hostUrl) == -1) {
        //var redirectedLocation = "http://localhost:3000/?url=" + "http://" + hostUrl + url;
        var redirectedLocation = "http://" + baseURL + "/?url=" + "http://" + hostUrl + url;
        res.redirect(302, redirectedLocation);
        //res.statusCode = 302;
        //res.setHeader("Location", redirectedLocation);
        //res.end();
    }
    else {
        var err = new Error('Not Found');
        err.status = 404;
        next(err);
    }
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
if (app.get('env') === 'production') {
    app.use(function (err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: {}
        });
    });
}

//Below methods are helpful for automated testing framework - mocha
app.server = { name: 'name of the server', type: 'selfhost', version: '1.0.0.1'};
app.server.start = function (port, callback) {
    //starting the server
    app.server.instance = app.listen(port, callback);
};

app.server.stop = function (callback) {
    if (app.server.instance) {
        app.server.instance.close(callback);
    }
    else {
        callback({ error: 'Server instance not found' });
    }
};

module.exports = app;
