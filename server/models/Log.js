const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
    school_id: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
    message: { type: String, required: true },
    user: { type: String, required: true },
    category: { type: String, enum: ['auth', 'student', 'teacher', 'class', 'discipline', 'staff'], required: true },
    action_type: { type: String }, // Optional specificity
    timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Log', logSchema);
