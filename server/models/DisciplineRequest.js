const mongoose = require('mongoose');

const disciplineRequestSchema = new mongoose.Schema({
    school_id: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
    teacher_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' },
    staff_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' },
    student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
    class_name: { type: String }, // For whole class reports
    mistake: { type: String, required: true },
    marks_removed: { type: Number, required: true },
    notes: { type: String },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    target_type: { type: String, enum: ['individual', 'class'], required: true },
    date: { type: Date, default: Date.now },
    reviewed_at: { type: Date }
});

module.exports = mongoose.model('DisciplineRequest', disciplineRequestSchema);
