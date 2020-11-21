const express = require("express");
const router = express.Router();
const Board = require("../models/Board");
const auth = require("../middleware/auth");
const findCard = require("../middleware/findCard");

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
		if (!board.admins.filter((admin) => req.user == admin).length) {
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
		if (!board.admins.filter((admin) => req.user == admin).length) {
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
// Change the name of the board /boards/:id/title

router.patch("/:id/title", [auth], async (req, res) => {
	try {
		const board = await Board.findById(req.params.id);
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
// Add a column /boards/:boardId/column/add

router.patch("/:boardId/column/add", [auth], async (req, res) => {
	try {
		const board = await Board.findById(req.params.boardId);
		if (!board) return res.status(404).json("Board not found");
		if (!board.users.find((user) => user == req.user))
			return res
				.status(403)
				.json("You can't add a column to a board you are not a part of");
		board.columns.push({ title: req.body.title, cards: [] });
		await board.save();
		return res.status(200).json(board.columns);
	} catch (err) {
		console.error(err);
		return res.status(500).json(err);
	}
});

// Cards

// PATCH
// Create a card /boards/:boardId/:columnTitle/card/add

router.patch("/:boardId/:columnTitle/card/add", [auth], async (req, res) => {
	try {
		// Find board
		const board = await Board.findById(req.params.boardId);
		if (!board) return res.status(400).json("Board not found");

		// Pull the right column from the board
		let column = board.columns.find(
			(column) => req.params.columnTitle == column.title
		);
		if (!column) return res.status(400).json("Column not found");

		// Create card
		const { title, labels, attachments, comments } = req.body;
		let card = {
			title,
			labels,
			attachments,
			comments,
		};
		column.cards.push(card);
		await board.save();
		return res.status(200).json(column.cards);
	} catch (err) {
		console.error(err);
		res.status(500).json("Server error");
	}
});

// PATCH
// Delete a card /boards/:boardId/:columnTitle/:cardId/delete

router.patch(
	"/:boardId/:columnTitle/:cardId/delete",
	[auth, findCard],
	async (req, res) => {
		try {
			// findCard middleware pulls the board and card and adds them to the req object
			const { board, column, card } = req;
			// Check if client is on the board's users list
			if (!board.users.find((user) => user == req.user))
				return res
					.status(403)
					.json(
						"You cannot delete a card from a board you are not a part of"
					);
			// Get the index of the card to be deleted and remove it from the board
			const removeIndex = column.cards.indexOf(card);
			column.cards.splice(removeIndex, 1);
			await board.save();
			return res.status(200).json(column.cards);
		} catch (err) {
			console.error(err);
			return res.status(500).json(err.message);
		}
	}
);

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
				user: req.user,
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

module.exports = router;
