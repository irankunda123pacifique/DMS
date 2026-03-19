const express = require('express');
const router = express.Router();
const Log = require('../models/Log');

// Get all logs for a school
router.get('/:schoolId', async (req, res) => {
    try {
        const logs = await Log.find({ school_id: req.params.schoolId }).sort({ timestamp: -1 });
        res.json(logs);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Create a log
router.post('/', async (req, res) => {
    try {
        const newLog = new Log(req.body);
        const savedLog = await newLog.save();
        res.status(201).json(savedLog);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Clear logs for a school (if DoD wishes)
router.delete('/:schoolId', async (req, res) => {
    try {
        await Log.deleteMany({ school_id: req.params.schoolId });
        res.json({ message: 'Logs cleared' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
