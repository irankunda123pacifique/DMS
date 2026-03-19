const mongoose = require('mongoose');

const schoolSchema = new mongoose.Schema({
    school_name: { type: String, required: true },
    dod_username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    promo_code: { type: String, required: true },
    created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('School', schoolSchema);
