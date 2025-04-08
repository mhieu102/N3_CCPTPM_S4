const mongoose = require('mongoose');

const subjectYearlyAverageSchema = new mongoose.Schema({
    student_code: { type: String, ref: 'Student', required: true },
    subject_code: { type: String, ref: 'Subject', required: true },
    school_year_code: { type: String, ref: 'SchoolYear', required: true },
    yearly_average: { type: Number, default: 0 },
}, { timestamps: true });

// Định nghĩa các quan hệ
subjectYearlyAverageSchema.virtual('student', {
    ref: 'Student',
    localField: 'student_code',
    foreignField: 'student_code',
    justOne: true,
});

subjectYearlyAverageSchema.virtual('subject', {
    ref: 'Subject',
    localField: 'subject_code',
    foreignField: 'subject_code',
    justOne: true,
});

subjectYearlyAverageSchema.virtual('schoolYear', {
    ref: 'SchoolYear',
    localField: 'school_year_code',
    foreignField: 'school_year_code',
    justOne: true,
});

const SubjectYearlyAverage = mongoose.model('SubjectYearlyAverage', subjectYearlyAverageSchema);
module.exports = SubjectYearlyAverage;