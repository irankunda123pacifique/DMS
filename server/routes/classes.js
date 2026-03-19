const express = require('express');
const router = express.Router();
const ClassModel = require('../models/Class');

// Get all classes for a school
router.get('/:schoolId', async (req, res) => {
    try {
        const classes = await ClassModel.find({ school_id: req.params.schoolId });
        res.json(classes);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Create a class
router.post('/', async (req, res) => {
    try {
        const newClass = new ClassModel(req.body);
        const savedClass = await newClass.save();
        res.status(201).json(savedClass);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Update class (e.g., assign teacher)
router.patch('/:id', async (req, res) => {
    try {
        const updatedClass = await ClassModel.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updatedClass);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Delete a class
router.delete('/:id', async (req, res) => {
    try {
        await ClassModel.findByIdAndDelete(req.params.id);
        res.json({ message: 'Class deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
