const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
    school_id: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
    name: { type: String, required: true },
    teacher_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', default: null },
    created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Class', classSchema);
