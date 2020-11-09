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
// Create a new board

router.post("/", [auth], async (req, res) => {
	try {
		const { title, photo, users, admins } = req.body;
		const board = new Board({
			title,
			photo,
			users,
			admins,
		});
		await board.save();
		return res.status(200).json(board);
	} catch (err) {
		console.error(err);
		return res.status(500).json("Server error");
	}
});

// DELETE
// Delete a board

router.delete("/:id", [auth], async (req, res) => {
	try {
		const board = await Board.findById(req.params.id);
		if (!board) return res.status(403).json("Board not found");
		if (board.admins.filter((admin) => req.user === admin).length) {
			return res
				.status(401)
				.json("Not authorized, only an admin can delete a board");
		}
		await board.deleteOne();
		return res.status(200).json("Board deleted");
	} catch (err) {
		console.error(err);
		res.status(500).json("Server error");
	}
});

module.exports = router;
