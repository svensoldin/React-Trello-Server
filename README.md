# React-Trello

This repo is the backend for the [React-Trello App](https://github.com/svensoldin/Thullo-Client). It's a classic REST Api built with Node, Express and MongoDB (implemented with [mongoose](https://mongoosejs.com/)). The client sends HTTP requests to various endpoints for creating, reading, updating and deleting data, according to the established document models.

### Authentication

After using json web tokens in previous projects, I wanted to learn a different way to handle user authentication, and therefore this API rests on cookie-based sessions.

When a user registers or logs in, the server creates a session with [express-session](https://www.npmjs.com/package/express-session) and responds with a session cookie. The "authenticated" endpoints verify that cookie on later requests with an `auth` custom middleware.

This mechanism also allows for more secure session persistence by not relying on `localStorage` to store user information, which is vulnerable to various kinds of attacks.

### Smarter reading

- [Stop using JWT for sessions (Sven Slootweg)](http://cryto.net/~joepie91/blog/2016/06/13/stop-using-jwt-for-sessions/)
