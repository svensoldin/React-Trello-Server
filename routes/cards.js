const express = require("express");
const router = express.Router();
const Card = require("../models/Card");
const Board = require("../models/Board");
const auth = require("../middleware/auth");
const multer = require("multer");
const fs = require("fs");

// Multer config

const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, "uploads");
	},
	filename: function (req, file, cb) {
		cb(null, file.originalname + "-" + Date.now());
	},
});
const upload = multer({ storage: storage });

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
// Upload attachment to card /cards/:cardId/attachments/upload

router.post(
	"/:cardId/attachments/upload",
	[auth, upload.single("attachment")],
	async (req, res) => {
		try {
			const card = await Card.findById(req.params.cardId);
			if (!card) return res.status(400).json("Card not found");
			const board = await Board.findById(card.board);
			if (!board) return res.status(400).json("Board not found");
			// Check if client is a user of the board
			if (!board.users.find((user) => req.user == user))
				return res
					.status(403)
					.json("Only users of the board can upload attachments");
			if (!req.file) return res.status(400).json("Please upload a file");
			card.attachments.push({ fileName: req.file.filename });
			await card.save();
			return res.status(200).json(card.attachments);
		} catch (err) {
			console.error(err);
			return res.status(500);
		}
	}
);

// GET
// Download an attachment /cards/:cardId/attachments/:attachmentId/download

router.get(
	"/:cardId/attachments/:attachmentId/download",
	[auth],
	async (req, res) => {
		try {
			const card = await Card.findById(req.params.cardId);
			if (!card) return res.status(400).json("Card not found");

			const board = await Board.findById(card.board);
			if (!board) return res.status(400).json("Board not found");

			// Check if client is a user of the board
			if (!board.users.find((user) => req.user == user))
				return res
					.status(403)
					.json("Only users of the board can download attachments");

			const attachmentToDownload = card.attachments.find(
				(attachment) => attachment._id == req.params.attachmentId
			);
			if (!attachmentToDownload)
				return res.status(400).json("Attachment not found");
			const file = `./uploads/${attachmentToDownload.fileName}`;
			res.status(200).download(file);
		} catch (err) {
			console.error(err);
			res.status(500).json(err.message);
		}
	}
);

// PATCH
// Delete an attachment /cards/:cardId/attachments/:attachmentId/delete

router.patch(
	"/:cardId/attachments/:attachmentId/delete",
	[auth],
	async (req, res) => {
		try {
			const card = await Card.findById(req.params.cardId);
			if (!card) return res.status(400).json("Card not found");

			const board = await Board.findById(card.board);
			if (!board) return res.status(400).json("Board not found");

			// Check if client is a user of the board
			if (!board.users.find((user) => req.user == user))
				return res
					.status(403)
					.json("Only users of the board can remove attachments");

			const attachmentToDelete = card.attachments.find(
				(attachment) => attachment._id == req.params.attachmentId
			);
			if (!attachmentToDelete)
				return res.status(400).json("Attachment not found");
			// Delete the corresponding file from disk
			fs.unlinkSync(`./uploads/${attachmentToDelete.fileName}`);
			// Remove the attachment from card
			const removeIndex = card.attachments.indexOf(attachmentToDelete);
			card.attachments.splice(removeIndex, 1);
			await card.save();
			return res.status(200).json(card.attachments);
		} catch (err) {
			console.error(err);
			res.status(500).json(err.message);
		}
	}
);

module.exports = router;
