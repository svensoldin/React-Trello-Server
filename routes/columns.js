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

// DELETE
// Delete a column /columns/:columnId/delete

router.delete(
	"/:columnId/delete",
	[auth],
	async ({ params: { columnId } }, res) => {
		try {
			const column = await Column.findById(columnId);
			if (!column) return res.status(400).json("Column not found");
			await Card.deleteMany({ column: columnId });
			await column.deleteOne();
			return res.status(200).json("column and cards deleted");
		} catch (err) {
			return res.status(500).json(err);
		}
	}
);

// PATCH
// Remove card from column /columns/:columnId/:cardId/delete

router.patch(
	"/:columnId/:cardId/delete",
	[auth],
	async ({ params: { columnId, cardId } }, res) => {
		try {
			const column = await Column.findById(columnId);
			if (!column) return res.status(400).json("Column not found");
			const removeIndex = column.cards.indexOf(cardId);
			column.cards.splice(removeIndex, 1);
			await column.save();
			return res.status(200).json(column.cards);
		} catch (err) {
			return res.status(500).json(err);
		}
	}
);

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
// Move card from one column to another /columns/drag/:source/:cardId

router.patch("/drag/:source/:cardId", [auth], async ({ params, body }, res) => {
	try {
		const source = await Column.findById(params.source);
		if (!source) return res.status(400).json("column not found");

		// The body contains an object with the id of the column and the insertion index
		const destination = await Column.findById(body.droppableId);
		if (!destination) return res.status(400).json("column not found");
		const { index, droppableId } = destination;

		const draggedCard = await Card.findById(params.cardId);
		if (!draggedCard) return res.status(400).json("card not found");

		// Insert the card in the destination column
		destination.cards.splice(index, 0, draggedCard);

		// Remove the card from the source column
		const removeIndex = source.cards.indexOf(draggedCard);
		source.cards.splice(removeIndex, 1);

		// Change the card's "column" field
		draggedCard.column = body.droppableId;

		// Save
		const documents = [destination, source, draggedCard];
		const promises = documents.map((doc) => {
			return new Promise(async (resolve, reject) => {
				await doc.save((err) => {
					if (err) reject(err);
					resolve();
				});
			});
		});
		await Promise.all(promises);
		return res.status(200).json("Success");
	} catch (err) {
		return res.status(500).json(err);
	}
});

module.exports = router;
