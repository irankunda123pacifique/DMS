const express = require('express');
const router = express.Router();
const School = require('../models/School');
const Teacher = require('../models/Teacher');
const Staff = require('../models/Staff');

// DoD Login
router.post('/login/dod', async (req, res) => {
    try {
        const { username, password } = req.body;
        const school = await School.findOne({ dod_username: username });
        if (!school || school.password !== password) {
            return res.status(401).json({ message: 'Invalid username or password' });
        }
        res.json({
            role: 'dod',
            id: school._id,
            username: school.dod_username,
            schoolId: school._id,
            schoolName: school.school_name
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Teacher Login
router.post('/login/teacher', async (req, res) => {
    try {
        const { username, password } = req.body;
        const teacher = await Teacher.findOne({ username });
        if (!teacher || teacher.password !== password) {
            return res.status(401).json({ message: 'Invalid username or password' });
        }
        if (teacher.status === 'pending') {
            return res.status(401).json({ message: 'Your account is awaiting approval' });
        }
        res.json({
            role: 'teacher',
            id: teacher._id,
            username: teacher.username,
            name: teacher.name,
            schoolId: teacher.school_id
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Staff Login
router.post('/login/staff', async (req, res) => {
    try {
        const { username, password } = req.body;
        const staff = await Staff.findOne({ username });
        if (!staff || staff.password !== password) {
            return res.status(401).json({ message: 'Invalid username or password' });
        }
        if (staff.status === 'pending') {
            return res.status(401).json({ message: 'Your account is awaiting approval' });
        }
        res.json({
            role: 'staff',
            id: staff._id,
            username: staff.username,
            name: staff.name,
            schoolId: staff.school_id
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Register School (DoD)
router.post('/register/school', async (req, res) => {
    try {
        const school = new School(req.body);
        const newSchool = await school.save();
        res.status(201).json(newSchool);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Register Teacher
router.post('/register/teacher', async (req, res) => {
    try {
        const { promo_code, ...data } = req.body;
        const school = await School.findOne({ promo_code });
        if (!school) return res.status(400).json({ message: 'Invalid promo code' });

        const teacher = new Teacher({ ...data, school_id: school._id, status: 'pending' });
        const newTeacher = await teacher.save();
        res.status(201).json(newTeacher);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Register Staff
router.post('/register/staff', async (req, res) => {
    try {
        const { promo_code, ...data } = req.body;
        const school = await School.findOne({ promo_code });
        if (!school) return res.status(400).json({ message: 'Invalid promo code' });

        const staff = new Staff({ ...data, school_id: school._id, status: 'pending' });
        const newStaff = await staff.save();
        res.status(201).json(newStaff);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

module.exports = router;
