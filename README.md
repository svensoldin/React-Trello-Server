# React-Trello

This repo is the backend for the [React-Trello App](https://github.com/svensoldin/Thullo-Client).

It's a classic REST Api built with Node, Express and MongoDB (implemented with [mongoose](https://mongoosejs.com/)). The client sends HTTP requests to various endpoints for creating, reading, updating and deleting data, according to the established document models.

### Authentication

After using json web tokens in previous projects, I wanted to learn a different way to handle user authentication, and therefore this API rests on cookie-based sessions.

#### Mechanism

When a user registers or logs in, the server creates a session with [express-session](https://www.npmjs.com/package/express-session) and responds with a session cookie. The "authenticated" endpoints verify that cookie on later requests with an `auth` custom middleware.

This mechanism also allows for more secure session persistence by not relying on `localStorage` to store user information, which is vulnerable to various kinds of attacks.

#### Dev/prod differences

Session cookies proved to be quite tricky in production. Google Chrome now automatically drops cookies issued from a third-party ('sameSite' attribute) when they are not sent via HTTPS ('secure' attribute).

In development, the front app and the server were running on different domains and without HTTPS. On first deploy, this resulted in the app breaking immediately on Chrome. To fix that, the session cookie is setup differently according to the environment:

```javascript
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
      secure: 'auto',
      sameSite: 'strict',
    },
    secret: process.env.SESSION_SECRET,
    store: new MongoStore({ mongooseConnection: mongoose.connection }),
    resave: false,
    saveUninitialized: true,
  })
);
```

### Deployment

The express app is deployed on Heroku and serves statically the files from the production build of the React app in client/build folder. Client-side routing is preserved.

```javascript
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
```

### Credits

- [Stop using JWT for sessions (Sven Slootweg)](http://cryto.net/~joepie91/blog/2016/06/13/stop-using-jwt-for-sessions/)
