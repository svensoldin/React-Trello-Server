const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const BoardSchema = new Schema({
	users: {
		type: Schema.Types.ObjectId,
		ref: "users",
	},
	admins: {
		type: Schema.Types.ObjectId,
		ref: "users",
	},
	photo: String,
	title: String,
	columns: [
		{
			title: String,
			cards: [
				{
					title: String,
					comments: [
						{
							body: String,
							user: {
								type: Schema.Types.ObjectId,
								ref: "users",
							},
						},
					],
					labels: [{ body: String, color: String }],
					attachments: [{ name: String, url: String }],
				},
			],
		},
	],
});

module.exports = Board = mongoose.model("board", BoardSchema);
