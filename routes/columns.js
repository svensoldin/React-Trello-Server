const express = require('express');
const router = express.Router();
const Column = require('../models/Column');
const Card = require('../models/Card');
const auth = require('../middleware/auth');

router.get('/', [auth], async (req, res) => {
  try {
    const columns = await Column.find({});
    if (!columns) return res.status(400);
    return res.status(200).json(columns);
  } catch (err) {
    console.error(err);
    return res.status(500).json('Server error');
  }
});

// PATCH
// Change column's title /columns/:columnId/title

router.patch('/:columnId/title', [auth], async (req, res) => {
  try {
    const column = await Column.findById(req.params.columnId);
    if (!column) return res.status(400).json('column not found');
    column.title = req.body.title;
    await column.save();
    return res.status(200).json(column);
  } catch (err) {
    console.error(err);
    return res.status(500).json(err);
  }
});

// DELETE
// Delete a column /columns/:columnId/delete

router.delete(
  '/:columnId/delete',
  [auth],
  async ({ params: { columnId } }, res) => {
    try {
      const column = await Column.findById(columnId);
      if (!column) return res.status(400).json('Column not found');

      // Delete all the cards within the column
      await Card.deleteMany({ column: columnId });
      await column.deleteOne();
      return res.status(200).json('column and cards deleted');
    } catch (err) {
      return res.status(500).json(err);
    }
  }
);

// PATCH
// Remove card from column /columns/:columnId/:cardId/delete

router.patch(
  '/:columnId/:cardId/delete',
  [auth],
  async ({ params: { columnId, cardId } }, res) => {
    try {
      const column = await Column.findById(columnId);
      if (!column) return res.status(400).json('Column not found');
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

router.patch('/:columnId/card/add', [auth], async (req, res) => {
  try {
    // Find column
    const column = await Column.findById(req.params.columnId);
    if (!column) return res.status(400).json('Column not found');

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
    return res.status(200).json(card._id);
  } catch (err) {
    console.error(err);
    res.status(500).json('Server error');
  }
});

// PATCH
// Drag and drop a card /columns/drag/:sourceId/:cardId

router.patch(
  '/drag/:sourceId/:cardId',
  [auth],
  async (
    {
      params: { sourceId, cardId },
      body: { droppableId: destinationId, index: destinationIndex },
    },
    res
  ) => {
    try {
      if (sourceId === destinationId) {
        const column = await Column.findById(sourceId);
        if (!column) return res.status(400).json('column not found');
        const { cards } = column;
        const draggedCard = await Card.findById(cardId);
        if (!draggedCard) return res.status(400).json('card not found');

        cards.pull(draggedCard);
        cards.splice(destinationIndex, 0, draggedCard);

        await column.save();
        return res.status(200).json('success');
      }
      const source = await Column.findById(sourceId);
      if (!source) return res.status(400).json('column not found');
      const destination = await Column.findById(destinationId);
      if (!destination) return res.status(400).json('column not found');

      // Find the dragged card and change its columnId at the same time
      const draggedCard = await Card.findByIdAndUpdate(cardId, {
        column: destinationId,
      });
      if (!draggedCard) return res.status(400).json('card not found');

      // Remove the card from the source and add it to the destination
      source.cards.pull(draggedCard);
      destination.cards.splice(destinationIndex, 0, draggedCard);

      await source.save();
      await destination.save();
      return res.status(200).json('Success');
    } catch (err) {
      console.error(err);
      return res.status(500).json(err);
    }
  }
);

module.exports = router;
