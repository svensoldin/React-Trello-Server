const Board = require("../models/Board");

async function findCard(req, res, next) {
	try {
		const board = await Board.findById(req.params.boardId);
		if (!board) return res.status(404).json("Board not found");
		const column = board.columns.find(
			(column) => req.params.columnTitle == column.title
		);
		if (!column) return res.status(404).json("Column not found");
		const card = column.cards.find((card) => req.params.cardId == card._id);
		if (!card) return res.status(404).json("Card not found");
		req.board = board;
		req.column = column;
		req.card = card;
		next();
	} catch (err) {
		console.error(err);
		return res.status(500).json(err);
	}
}

module.exports = findCard;
