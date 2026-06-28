const express = require('express');
const router = express.Router();
const DisciplineRequest = require('../models/DisciplineRequest');
const Student = require('../models/Student');
const whatsapp = require('../services/whatsapp');

// WhatsApp status
router.get('/whatsapp/status', (req, res) => {
    res.json({ ready: whatsapp.isReady() });
});

// Initialize WhatsApp Web manually
router.post('/whatsapp/init', (req, res) => {
    try {
        whatsapp.init();
        res.json({ message: 'WhatsApp Web initialization started', note: 'Check server logs for QR code' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Send custom WhatsApp message / notify parent manually
router.post('/whatsapp/send', async (req, res) => {
    try {
        const { phoneNumber, message } = req.body;
        if (!phoneNumber || !message) {
            return res.status(400).json({ message: 'Phone number and message are required' });
        }
        const result = await whatsapp.sendMessage(phoneNumber, message);
        res.json(result);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Test WhatsApp endpoint
router.post('/whatsapp/test', async (req, res) => {
    try {
        const { phoneNumber, message } = req.body;
        const result = await whatsapp.sendMessage(phoneNumber || 'test', message || 'Test message');
        res.json(result);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.get('/:schoolId', async (req, res) => {
    try {
        const { data, error } = await DisciplineRequest.getRequestsBySchool(req.app.locals.db, req.params.schoolId);
        if (error) throw error;
        res.json(data || []);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/', async (req, res) => {
    try {
        const { data, error } = await DisciplineRequest.createRequest(req.app.locals.db, req.body);
        if (error) throw error;
        res.status(201).json(data);
    } catch (err) { res.status(400).json({ message: err.message }); }
});

router.patch('/:id/review', async (req, res) => {
    try {
        const db = req.app.locals.db;
        const { status, reviewed_by } = req.body;
        if (!['approved', 'rejected'].includes(status)) {
            return res.status(400).json({ message: 'Status must be approved or rejected' });
        }

        const { data: request } = await DisciplineRequest.getRequestById(db, req.params.id);
        if (!request) return res.status(404).json({ message: 'Request not found' });

        if (request.status !== 'pending') {
            return res.status(400).json({ message: 'Request has already been reviewed' });
        }

        const marksRemoved = Number(request.marks_removed || 0);
        const notified = [];

        if (status === 'approved') {
            if (request.target_type === 'class') {
                const { data: students, error } = await Student.getStudentsBySchool(db, request.school_id);
                if (error) throw error;

                const classStudents = (students || []).filter(student => student.class === request.class_name);
                for (const student of classStudents) {
                    const currentMarks = Number(student.discipline_marks ?? 100);
                    const discipline_marks = Math.max(0, currentMarks - marksRemoved);
                    const { data: updatedStudent, error: updateError } = await Student.updateStudent(db, student.id, { discipline_marks });
                    if (updateError) throw updateError;

                    if (updatedStudent && updatedStudent.parent_phone) {
                        notified.push(await whatsapp.notifyParent(
                            updatedStudent,
                            marksRemoved,
                            request.mistake || request.notes || 'Discipline violation'
                        ));
                    }
                }
            } else if (request.student_id) {
                const { data: student } = await Student.getStudentById(db, request.student_id);
                if (!student) return res.status(404).json({ message: 'Student not found' });

                const currentMarks = Number(student.discipline_marks ?? 100);
                const discipline_marks = Math.max(0, currentMarks - marksRemoved);
                const { data: updatedStudent, error: updateError } = await Student.updateStudent(db, student.id, { discipline_marks });
                if (updateError) throw updateError;

                if (updatedStudent.parent_phone) {
                    notified.push(await whatsapp.notifyParent(
                        updatedStudent,
                        marksRemoved,
                        request.mistake || request.notes || 'Discipline violation'
                    ));
                }
            }
        }

        const { data: updated, error } = await DisciplineRequest.updateRequest(db, req.params.id, {
            status,
            reviewed_by: reviewed_by || null,
            reviewed_at: new Date().toISOString()
        });
        if (error) throw error;

        res.json({ ...updated, notifications: notified });
    } catch (err) { res.status(400).json({ message: err.message }); }
});

router.delete('/:id', async (req, res) => {
    try {
        const db = req.app.locals.db;
        const { data: request } = await DisciplineRequest.getRequestById(db, req.params.id);
        if (!request) return res.status(404).json({ message: 'Request not found' });
        if (request.status !== 'pending') return res.status(400).json({ message: 'Cannot delete already reviewed request' });
        await DisciplineRequest.deleteRequest(db, req.params.id);
        res.json({ message: 'Request deleted' });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
