const express = require('express');
const router = express.Router();
const Student = require('../models/Student');

router.get('/:schoolId', async (req, res) => {
    try {
        const { data, error } = await Student.getStudentsBySchool(req.app.locals.db, req.params.schoolId);
        if (error) throw error;
        res.json(data || []);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/', async (req, res) => {
    try {
        const { data, error } = await Student.createStudent(req.app.locals.db, req.body);
        if (error) throw error;
        res.status(201).json(data);
    } catch (err) { res.status(400).json({ message: err.message }); }
});

router.patch('/:id', async (req, res) => {
    try {
        const { data, error } = await Student.updateStudent(req.app.locals.db, req.params.id, req.body);
        if (error) throw error;
        res.json(data);
    } catch (err) { res.status(400).json({ message: err.message }); }
});

router.delete('/:id', async (req, res) => {
    try {
        const { error } = await Student.deleteStudent(req.app.locals.db, req.params.id);
        if (error) throw error;
        res.json({ message: 'Student deleted' });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
