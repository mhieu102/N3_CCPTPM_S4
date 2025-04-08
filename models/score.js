const mongoose = require('mongoose');

const scoreSchema = new mongoose.Schema({
    student_code: { type: String, ref: 'Student', required: true },
    exam_code: { type: String, ref: 'Exam', required: true },
    score_value: { type: Number, required: true },
}, {
    timestamps: true,
});

// Thêm virtual để populate student
scoreSchema.virtual('student', {
    ref: 'Student',
    localField: 'student_code',
    foreignField: 'student_code',
    justOne: true,
});

// Thêm virtual để populate exam
scoreSchema.virtual('exam', {
    ref: 'Exam',
    localField: 'exam_code',
    foreignField: 'exam_code',
    justOne: true,
});

// Bật virtuals trong toObject và toJSON
scoreSchema.set('toObject', { virtuals: true });
scoreSchema.set('toJSON', { virtuals: true });

const Score = mongoose.model('Score', scoreSchema);
module.exports = Score;