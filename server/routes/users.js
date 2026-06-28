const express = require('express');
const router = express.Router();
const Teacher = require('../models/Teacher');
const Staff = require('../models/Staff');

router.get('/teachers/:schoolId', async (req, res) => {
    try {
        const { data, error } = await Teacher.getTeachersBySchool(req.app.locals.db, req.params.schoolId);
        if (error) throw error;
        res.json(data || []);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/teachers', async (req, res) => {
    try {
        const { data, error } = await Teacher.createTeacher(req.app.locals.db, req.body);
        if (error) throw error;
        res.status(201).json(data);
    } catch (err) { res.status(400).json({ message: err.message }); }
});

router.patch('/teachers/:id', async (req, res) => {
    try {
        const { data, error } = await Teacher.updateTeacher(req.app.locals.db, req.params.id, req.body);
        if (error) throw error;
        res.json(data);
    } catch (err) { res.status(400).json({ message: err.message }); }
});

router.delete('/teachers/:id', async (req, res) => {
    try {
        const { error } = await Teacher.deleteTeacher(req.app.locals.db, req.params.id);
        if (error) throw error;
        res.json({ message: 'Teacher deleted' });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/staff/:schoolId', async (req, res) => {
    try {
        const { data, error } = await Staff.getStaffBySchool(req.app.locals.db, req.params.schoolId);
        if (error) throw error;
        res.json(data || []);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/staff', async (req, res) => {
    try {
        const { data, error } = await Staff.createStaff(req.app.locals.db, req.body);
        if (error) throw error;
        res.status(201).json(data);
    } catch (err) { res.status(400).json({ message: err.message }); }
});

router.patch('/staff/:id', async (req, res) => {
    try {
        const { data, error } = await Staff.updateStaff(req.app.locals.db, req.params.id, req.body);
        if (error) throw error;
        res.json(data);
    } catch (err) { res.status(400).json({ message: err.message }); }
});

router.delete('/staff/:id', async (req, res) => {
    try {
        const { error } = await Staff.deleteStaff(req.app.locals.db, req.params.id);
        if (error) throw error;
        res.json({ message: 'Staff deleted' });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
