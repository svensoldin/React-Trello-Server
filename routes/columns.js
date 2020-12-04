const express = require("express");
const router = express.Router();
const Column = require("../models/Column");
const Card = require("../models/Card");
const auth = require("../middleware/auth");

router.get("/", [auth], async (req, res) => {
	try {
		const columns = await Column.find({});
		if (!columns) return res.status(400);
		return res.status(200).json(columns);
	} catch (err) {
		console.error(err);
		return res.status(500).json("Server error");
	}
});

// PATCH
// Create a card /columns/:columnId/card/add

router.patch(":columnId/card/add", [auth], async (req, res) => {
	try {
		// Find column
		const column = await Column.findById(req.params.columnId);
		if (!column) return res.status(400).json("Column not found");

		// Create card
		const { title, labels, attachments, comments } = req.body;
		let card = new Card({
			title,
			labels,
			attachments,
			comments,
			column: column._id,
		});
		column.cards.push(card);
		await card.save();
		await board.save();
		return res.status(200).json(column.cards);
	} catch (err) {
		console.error(err);
		res.status(500).json("Server error");
	}
});

module.exports = router;
