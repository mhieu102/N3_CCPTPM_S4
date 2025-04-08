const mongoose = require('mongoose');

const accessTokenSchema = new mongoose.Schema({
    token: { type: String, required: true, unique: true },
    user_id: { type: String, required: true },
    user_type: { type: String, enum: ['teacher', 'student'], required: true },
    revoked: { type: Boolean, default: false },
    expires_at: { type: Date, required: true },
}, { timestamps: true });

const AccessToken = mongoose.model('AccessToken', accessTokenSchema);
module.exports = AccessToken;