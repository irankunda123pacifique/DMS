const express = require('express');
const router = express.Router();
const ClassModel = require('../models/Class');

router.get('/:schoolId', async (req, res) => {
    try {
        const { data, error } = await ClassModel.getClassesBySchool(req.app.locals.db, req.params.schoolId);
        if (error) throw error;
        res.json(data || []);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/', async (req, res) => {
    try {
        const { data, error } = await ClassModel.createClass(req.app.locals.db, req.body);
        if (error) throw error;
        res.status(201).json(data);
    } catch (err) { res.status(400).json({ message: err.message }); }
});

router.patch('/:id', async (req, res) => {
    try {
        const { data, error } = await ClassModel.updateClass(req.app.locals.db, req.params.id, req.body);
        if (error) throw error;
        res.json(data);
    } catch (err) { res.status(400).json({ message: err.message }); }
});

router.delete('/:id', async (req, res) => {
    try {
        const { error } = await ClassModel.deleteClass(req.app.locals.db, req.params.id);
        if (error) throw error;
        res.json({ message: 'Class deleted' });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
