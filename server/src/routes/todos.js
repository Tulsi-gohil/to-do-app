const express = require('express');
const { body, validationResult } = require('express-validator');
const Todo = require('../models/Todo');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

function handleValidation(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: errors.array()[0].msg,
      errors: errors.array(),
    });
  }
  return null;
}

// LIST
router.get('/', async (req, res) => {
  try {
    const { status, priority, q } = req.query;
    const filter = { user: req.user._id };

    if (status === 'completed') filter.completed = true;
    if (status === 'active') filter.completed = false;
    if (priority && ['low', 'medium', 'high'].includes(priority)) {
      filter.priority = priority;
    }
    if (q && String(q).trim()) {
      filter.title = { $regex: String(q).trim(), $options: 'i' };
    }

    const todos = await Todo.find(filter).sort({ completed: 1, createdAt: -1 });
    return res.json({ todos });
  } catch (err) {
    console.error('List todos error:', err);
    return res.status(500).json({ message: 'Failed to load todos.' });
  }
});

// CREATE
router.post(
  '/',
  [
    body('title')
      .trim()
      .isLength({ min: 1, max: 200 })
      .withMessage('Title is required (max 200 characters).'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Description max 1000 characters.'),
    body('priority')
      .optional()
      .isIn(['low', 'medium', 'high'])
      .withMessage('Priority must be low, medium, or high.'),
  ],
  async (req, res) => {
    if (handleValidation(req, res)) return;

    try {
      const { title, description = '', priority = 'medium', dueDate } = req.body;

      const todo = await Todo.create({
        user: req.user._id,
        title: title.trim(),
        description: description?.trim() || '',
        priority,
        dueDate: dueDate || null,
      });

      return res.status(201).json({ message: 'Todo created.', todo });
    } catch (err) {
      console.error('Create todo error:', err);
      return res.status(500).json({ message: 'Failed to create todo.' });
    }
  }
);

// UPDATE
router.put('/:id', async (req, res) => {
  try {
    const todo = await Todo.findOne({ _id: req.params.id, user: req.user._id });
    if (!todo) {
      return res.status(404).json({ message: 'Todo not found.' });
    }

    const { title, description, completed, priority, dueDate } = req.body;

    if (title !== undefined) {
      const t = String(title).trim();
      if (!t || t.length > 200) {
        return res.status(400).json({ message: 'Title must be 1–200 characters.' });
      }
      todo.title = t;
    }
    if (description !== undefined) todo.description = String(description).trim();
    if (completed !== undefined) todo.completed = Boolean(completed);
    if (priority !== undefined) {
      if (!['low', 'medium', 'high'].includes(priority)) {
        return res.status(400).json({ message: 'Invalid priority.' });
      }
      todo.priority = priority;
    }
    if (dueDate !== undefined) todo.dueDate = dueDate || null;

    await todo.save();
    return res.json({ message: 'Todo updated.', todo });
  } catch (err) {
    console.error('Update todo error:', err);
    return res.status(500).json({ message: 'Failed to update todo.' });
  }
});

// TOGGLE
router.patch('/:id/toggle', async (req, res) => {
  try {
    const todo = await Todo.findOne({ _id: req.params.id, user: req.user._id });
    if (!todo) {
      return res.status(404).json({ message: 'Todo not found.' });
    }
    todo.completed = !todo.completed;
    await todo.save();
    return res.json({ message: 'Todo toggled.', todo });
  } catch (err) {
    console.error('Toggle todo error:', err);
    return res.status(500).json({ message: 'Failed to toggle todo.' });
  }
});

// DELETE
router.delete('/:id', async (req, res) => {
  try {
    const todo = await Todo.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });
    if (!todo) {
      return res.status(404).json({ message: 'Todo not found.' });
    }
    return res.json({ message: 'Todo deleted.' });
  } catch (err) {
    console.error('Delete todo error:', err);
    return res.status(500).json({ message: 'Failed to delete todo.' });
  }
});

module.exports = router;
