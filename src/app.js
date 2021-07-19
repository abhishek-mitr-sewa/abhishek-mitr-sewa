var createError = require('http-errors');
var express = require('express');
var path = require('path');
var crypto = require('crypto');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var session = require('express-session');
var app = express();
const mongoose = require('mongoose');
var flash = require('express-flash');
import mongoStore from 'connect-mongo';
import bodyParser from 'body-parser';
import auth from './middleware/auth';

// mongoose.connect("mongodb+srv://dataadmin:dataadmin@cluster0.8wldd.mongodb.net/myFirstDatabase", {
//   useNewUrlParser: true,
// 	useUnifiedTopology: true,
// 	useCreateIndex: true,
// 	useFindAndModify: false
// });
mongoose.connect('mongodb+srv://mitrsewa:kqO9SbktMRYZZ117@cluster0.mau8k.mongodb.net/mitrsewa?retryWrites=true&w=majority', {useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex:true});

import rootRouter from './routes';

const fileUpload = require('express-fileupload');
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(fileUpload());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(flash());
//const TWO_HOURS = 1000 * 60 * 60 * 24;
const {
  SESS_NAME = 'sid',
//  SESS_LIFETIME = TWO_HOURS,
  NOD_ENV = 'development'
} = process.env

const IN_PROD = NOD_ENV === 'production';
app.use(session({
name : SESS_NAME,
secret: 'Rc$jV@8DZxK!]Z6z',
resave: false,
saveUninitialized: false,
store:mongoStore.create({
    mongoUrl: "mongodb+srv://mitrsewa:kqO9SbktMRYZZ117@cluster0.mau8k.mongodb.net/mitrsewa?retryWrites=true&w=majority"
  }),
  ttl: 14 * 24 * 60 * 60

}));

app.use(function(req, res, next) {
    res.locals.user = req.session.user;
  next();
});

// CHeck for the routes accessing publicly 
app.get("/upload/*",function(req, res, next) {
  const fullUrl = function() {
    return req.protocol + "://" + req.get('host') + req.originalUrl;
  }
  const path = fullUrl();
  // Check if it is from upload
  if(path.indexOf("upload") != -1) {
    // Check if user is authenticated or not
    if(auth.checkIfAuthenticated(req)) {
      return next();
    } else {
      return res.redirect("/login");
    }
  }
  return next();
});

app.use(express.static(path.join(__dirname, '../public')));

app.use('/', rootRouter);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});
app.locals.singleBack = "../";
app.locals.doubleBack = "../../";
// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

export default app;