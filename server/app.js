"use strict";

var express     = require('express'),
	compression = require('compression'),
	cors        = require('cors'),
	serveStatic = require('serve-static');

var app = express();

app.use(compression());

app.use(serveStatic(process.argv.indexOf('--dev') !== -1 ? '../client/dev' : '../client/build'));
  
   // .use(cors())
  app.use(require('./middlewares/auth'))

   .use(require('./controllers/public'))
   .use(require('./controllers/restricted'))
   .use(require('./controllers/reporting'));


app.listen(8000);
