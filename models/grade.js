const mongoose = require('mongoose');

const gradeSchema = new mongoose.Schema({
    grade_code: { type: String, required: true, unique: true },
    grade_name: { type: String, required: true },
    classroom_count: { type: Number, default: null },
    school_year_code: { type: String, ref: 'SchoolYear', required: true },
}, {
    timestamps: true,
});

gradeSchema.virtual('student', {
    ref: 'Student',
    localField: 'student_code',
    foreignField: 'student_code',
    justOne: true,
});

gradeSchema.virtual('schoolYear', {
    ref: 'SchoolYear',
    localField: 'school_year_code',
    foreignField: 'school_year_code',
    justOne: true,
});

const Grade = mongoose.model('Grade', gradeSchema);
module.exports = Grade;