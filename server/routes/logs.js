const express = require('express');
const router = express.Router();
const Log = require('../models/Log');

router.get('/:schoolId', async (req, res) => {
    try {
        const { data, error } = await Log.getLogsBySchool(req.app.locals.db, req.params.schoolId);
        if (error) throw error;
        res.json(data || []);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/', async (req, res) => {
    try {
        const { data, error } = await Log.createLog(req.app.locals.db, req.body);
        if (error) throw error;
        res.status(201).json(data);
    } catch (err) { res.status(400).json({ message: err.message }); }
});

router.delete('/:schoolId', async (req, res) => {
    try {
        const { error } = await Log.deleteLogs(req.app.locals.db, req.params.schoolId);
        if (error) throw error;
        res.json({ message: 'Logs cleared' });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
