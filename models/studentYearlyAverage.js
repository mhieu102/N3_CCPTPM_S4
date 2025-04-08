const mongoose = require('mongoose');

const studentYearlyAverageSchema = new mongoose.Schema({
    student_code: { type: String, ref: 'Student', required: true },
    school_year_code: { type: String, ref: 'SchoolYear', required: true },
    yearly_average: { type: Number, default: 0 },
    classroom_rank: { type: Number, default: null },
    grade_rank: { type: Number, default: null },
    academic_performance: { type: String, default: null },
}, { timestamps: true });

// Định nghĩa các quan hệ
studentYearlyAverageSchema.virtual('student', {
    ref: 'Student',
    localField: 'student_code',
    foreignField: 'student_code',
    justOne: true,
});

studentYearlyAverageSchema.virtual('schoolYear', {
    ref: 'SchoolYear',
    localField: 'school_year_code',
    foreignField: 'school_year_code',
    justOne: true,
});

const StudentYearlyAverage = mongoose.model('StudentYearlyAverage', studentYearlyAverageSchema);
module.exports = StudentYearlyAverage;