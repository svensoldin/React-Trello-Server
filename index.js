const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
require('dotenv').config();

const app = express();

// Serve the static files from React app
app.use(express.static(path.join(__dirname, 'client/build')));
app.use(express.json());

// Express-session middleware setup
app.use(
  session({
    cookie: {
      maxAge: 1000 * 60 * 60 * 4,
      httpOnly: true,
      secure: 'auto',
      path: '/',
      sameSite: 'lax',
    },
    secret: process.env.SESSION_SECRET,
    store: new MongoStore({ mongooseConnection: mongoose.connection }),
    resave: false,
    saveUninitialized: true,
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

app.use('/api/users', require('./routes/users'));
app.use('/api/boards', require('./routes/boards'));
app.use('/api/columns', require('./routes/columns'));
app.use('/api/cards', require('./routes/cards'));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname + '/client/build/index.html'));
});

module.exports = app;
