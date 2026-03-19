const express = require('express');
const router = express.Router();
const Student = require('../models/Student');

// Get all students for a school
router.get('/:schoolId', async (req, res) => {
    try {
        const students = await Student.find({ school_id: req.params.schoolId });
        res.json(students);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Create a student
router.post('/', async (req, res) => {
    try {
        const student = new Student(req.body);
        const newStudent = await student.save();
        res.status(201).json(newStudent);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Update a student
router.patch('/:id', async (req, res) => {
    try {
        const student = await Student.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(student);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Delete a student
router.delete('/:id', async (req, res) => {
    try {
        await Student.findByIdAndDelete(req.params.id);
        res.json({ message: 'Student deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
