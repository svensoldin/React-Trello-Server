const express = require('express');
const router = express.Router();
const Board = require('../models/Board');
const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth');
const { check, validationResult } = require('express-validator');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

// POST
// Register a new user: /users/register

router.post(
  '/register',
  [
    // Name cannot be empty
    check('name', 'Name is required').not().isEmpty(),

    // Email must be valid
    check('email', 'Email must be a valid email adress').isEmail(),

    // Password must be at least 8 chars long
    check('password', 'Password must be at least 8 characters').isLength({
      min: 8,
    }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { name, email, password } = req.body;
    try {
      // Check if user's email already exists in the db
      let user = await User.findOne({ email });
      if (user) {
        return res
          .status(400)
          .json({ errors: [{ msg: 'User already exists' }] });
      }
      user = new User({
        name,
        email,
        password,
      });

      // Encrypt password and save the user in the db
      user.password = await bcrypt.hash(password, 10);
      await user.save();
      // Return token
      const payload = {
        id: user.id,
      };
      const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: 60 * 1000 * 10,
      });
      res.cookie('token', token, {
        expires: new Date(Date.now() + 8 * 36000),
        secure: false,
        httpOnly: true,
      });
      return res.status(200).json({
        user: { name: user.name, id: user._id, email: user.email },
      });
    } catch (err) {
      console.error(err);
      res.status(500).send(err.message);
    }
  }
);

// POST
// Sign in a user: /users/signin

router.post(
  '/signin',
  // [
  // 	check("email", "Please enter a valid email adress").isEmail(),
  // 	check("password", "Password is required").exists(),
  // ],
  async (req, res) => {
    // const errors = validationResult(req);
    // if (!errors.isEmpty()) {
    // 	return res.status(400).json({ errors: errors.array() });
    // }

    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({ errors: 'Wrong credentials' });
      }
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ errors: 'Wrong credentials' });
      }
      req.session.user = {
        name: user.name,
        email: user.email,
        id: user._id,
      };
      return res.status(200).json({
        user: { name: user.name, email: user.email, id: user._id },
      });
    } catch (err) {
      console.error(err);
      return res.status(500).send('Server error');
    }
  }
);

// GET
// Get session users/session

router.get('/session', (req, res) => {
  try {
    const { user } = req.session;
    return res.send(user);
  } catch (err) {
    console.error(err);
    return res.status(500).json('Server error');
  }
});

// POST
// Logout a user (destroy cookie) /users/logout

router.post('/logout', ({ session }, res) => {
  try {
    session.destroy();
    res.clearCookie('connect.sid', {
      httpOnly: true,
      secure: false,
      path: '/',
    });
    res.status(200).json('Logout successful');
  } catch (err) {
    console.error(err);
    return res.status(500).json(err);
  }
});

// DELETE
// Delete a user

router.delete('/delete', [auth], async (req, res) => {
  try {
    const user = await User.findById(req.user);
    if (!user) return res.status(400).json('User not found');
    await user.deleteOne();
    return res.status(200).json('Account deleted');
  } catch (err) {
    console.error(err);
    return res.status(500).json(err);
  }
});

// GET
// Get a user's boards (user homepage) /users/:userId

router.get('/:userId', [auth], async (req, res) => {
  const { user } = req.session;
  try {
    // Check that the client is accessing his own homepage.
    if (user.id != req.params.userId) return res.status(403);
    // No need to populate the columns here
    const boards = await Board.find({ users: `${req.params.userId}` });
    if (!boards) return res.status(400).json('No boards found');
    return res.status(200).json(boards);
  } catch (err) {
    console.error(err);
    return res.status(500).json(err.message);
  }
});

// POST
// Add a profile picture /users/profile/add

// Config multer

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'images');
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname + '-' + Date.now());
  },
});
const upload = multer({ storage: storage });

router.post(
  '/profile/add',
  [auth, upload.single('attachment')],
  async (req, res) => {
    try {
      if (!req.file) return res.status(400).json('Please upload a file');
      const user = await User.findById(req.user);
      if (!user) return res.status(400).json('User not found');
      user.picture = req.file.filename;
      await user.save();
      return res.status(200).json(user.picture);
    } catch (err) {
      // Delete the uploaded image if there was an error
      fs.unlinkSync(`./images/${req.file.fileName}`);
      console.error(err);
      return res.status(500).json(err);
    }
  }
);

// GET
// Get user picture /users/profile

router.get('/profile/:userId', [auth], async (req, res) => {
  const { session } = req;
  if (!session.user) return res.status(401).json('Not authenticated');
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(400).json('user not found');
    if (!user.picture) return res.status(404).json(user.name);
    const picturePath = path.resolve(__dirname + '/../images/' + user.picture);
    return res.sendFile(picturePath);
  } catch (err) {
    console.error(err);
    return res.status(500);
  }
});

// GET
// Query users /users

router.get('/', [auth], async (req, res) => {
  try {
    const regex = new RegExp(req.query.user, 'i'); // Using a regex to find names that include the user query
    const users = await User.find({ name: { $regex: regex } })
      .select('-password')
      .limit(3);
    if (!users) return res.status(404).json('No user found');
    return res.status(200).json(users);
  } catch (err) {
    return res.status(500).json('Server error');
  }
});

module.exports = router;
