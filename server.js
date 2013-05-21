var express = require('express');
var colours = require('colors');
var exphbs  = require('express3-handlebars');
var routes  = require('./routes');
var http = require('http');
var path = require('path');
var url  = require('url');
var fs = require('fs');

console.log('-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-'.rainbow);

colours.setTheme({
  info: 'green',
  data: 'grey',
  help: 'cyan',
  warn: 'yellow',
  debug: 'blue',
  error: 'red',
  alert: 'magenta'
});

var app = express();
var hbs = exphbs.create({
    extname: ".html",
    partialsDir: "templates/includes/"
});

app.configure(function(){
    app.engine('html', hbs.engine);
    app.set('view engine', 'html');
    app.set('views', __dirname + '/templates');
    app.use(express.static(__dirname + '/public', { 'no-cache': true }));
    app.use(express.static(__dirname + '/scenes', { 'no-cache': true }));
    app.use(express.favicon(__dirname + '/public/img/favicon.ico'));
    app.use(express.logger('dev'));
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(express.cookieParser());
    app.use(app.router);
    app.use(function(request, response, next) {
        throw new Error(request.url + ' not found');
    });
});


//  Now bring in control
require('./control.js');
control.init();


//  ############################################################################


app.get('/', routes.site.home);

//  API methods
app.post('/api/:method?', routes.api.parsePost);
app.get('/api/:method?', routes.api.parseGet);


console.log('>> Connect to: http://localhost:3483'.alert);
http.createServer(app).listen(3483);
