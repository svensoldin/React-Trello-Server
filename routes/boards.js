const express = require("express");
const router = express.Router();
const Board = require("../models/Board");
const auth = require("../middleware/auth");

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
		});
		board.columns = columns.map((title) => {
			return {
				title,
				cards: [],
			};
		});
		await board.save();
		return res.status(200).json(board);
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
	try {
		const board = await Board.findById(req.params.id);
		if (!board) return res.status(400).json("No board found");
		// Check if the client is an admin
		if (!board.admins.filter((admin) => req.user == admin).length) {
			return res.status(403).json("Only an admin can remove a user");
		}
		board.users = board.users.filter((user) => req.body.user != user);
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

// Cards

// PATCH
// Create a card /boards/:id/card

router.patch("/:id/card", [auth], async (req, res) => {
	try {
		const board = await Board.findById(req.params.id);
		if (!board) return res.status(400).json("Board not found");
		// if (!board.admins.filter((admin) => req.user == admin).length) {
		// 	return res
		// 		.status(401)
		// 		.json("Not authorized, only an admin can add a card");
		// }

		// Pull the right column from the board
		let column = board.columns.find(
			(column) => req.body.column == column.title
		);
		if (!column) return res.status(400).json("No such column");
		const { title, labels, attachments, comments } = req.body.card;
		column.cards.push({
			title,
			labels,
			attachments,
			comments,
		});
		await board.save();
		return res.status(200).json("Card created");
	} catch (err) {
		console.error(err);
		res.status(500).json("Server error");
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
		dragColumn.cards = dragColumn.cards.filter((card) => draggedCard != card);

		// Save board
		await board.save();
		return res.status(200).json("Card successfully moved");
	} catch (err) {
		console.error(err);
		return res.status(500).json("Server error");
	}
});

module.exports = router;
