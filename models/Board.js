const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const BoardSchema = new Schema({
	photo: String,
	title: String,
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
	columns: [
		{
			type: Schema.Types.ObjectId,
			ref: "column",
		},
	],
});

module.exports = Board = mongoose.model("board", BoardSchema);
