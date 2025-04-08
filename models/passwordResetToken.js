const mongoose = require('mongoose');

const passwordResetTokenSchema = new mongoose.Schema({
    email: { type: String, required: true },
    token: { type: String, required: true },
    createdAt: { type: Date, default: Date.now, expires: 3600 } // Token hết hạn sau 1 giờ
});

module.exports = mongoose.model('PasswordResetToken', passwordResetTokenSchema);