const express = require("express");
const router = express.Router();
const Card = require("../models/Card");
const Board = require("../models/Board");
const auth = require("../middleware/auth");
const multer = require("multer");

// Multer config
const storage = multer.diskStorage({
	destination: (req, file, cb) => cb(null, "uploads/"),
	filename: (req, file, cb) => cb(null, Date.now() + "-" + file.name),
});
let upload = multer({ storage: storage }).single("file");

// GET
// Get all cards /cards

router.get("/", [auth], async (req, res) => {
	try {
		const cards = await Card.find({});
		return res.status(200).json(cards);
	} catch (err) {
		console.error(err);
		return res.status(500).json(err.message);
	}
});

// GET
// Get all cards from a column /cards/:columnId

router.get("/:columnId", [auth], async (req, res) => {
	try {
		const cards = await Card.find({ column: req.params.columnId });
		if (!cards) return res.status(404).json("No cards found");
		res.status(200).json(cards);
	} catch (err) {
		console.error(err);
		res.status(500).json("Server error");
	}
});

// PATCH
// Add a new comment to a card /cards/:id/comment/add

router.patch("/:id/comment/add", [auth], async (req, res) => {
	try {
		const card = await Card.findById(req.params.id);
		if (!card) return res.status(400).json("Card not found");
		if (!req.body.comment)
			return res.status(400).json("Comment cannot be empty");
		const newComment = {
			body: req.body.comment,
			user: req.user,
		};
		card.comments.push(newComment);
		await card.save();
		return res.status(200).json("Comment added!");
	} catch (err) {
		console.error(err);
		return res.status(500).json("Server error");
	}
});

// PATCH
// Edit a comment /cards/:cardId/comment/:commentId/edit

router.patch("/:cardId/comment/:commentId/edit", [auth], async (req, res) => {
	try {
		const card = await Card.findById(req.params.cardId);
		if (!card) return res.status(400).json("Card not found");
		const comment = card.comments.find(
			(comment) => comment._id == req.params.commentId
		);
		if (!comment) return res.status(400).json("Comment not found");
		if (comment.user != req.user)
			return res.status(403).json("You can't edit other users' comments");
		comment.body = req.body.newComment;
		await card.save();
		return res.status(200).json("Comment edited!");
	} catch (err) {
		console.error(err);
		return res.status(500).json("Server error");
	}
});

// PATCH
// Delete a comment /cards/:cardId/comment/:commentId/delete

router.patch("/:cardId/comment/:commentId/delete", [auth], async (req, res) => {
	try {
		const card = await Card.findById(req.params.cardId);
		if (!card) return res.status(400).json("Card not found");
		const commentToDelete = card.comments.find(
			(comment) => comment._id == req.params.commentId
		);
		if (commentToDelete.user != req.user)
			return res.status(403).json("You cannot delete other users' comments");
		card.comments = card.comments.filter(
			(comment) => comment != commentToDelete
		);
		await card.save();
		return res.status(200).json(card.comments);
	} catch (err) {
		console.error(err);
		return res.status(500).json(err.message);
	}
});

module.exports = router;
