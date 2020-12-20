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

router.patch("/:columnId/card/add", [auth], async (req, res) => {
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
		await card.save();
		column.cards.push(card._id);
		await column.save();
		return res.status(200).json(column.cards);
	} catch (err) {
		console.error(err);
		res.status(500).json("Server error");
	}
});

// PATCH
// Delete a card /columns/:columnId/card/:cardId/delete

router.patch("/:columnId/card/:cardId/delete", [auth], async (req, res) => {
	try {
		const column = await Column.findById(req.params.columnId);
		if (!column) return res.status(400).json("column not found");
		const card = await Card.findById(req.params.cardId);
		if (!card) return res.status(400).json("card not found");
		// Get the index of the card to be deleted and remove it from the column
		const removeIndex = column.cards.indexOf(card._id);
		column.cards.splice(removeIndex, 1);
		await column.save();
		// Delete the card document
		await card.deleteOne();
		return res.status(200).json(column.cards);
	} catch (err) {
		console.error(err);
		return res.status(500).json(err.message);
	}
});

module.exports = router;
