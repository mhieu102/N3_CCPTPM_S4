const mongoose = require('mongoose');

const studentTermAverageSchema = new mongoose.Schema({
    student_code: { type: String, ref: 'Student', required: true },
    term_code: { type: String, ref: 'Term', required: true },
    term_average: { type: Number, default: 0 },
    classroom_rank: { type: Number, default: null },
    grade_rank: { type: Number, default: null },
    academic_performance: { type: String, default: null },
}, {
    timestamps: true,
});

// Thêm virtual để populate student
studentTermAverageSchema.virtual('student', {
    ref: 'Student',
    localField: 'student_code',
    foreignField: 'student_code',
    justOne: true,
});

// Thêm virtual để populate term
studentTermAverageSchema.virtual('term', {
    ref: 'Term',
    localField: 'term_code',
    foreignField: 'term_code',
    justOne: true,
});

// Bật virtuals trong toObject và toJSON
studentTermAverageSchema.set('toObject', { virtuals: true });
studentTermAverageSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('StudentTermAverage', studentTermAverageSchema);