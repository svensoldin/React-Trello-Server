const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CardSchema = new Schema({
  column: { type: Schema.Types.ObjectId, required: true },
  title: { type: String, required: true },
  users: [{ type: Schema.Types.ObjectId, ref: 'users' }],
  description: { type: String, default: '' },
  comments: [
    {
      body: { type: String, required: true },
      user: {
        type: Schema.Types.ObjectId,
        ref: 'users',
        required: true,
      },
    },
  ],
  labels: [{ body: { type: String, required: true }, color: String }],
  attachments: [{ fileName: { type: String, required: true } }],
});

module.exports = Card = mongoose.model('card', CardSchema);
