const express = require("express");
const router = express.Router();

// Models
const Board = require("../models/Board");
const Column = require("../models/Column");

const auth = require("../middleware/auth");
const findCard = require("../middleware/findCard");
const multer = require("multer");
const fs = require("fs");

// GET
// Get all boards /boards

router.get("/", [auth], async (req, res) => {
	try {
		const boards = await Board.find({});
		return res.status(200).json(boards);
	} catch (err) {
		console.error(err);
		return res.status(500).json("Server error");
	}
});

// GET
// Get board by id with columns /boards/:boardId

router.get("/:boardId", [auth], async (req, res) => {
	try {
		const board = await Board.findById(req.params.boardId).populate(
			"columns"
		);
		if (!board) return res.status(400).json("Board not found");
		res.status(200).json(board);
	} catch (err) {
		console.error(err);
		return res.status(500).json("Server error");
	}
});

// POST
// Create a new board /boards

router.post("/", [auth], async (req, res) => {
	try {
		const { title, photo, users, admins, columns } = req.body;
		let board = new Board({
			title,
			photo,
			users,
			admins,
			columns,
		});
		await board.save();
		return res.status(200).json("Board created");
	} catch (err) {
		console.error(err);
		return res.status(500).json("Server error");
	}
});

// DELETE
// Delete a board /boards/:id

router.delete("/:id", [auth], async (req, res) => {
	try {
		const board = await Board.findById(req.params.id);
		if (!board) return res.status(400).json("Board not found");

		// Check if the user is an admin of the board
		if (!board.admins.find((admin) => req.session.user === admin)) {
			return res
				.status(403)
				.json("Not authorized, only an admin can delete a board");
		}

		await board.deleteOne();
		return res.status(200).json("Board deleted");
	} catch (err) {
		console.error(err);
		res.status(500).json("Server error");
	}
});

// PATCH
// Add a user to a board /boards/:id/user

router.patch("/:id/user", [auth], async (req, res) => {
	try {
		const board = await Board.findById(req.params.id);
		if (!board) return res.status(400).json("Board not found");
		board.users.push(req.body.user);
		await board.save();
		return res.status(200).json("User added");
	} catch (err) {
		console.error(err);
		res.status(500).json("Server error");
	}
});

// PATCH
// Remove a user from the board /boards/:id/user/remove

router.patch("/:id/user/remove", [auth], async (req, res) => {
	const userToRemove = req.body.user;
	try {
		const board = await Board.findById(req.params.id);
		if (!board) return res.status(400).json("No board found");
		// Check if the client is an admin
		if (!board.admins.find((admin) => req.session.user == admin)) {
			return res.status(403).json("Only an admin can remove a user");
		}
		const removeIndex = board.users.indexOf(userToRemove);
		board.users.splice(removeIndex, 1);
		await board.save();
		return res.status(200).json("User removed");
	} catch (err) {
		console.error(err);
		return res.status(500).json("Server error");
	}
});

// PATCH
// Change the name of the board /boards/:boardId/title

router.patch("/:boardId/title", [auth], async (req, res) => {
	try {
		const board = await Board.findById(req.params.boardId);
		if (!board) return res.status(400).json("Board not found");
		board.title = req.body.title;
		await board.save();
		return res.status(200).json(board.title);
	} catch (err) {
		console.error(err);
		res.status(500).json("Server error");
	}
});

// PATCH
// Create a column /boards/:boardId/column/add

router.patch("/:boardId/column/add", [auth], async (req, res) => {
	try {
		const board = await Board.findById(req.params.boardId);
		if (!board) return res.status(404).json("Board not found");
		if (!board.users.find((id) => id == req.session.user.id))
			return res
				.status(403)
				.json("You can't add a column to a board you are not a part of");
		let column = new Column({
			title: req.body.title,
			cards: [],
			board: board._id,
		});
		await column.save();
		board.columns.push(column._id);
		await board.save();
		return res.status(200).json(board.columns);
	} catch (err) {
		console.error(err);
		return res.status(500).json(err);
	}
});

// PATCH
// Drag and drop card from column to another /boards/:id/card/drag

router.patch("/:id/card/drag", [auth], async (req, res) => {
	try {
		const board = await Board.findById(req.params.id);
		if (!board) return res.status(400).json("Board not found");

		// Pull the drag column from the board
		let dragColumn = board.columns.find(
			(column) => req.body.dragColumn == column.title
		);
		if (!dragColumn) return res.status(400).json("Drag column not found");

		// Pull the drop column from the board
		let dropColumn = board.columns.find(
			(column) => req.body.dropColumn == column.title
		);
		if (!dropColumn) return res.status(400).json("Drop column not found");

		// Pull the card from the drag column
		const draggedCard = dragColumn.cards.find(
			(card) => req.body.cardId == card._id
		);
		if (!draggedCard) return res.status(400).json("Card not found");

		// Add the card to the drop column
		dropColumn.cards.push(draggedCard);

		// Remove the card from the drag column
		const removeIndex = dragColumn.cards.indexOf(draggedCard);
		dragColumn.cards.splice(removeIndex, 1);

		// Save board
		await board.save();
		return res.status(200).json("Card successfully moved");
	} catch (err) {
		console.error(err);
		return res.status(500).json("Server error");
	}
});

// Comments

// PATCH
// Add a new comment to a card /boards/:boardId/:columnTitle/:cardId/comment/add

router.patch(
	"/:boardId/:columnTitle/:cardId/comment/add",
	[auth, findCard],
	async (req, res) => {
		try {
			if (!req.body.comment)
				return res.status(400).json("Comment cannot be empty");
			// Add Check if user is on the user list
			const newComment = {
				body: req.body.comment,
				user: req.session.user,
			};
			req.card.comments.push(newComment);
			await req.board.save();
			return res.status(200).json(req.card.comments);
		} catch (err) {
			console.error(err);
			return res.status(500).json(err.message);
		}
	}
);

// PATCH
// Edit a comment /boards/:boardId/:columnTitle/:cardId/comment/:commentId/edit

router.patch(
	"/:boardId/:columnTitle/:cardId/comment/:commentId/edit",
	[auth, findCard],
	async (req, res) => {
		try {
			const { board, card } = req;
			const comment = card.comments.find(
				(comment) => comment._id == req.params.commentId
			);
			if (!comment) return res.status(400).json("Comment not found");
			if (comment.user != req.user)
				return res.status(403).json("You can't edit other users' comments");
			comment.body = req.body.newComment;
			await board.save();
			return res.status(200).json(card.comments);
		} catch (err) {
			console.error(err);
			return res.status(500).json("Server error");
		}
	}
);

// PATCH
// Delete a comment /boards/:boardId/:columnTitle/:cardId/comment/:commentId/delete

router.patch(
	"/:boardId/:columnTitle/:cardId/comment/:commentId/delete",
	[auth, findCard],
	async (req, res) => {
		try {
			const { board, column, card } = req;
			const commentToDelete = card.comments.find(
				(comment) => comment._id == req.params.commentId
			);
			if (commentToDelete.user != req.user)
				return res
					.status(403)
					.json("You cannot delete other users' comments");
			const removeIndex = card.comments.indexOf(commentToDelete);
			card.comments.splice(removeIndex, 1);
			await board.save();
			return res.status(200).json(card.comments);
		} catch (err) {
			console.error(err);
			return res.status(500).json(err.message);
		}
	}
);

// Attachments

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

// POST
// Upload attachment to card /boards/:boardId/:columnTitle/:cardId/attachment/upload

router.post(
	"/:boardId/:columnTitle/:cardId/attachment/upload",
	[auth, upload.single("attachment"), findCard],
	async (req, res) => {
		try {
			const { board, column, card } = req;
			// Check if client is a user of the board
			if (!board.users.find((user) => req.user == user))
				return res
					.status(403)
					.json("Only users of the board can upload attachments");
			if (!req.file) return res.status(400).json("Please upload a file");
			card.attachments.push({ fileName: req.file.filename });
			await board.save();
			return res.status(200).json(card.attachments);
		} catch (err) {
			console.error(err);
			return res.status(500);
		}
	}
);

// GET
// Download an attachment /boards/:boardId/:columnTitle/:cardId/attachment/:attachmentId/download

router.get(
	"/:boardId/:columnTitle/:cardId/attachment/:attachmentId/download",
	[auth, findCard],
	async (req, res) => {
		try {
			const { board, card } = req;

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
// Delete an attachment /boards/:boardId/:columnTitle/:cardId/attachment/:attachmentId/delete

router.patch(
	"/:boardId/:columnTitle/:cardId/attachment/:attachmentId/delete",
	[auth, findCard],
	async (req, res) => {
		try {
			const { board, card } = req;

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
			await board.save();
			return res.status(200).json(card.attachments);
		} catch (err) {
			console.error(err);
			res.status(500).json(err.message);
		}
	}
);

module.exports = router;
