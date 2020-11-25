const express = require("express");
const router = express.Router();
const Board = require("../models/Board");
const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const auth = require("../middleware/auth");
const { check, validationResult } = require("express-validator");
const multer = require("multer");

// GET
// Get all users: /users

router.get("/", async (req, res) => {
	try {
		const users = await User.find({});
		return res.status(200).json(users);
	} catch (err) {
		console.error(err);
		return res.status(500).json("Server error");
	}
});

// POST
// Register a new user: /users/register

router.post(
	"/register",
	[
		// Name cannot be empty
		check("name", "Name is required").not().isEmpty(),

		// Email must be valid
		check("email", "Email must be a valid email adress").isEmail(),

		// Password must be at least 8 chars long
		check("password", "Password must be at least 8 characters").isLength({
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
					.json({ errors: [{ msg: "User already exists" }] });
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
			return res
				.status(200)
				.json({ token, user: { name: user.name, id: user._id } });
		} catch (err) {
			console.error(err);
			res.status(500).send(err.message);
		}
	}
);

// POST
// Sign in a user: /users/signin

router.post(
	"/signin",
	[
		check("email", "Please enter a valid email adress").isEmail(),
		check("password", "Password is required").exists(),
	],
	async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() });
		}
		const { email, password } = req.body;
		try {
			const user = await User.findOne({ email });
			if (!user) {
				return res.status(400).json({ errors: "Wrong credentials" });
			}
			const isMatch = await bcrypt.compare(password, user.password);
			if (!isMatch) {
				return res.status(400).json({ errors: "Wrong credentials" });
			}
			const payload = {
				id: user.id,
			};
			const token = jwt.sign(payload, process.env.JWT_SECRET, {
				expiresIn: 60 * 1000 * 10,
			});
			return res
				.status(200)
				.json({ token, user: { name: user.name, id: user._id } });
		} catch (err) {
			console.error(err.message);
			return res.status(500).send("Server error");
		}
	}
);

// GET
// Get a user's boards (user homepage) /users/:userId

router.get("/:userId", [auth], async (req, res) => {
	try {
		// Check that the client is accessing his own homepage. If not, redirect him to his own homepage
		if (req.user != req.params.userId)
			return res.redirect(403, `/users/${req.user}`);
		const boards = await Board.find({ users: `${req.params.userId}` });
		if (!boards) return res.status(400).json("No boards found");
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
		cb(null, "images");
	},
	filename: function (req, file, cb) {
		cb(null, file.originalname + "-" + Date.now());
	},
});
const upload = multer({ storage: storage });

router.post(
	"/profile/add",
	[auth, upload.single("attachment")],
	async (req, res) => {
		try {
			if (!req.file) return res.status(400).json("Please upload a file");
			const user = User.findById(req.user);
			if (!user) return res.status(400).json("User not found");
			user.picture = req.file.fileName;
			await user.save();
			return res.status(200).json(user.picture);
		} catch (err) {
			console.error(err);
			return res.status(500).json(err);
		}
	}
);

module.exports = router;
