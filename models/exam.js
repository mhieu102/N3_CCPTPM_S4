const mongoose = require('mongoose');

const examSchema = new mongoose.Schema({
    exam_code: { type: String, required: true, unique: true },
    exam_name: { type: String, required: true },
    subject_code: { type: String, ref: 'Subject', required: true },
    term_code: { type: String, ref: 'Term', required: true },
    date: { type: Date, required: true },
}, {
    timestamps: true,
});

examSchema.virtual('scores', {
    ref: 'Score',
    localField: 'exam_code',
    foreignField: 'exam_code',
});

const Exam = mongoose.model('Exam', examSchema);
module.exports = Exam;