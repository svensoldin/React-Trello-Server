const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const CardSchema = new Schema({
	board: { type: Schema.Types.ObjectId, ref: "boards", required: true },
	columnTitle: { type: String, required: true },
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
	labels: [{ body: { type: String, required: true }, color: String }],
	attachments: [{ fileName: { type: String, required: true } }],
});

module.exports = Card = mongoose.model("card", CardSchema);
