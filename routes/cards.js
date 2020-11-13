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
// Get all cards from a board /cards/:boardId

router.get("/:boardId", [auth], async (req, res) => {
	try {
		const board = await Board.findById(req.params.boardId);
		if (!board) return res.status(400).json("Board not found");
		const cards = await Card.find({ board: board._id });
		return res.status(200).json(cards);
	} catch (err) {
		console.error(err);
		return res.status(500).json(err.message);
	}
});

// DELETE
// Delete a card /cards/:cardId

router.delete("/:cardId", [auth], async (req, res) => {
	try {
		const card = await Card.findById(req.params.cardId);
		if (!card) return res.status(400).json("Card not found");
		const board = await Board.findById(card.board);
		if (!board) return res.status(400).json("Board not found");
		// Check if client is on the board's users list
		if (!board.users.find((user) => user == req.user))
			return res
				.status(403)
				.json(
					"You cannot delete a card from a board you are not a part of"
				);
		const column = board.columns.find(
			(column) => column.title == card.columnTitle
		);
		if (!column) return res.status(400).json("Column not found");

		// Get the index of the card to be deleted and remove it from the board
		const removeIndex = column.cards.indexOf(card._id);
		column.cards.splice(removeIndex, 1);

		await card.deleteOne();
		await board.save();
		return res.status(200).json(column.cards);
	} catch (err) {
		console.error(err);
		return res.status(500).json(err.message);
	}
});

// PATCH
// Add a new comment to a card /cards/:cardId/comment/add

router.patch("/:cardId/comment/add", [auth], async (req, res) => {
	try {
		const card = await Card.findById(req.params.cardId);
		if (!card) return res.status(400).json("Card not found");
		if (!req.body.comment)
			return res.status(400).json("Comment cannot be empty");
		// Add Check if user is on the user list
		const newComment = {
			body: req.body.comment,
			user: req.user,
		};
		card.comments.push(newComment);
		await card.save();
		return res.status(200).json("Comment added!");
	} catch (err) {
		console.error(err);
		return res.status(500).json(err.message);
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

// POST
// Upload attachment to card /boards/:id/card/upload

// router.post("/:id/card/upload", [auth], async (req, res) => {
// 	try {
// 		const board = await Board.findById(req.params.id);
// 		const column = board.columns.find(
// 			(column) => column.title == req.body.column
// 		);
// 		const card = column.cards.find((card) => card.title == req.body.card);
// 		upload(req, res, (err) => {
// 			if (err) return res.status(500).json(err);
// 		});
// 		card.attachments.push({ name: Date.now() + "-" + req.file.name });
// 		await board.save();
// 		return res.status(200).json(board);
// 	} catch (err) {
// 		console.error(err);
// 		return res.status(500);
// 	}
// });

module.exports = router;
