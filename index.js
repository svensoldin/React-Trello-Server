const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
require('dotenv').config();

const app = express();

// API was not accessible on Safari hence this custom cors middleware
app.use(function (req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', 'https://svensoldin.github.io');

  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, OPTIONS, PUT, PATCH, DELETE'
  );

  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-Requested-With,content-type'
  );

  // For session
  res.setHeader('Access-Control-Allow-Credentials', true);

  next();
});
app.use(express.json());

// Express-session middleware setup
app.use(
  session({
    cookie: {
      maxAge: 1000 * 60 * 60 * 4,
      httpOnly: true,
      secure: false,
      path: '/',
    },
    secret: process.env.SESSION_SECRET,
    store: new MongoStore({ mongooseConnection: mongoose.connection }),
    resave: false,
    saveUninitialized: false,
  })
);

//connect db
mongoose.set('useCreateIndex', true);
mongoose.set('useUnifiedTopology', true);
mongoose.set('useFindAndModify', false);
const mongooseConnect = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true });
    console.log('Connected to DB');
  } catch (err) {
    console.error(err);
  }
};
mongooseConnect();

// Routes
app.get('/test', (req, res) => {
  res.status(200).json({ message: 'Pass!' });
});
app.use('/users', require('./routes/users'));
app.use('/boards', require('./routes/boards'));
app.use('/columns', require('./routes/columns'));
app.use('/cards', require('./routes/cards'));

module.exports = app;
