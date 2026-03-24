require('dotenv').config();

var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cors = require('cors');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var projectsRouter = require('./routes/projects');
var commentsRouter = require('./routes/comments');
var requirement_historyRouter = require('./routes/requirement_history');
var requirementsRouter = require('./routes/requirements');
var tasksRouter = require('./routes/tasks');
var usersRouter = require('./routes/users');
var user_projectsRouter = require('./routes/user_projects');


var app = express();


// view engine setup
app.use(cors());
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/projects', projectsRouter)
app.use('/comments', commentsRouter);
app.use('/requirement_history', requirement_historyRouter);
app.use('/requirements', requirementsRouter);
app.use('/tasks', tasksRouter);
app.use('/users', usersRouter);
app.use('/user_projects', user_projectsRouter);

app.get('/test-insert-history', async (req, res) => {
  const { requirement_history_model } = require('./models');
  try {
    const record = await requirement_history_model.create({
      requirement_id: 18,
      version: 1,
      text: 'Prueba manual',
      context: 'test',
      analysis: { dummy: true },
      changed_by: 1,
      updated_at: new Date(),
    });
    res.send(record);
  } catch (e) {
    console.error('Error al insertar en requirement_history:', e);
    res.status(500).send(e);
  }
});


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
