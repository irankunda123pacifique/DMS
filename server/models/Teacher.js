const mongoose = require('mongoose');

const teacherSchema = new mongoose.Schema({
    school_id: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
    name: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    subject: { type: String },
    phone: { type: String },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    profile_image: { type: String }, // Base64
    created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Teacher', teacherSchema);
