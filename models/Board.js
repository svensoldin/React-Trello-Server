const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const BoardSchema = new Schema({
	users: [
		{
			type: Schema.Types.ObjectId,
			ref: "users",
		},
	],
	admins: [
		{
			type: Schema.Types.ObjectId,
			ref: "users",
		},
	],
	photo: String,
	title: String,
	columns: [
		{
			title: String,
			cards: [
				{
					type: Schema.Types.ObjectId,
					ref: "cards",
				},
			],
		},
	],
});

module.exports = Board = mongoose.model("board", BoardSchema);
