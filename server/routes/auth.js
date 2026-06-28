const express = require('express');
const router = express.Router();
const School = require('../models/School');
const Teacher = require('../models/Teacher');
const Staff = require('../models/Staff');
const Log = require('../models/Log');

router.post('/login/dod', async (req, res) => {
    try {
        const db = req.app.locals.db;
        const { username, password } = req.body;
        const { data: school } = await School.getSchoolByDodUsername(db, username);
        if (!school || school.password !== password)
            return res.status(401).json({ message: 'Invalid username or password' });
        res.json({ role: 'dod', id: school.id, username: school.dod_username, schoolId: school.id, schoolName: school.school_name });
        Log.createLog(db, { school_id: school.id, message: `DOD "${username}" logged in`, user: username, category: 'auth', action_type: 'login' });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/login/teacher', async (req, res) => {
    try {
        const db = req.app.locals.db;
        const { username, password } = req.body;
        const { data: teacher } = await Teacher.getTeacherByUsername(db, username);
        if (!teacher || teacher.password !== password)
            return res.status(401).json({ message: 'Invalid username or password' });
        if (teacher.status === 'pending')
            return res.status(401).json({ message: 'Your account is awaiting approval' });
        res.json({ role: 'teacher', id: teacher.id, username: teacher.username, name: teacher.name, schoolId: teacher.school_id });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/login/staff', async (req, res) => {
    try {
        const db = req.app.locals.db;
        const { username, password } = req.body;
        const { data: staff } = await Staff.getStaffByUsername(db, username);
        if (!staff || staff.password !== password)
            return res.status(401).json({ message: 'Invalid username or password' });
        if (staff.status === 'pending')
            return res.status(401).json({ message: 'Your account is awaiting approval' });
        res.json({ role: 'staff', id: staff.id, username: staff.username, name: staff.name, schoolId: staff.school_id });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/register/school', async (req, res) => {
    try {
        const db = req.app.locals.db;
        const { data: newSchool, error } = await School.createSchool(db, req.body);
        if (error) throw error;
        res.status(201).json(newSchool);
    } catch (err) { res.status(400).json({ message: err.message }); }
});

router.post('/register/teacher', async (req, res) => {
    try {
        const db = req.app.locals.db;
        const { promo_code, ...data } = req.body;
        const { data: school } = await School.getSchoolByPromoCode(db, promo_code);
        if (!school) return res.status(400).json({ message: 'Invalid promo code' });
        const { data: newTeacher, error } = await Teacher.createTeacher(db, { ...data, school_id: school.id, status: 'pending' });
        if (error) throw error;
        Log.createLog(db, { school_id: school.id, message: `New teacher: ${newTeacher.name}`, user: newTeacher.name, category: 'teacher', action_type: 'register' });
        res.status(201).json(newTeacher);
    } catch (err) { res.status(400).json({ message: err.message }); }
});

router.post('/register/staff', async (req, res) => {
    try {
        const db = req.app.locals.db;
        const { promo_code, ...data } = req.body;
        const { data: school } = await School.getSchoolByPromoCode(db, promo_code);
        if (!school) return res.status(400).json({ message: 'Invalid promo code' });
        const { data: newStaff, error } = await Staff.createStaff(db, { ...data, school_id: school.id, status: 'pending' });
        if (error) throw error;
        res.status(201).json(newStaff);
    } catch (err) { res.status(400).json({ message: err.message }); }
});

module.exports = router;
