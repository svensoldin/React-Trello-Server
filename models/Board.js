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
					title: { type: String, required: true },
					comments: [
						{
							body: { type: String, required: true },
							user: {
								type: Schema.Types.ObjectId,
								ref: "users",
								required: true,
							},
						},
					],
					labels: [
						{ body: { type: String, required: true }, color: String },
					],
					attachments: [{ fileName: { type: String, required: true } }],
				},
			],
		},
	],
});

module.exports = Board = mongoose.model("board", BoardSchema);
