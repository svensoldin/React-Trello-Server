const express = require("express");
const router = express.Router();
const Board = require("../models/Board");
const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { check, validationResult } = require("express-validator");

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
			return res.status(200).json({ token });
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
			return res.status(200).json(token);
		} catch (err) {
			console.error(err.message);
			return res.status(500).send("Server error");
		}
	}
);

module.exports = router;
