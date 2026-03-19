const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
    school_id: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
    full_name: { type: String, required: true },
    class: { type: String, required: true },
    gender: { type: String, enum: ['Male', 'Female'] },
    parent_name: { type: String },
    parent_phone: { type: String },
    profile_image: { type: String }, // Base64
    discipline_marks: { type: Number, default: 100 },
    created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Student', studentSchema);
