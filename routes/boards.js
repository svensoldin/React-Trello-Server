const express = require('express');
const router = express.Router();

// Models
const Board = require('../models/Board');
const Column = require('../models/Column');
const User = require('../models/User');

const auth = require('../middleware/auth');

// GET
// Get all boards /boards

router.get('/', [auth], async (req, res) => {
  try {
    const boards = await Board.find({});
    return res.status(200).json(boards);
  } catch (err) {
    console.error(err);
    return res.status(500).json('Server error');
  }
});

// GET
// Get board by id with users, columns and cards /boards/:boardId

router.get('/:boardId', [auth], async (req, res) => {
  try {
    const board = await Board.findById(req.params.boardId)
      .populate({ path: 'users', model: User })
      .populate({
        path: 'columns',
        populate: { path: 'cards' },
      }); // Populate the columns and the cards within the columns
    if (!board) return res.status(400).json('Board not found');
    res.status(200).json(board);
  } catch (err) {
    console.error(err);
    return res.status(500).json('Server error');
  }
});

// POST
// Create a new board /boards

router.post('/', [auth], async (req, res) => {
  try {
    const { title } = req.body;
    let board = new Board({
      title,
      users: [req.session.user.id],
    });
    await board.save();
    return res.status(200).json(board._id);
  } catch (err) {
    console.error(err);
    return res.status(500).json('Server error');
  }
});

// DELETE
// Delete a board /boards/:id

router.delete('/:id', [auth], async (req, res) => {
  try {
    const board = await Board.findById(req.params.id);
    if (!board) return res.status(400).json('Board not found');

    if (!board.users.find((user) => user == req.session.user.id))
      return res.status(403).json('Not a part of the board');

    // Check if the user is an admin of the board
    // if (!board.admins.find((admin) => req.session.user === admin)) {
    //   return res
    //     .status(403)
    //     .json('Not authorized, only an admin can delete a board');
    // }

    await board.deleteOne();
    return res.status(200).json('Board deleted');
  } catch (err) {
    console.error(err);
    res.status(500).json('Server error');
  }
});

// PATCH
// Add a user to a board /boards/:boardId/user

router.patch('/:boardId/user/:userId/add', [auth], async (req, res) => {
  try {
    const board = await Board.findById(req.params.boardId);
    if (!board) return res.status(400).json('Board not found');
    board.users.push(req.params.userId);
    await board.save();
    return res.status(200).json('User added');
  } catch (err) {
    console.error(err);
    res.status(500).json('Server error');
  }
});

// PATCH
// Remove a user from the board /boards/:boardId/remove/:userId

router.patch('/:boardId/remove/:userId', [auth], async (req, res) => {
  try {
    const board = await Board.findById(req.params.boardId);
    if (!board) return res.status(400).json('No board found');
    // Todo: add check if the client is an admin
    const removeIndex = board.users.indexOf(req.params.userId);
    board.users.splice(removeIndex, 1);
    await board.save();
    return res.status(200).json(board.users);
  } catch (err) {
    console.error(err);
    return res.status(500).json('Server error');
  }
});

// PATCH
// Change the name of the board /boards/:boardId/title

router.patch('/:boardId/title', [auth], async (req, res) => {
  try {
    const board = await Board.findById(req.params.boardId);
    if (!board) return res.status(400).json('Board not found');
    board.title = req.body.title;
    await board.save();
    return res.status(200).json(board.title);
  } catch (err) {
    console.error(err);
    res.status(500).json('Server error');
  }
});

// PATCH
// Create a column /boards/:boardId/column/add

router.patch('/:boardId/column/add', [auth], async (req, res) => {
  try {
    const board = await Board.findById(req.params.boardId);
    if (!board) return res.status(404).json('Board not found');
    if (!board.users.find((id) => id == req.session.user.id))
      return res
        .status(403)
        .json("You can't add a column to a board you are not a part of");
    let column = new Column({
      title: req.body.title,
      cards: [],
      board: board._id,
    });
    await column.save();
    board.columns.push(column._id);
    await board.save();
    return res.status(200).json(column._id);
  } catch (err) {
    console.error(err);
    return res.status(500).json(err);
  }
});

// PATCH
// Reorder columns /boards/:boardId/drag

router.patch(
  '/:boardId/drag/:columnId/:destinationIndex',
  [auth],
  async ({ params: { boardId, columnId, destinationIndex } }, res) => {
    try {
      const board = await Board.findById(boardId);
      if (!board) return res.status(404).json('board not found');
      const { columns } = board;
      columns.pull(columnId);
      columns.splice(destinationIndex, 0, columnId);

      await board.save();
      return res.status(200).json('success');
    } catch (err) {
      console.error(err);
      return res.status(500).json(err);
    }
  }
);

module.exports = router;
