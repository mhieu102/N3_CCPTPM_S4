const mongoose = require('mongoose');

const subjectAverageSchema = new mongoose.Schema({
    student_code: { type: String, ref: 'Student', required: true },
    subject_code: { type: String, ref: 'Subject', required: true },
    term_code: { type: String, ref: 'Term', required: true },
    term_average: { type: Number, default: 0 },
}, { timestamps: true });

// Định nghĩa các quan hệ
subjectAverageSchema.virtual('student', {
    ref: 'Student',
    localField: 'student_code',
    foreignField: 'student_code',
    justOne: true,
});

subjectAverageSchema.virtual('subject', {
    ref: 'Subject',
    localField: 'subject_code',
    foreignField: 'subject_code',
    justOne: true,
});

subjectAverageSchema.virtual('term', {
    ref: 'Term',
    localField: 'term_code',
    foreignField: 'term_code',
    justOne: true,
});

const SubjectAverage = mongoose.model('SubjectAverage', subjectAverageSchema);
module.exports = SubjectAverage;