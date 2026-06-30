const express = require('express');
const router = express.Router();
const DisciplineRequest = require('../models/DisciplineRequest');
const Student = require('../models/Student');
const whatsapp = require('../services/whatsapp');

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

// Generic patch (status updates from dashboard)
router.patch('/:id', async (req, res) => {
    try {
        const db = req.app.locals.db;
        const updates = { ...req.body };

        // If approving, deduct marks
        if (updates.status === 'approved') {
            const { data: request } = await DisciplineRequest.getRequestById(db, req.params.id);
            if (request && request.status === 'pending') {
                const marksRemoved = Number(request.marks_removed || 0);
                if (request.target_type === 'class') {
                    const { data: students } = await Student.getStudentsBySchool(db, request.school_id);
                    for (const s of (students || []).filter(s => s.class === request.class_name)) {
                        const newMarks = Math.max(0, Number(s.discipline_marks ?? 100) - marksRemoved);
                        const { data: updated } = await Student.updateStudent(db, s.id, { discipline_marks: newMarks });
                        if (updated && updated.parent_phone) {
                            whatsapp.notifyParent(updated, marksRemoved, request.mistake).catch(() => {});
                        }
                    }
                } else if (request.student_id) {
                    const { data: s } = await Student.getStudentById(db, request.student_id);
                    if (s) {
                        const newMarks = Math.max(0, Number(s.discipline_marks ?? 100) - marksRemoved);
                        const { data: updated } = await Student.updateStudent(db, s.id, { discipline_marks: newMarks });
                        if (updated && updated.parent_phone) {
                            whatsapp.notifyParent(updated, marksRemoved, request.mistake).catch(() => {});
                        }
                    }
                }
            }
        }

        if (!updates.reviewed_at && (updates.status === 'approved' || updates.status === 'rejected')) {
            updates.reviewed_at = new Date().toISOString().slice(0, 19).replace('T', ' ');
        }

        const { data, error } = await DisciplineRequest.updateRequest(db, req.params.id, updates);
        if (error) throw error;
        res.json(data);
    } catch (err) { res.status(400).json({ message: err.message }); }
});

// DOD direct mark deduction — no request needed
router.post('/deduct', async (req, res) => {
    try {
        const db = req.app.locals.db;
        const { student_id, marks_removed, reason, reviewed_by } = req.body;
        if (!student_id || !marks_removed || !reason) return res.status(400).json({ message: 'student_id, marks_removed, reason required' });

        const { data: student } = await Student.getStudentById(db, student_id);
        if (!student) return res.status(404).json({ message: 'Student not found' });

        const newMarks = Math.max(0, Number(student.discipline_marks ?? 100) - Number(marks_removed));
        const { data: updated } = await Student.updateStudent(db, student_id, { discipline_marks: newMarks });

        // Send WhatsApp notification to parent
        if (updated && updated.parent_phone) {
            whatsapp.notifyParent(updated, marks_removed, reason).catch(e => console.error('WA notify error:', e.message));
        }

        res.json({ success: true, student: updated, newMarks });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

router.delete('/:id', async (req, res) => {
    try {
        const { error } = await DisciplineRequest.deleteRequest(req.app.locals.db, req.params.id);
        if (error) throw error;
        res.json({ message: 'Request deleted' });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
