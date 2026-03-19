const express = require('express');
const router = express.Router();
const Teacher = require('../models/Teacher');
const Staff = require('../models/Staff');

// Get all teachers for a school
router.get('/teachers/:schoolId', async (req, res) => {
    try {
        const teachers = await Teacher.find({ school_id: req.params.schoolId });
        res.json(teachers);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Create/Register a teacher
router.post('/teachers', async (req, res) => {
    try {
        const teacher = new Teacher(req.body);
        const newTeacher = await teacher.save();
        res.status(201).json(newTeacher);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Update Teacher (e.g., approval or settings)
router.patch('/teachers/:id', async (req, res) => {
    try {
        const teacher = await Teacher.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(teacher);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Delete a Teacher
router.delete('/teachers/:id', async (req, res) => {
    try {
        await Teacher.findByIdAndDelete(req.params.id);
        res.json({ message: 'Teacher deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get all staff for a school
router.get('/staff/:schoolId', async (req, res) => {
    try {
        const staff = await Staff.find({ school_id: req.params.schoolId });
        res.json(staff);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Create/Register a staff
router.post('/staff', async (req, res) => {
    try {
        const staff = new Staff(req.body);
        const newStaff = await staff.save();
        res.status(201).json(newStaff);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Update Staff
router.patch('/staff/:id', async (req, res) => {
    try {
        const staffMember = await Staff.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(staffMember);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Delete a Staff
router.delete('/staff/:id', async (req, res) => {
    try {
        await Staff.findByIdAndDelete(req.params.id);
        res.json({ message: 'Staff deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
