const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
require('dotenv').config();

const app = express();

app.use(express.json());

// Express-session middleware setup

// In dev, need to use cors and less strict cookie options
if (process.env.NODE_ENV === 'development') {
  app.use(
    cors({
      origin: 'http://localhost:3000',
      credentials: true,
    })
  );
  app.use(
    session({
      cookie: {
        maxAge: 1000 * 60 * 60 * 4,
        httpOnly: true,
        secure: false,
        path: '/',
        sameSite: 'none',
      },
      secret: process.env.SESSION_SECRET,
      store: new MongoStore({ mongooseConnection: mongoose.connection }),
      resave: false,
      saveUninitialized: true,
    })
  );
}

// In production, the front and back are hosted on the same domain
app.use(
  session({
    cookie: {
      maxAge: 1000 * 60 * 60 * 4,
      httpOnly: true,
      secure: true,
      path: '/',
      sameSite: 'strict',
      domain: 'https://thullo.herokuapp.com/',
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

// In production, serve the static files from build folder

app.use(express.static(path.join(__dirname, 'client/build')));

// Routes

app.use('/api/users', require('./routes/users'));
app.use('/api/boards', require('./routes/boards'));
app.use('/api/columns', require('./routes/columns'));
app.use('/api/cards', require('./routes/cards'));

// For all other routes, rely on client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname + '/client/build/index.html'));
});

module.exports = app;
