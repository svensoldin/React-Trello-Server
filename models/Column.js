const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ColumnSchema = new Schema({
  board: { type: Schema.Types.ObjectId, required: true, ref: 'board' },
  title: String,
  cards: [{ type: Schema.Types.ObjectId, ref: 'card' }],
});

module.exports = Column = mongoose.model('column', ColumnSchema);
