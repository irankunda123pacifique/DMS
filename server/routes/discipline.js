const express = require('express');
const router = express.Router();
const DisciplineRequest = require('../models/DisciplineRequest');
const Student = require('../models/Student');

// Get all discipline requests for a school
router.get('/:schoolId', async (req, res) => {
    try {
        const requests = await DisciplineRequest.find({ school_id: req.params.schoolId });
        res.json(requests);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Create a new request
router.post('/', async (req, res) => {
    try {
        const request = new DisciplineRequest(req.body);
        const newRequest = await request.save();
        res.status(201).json(newRequest);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Approve/Reject a request
router.patch('/:id/review', async (req, res) => {
    try {
        const { status } = req.body;
        const request = await DisciplineRequest.findById(req.params.id);
        if (!request) return res.status(404).json({ message: 'Request not found' });

        request.status = status;
        request.reviewed_at = new Date();
        const updatedRequest = await request.save();

        if (status === 'approved' && request.student_id) {
            // Deduct marks from student
            await Student.findByIdAndUpdate(request.student_id, {
                $inc: { discipline_marks: -request.marks_removed }
            });
        }

        res.json(updatedRequest);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Cancel/Delete a request (if pending)
router.delete('/:id', async (req, res) => {
    try {
        const request = await DisciplineRequest.findById(req.params.id);
        if (!request) return res.status(404).json({ message: 'Request not found' });
        if (request.status !== 'pending') return res.status(400).json({ message: 'Cannot delete already reviewed request' });

        await DisciplineRequest.findByIdAndDelete(req.params.id);
        res.json({ message: 'Request deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
