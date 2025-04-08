const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
    subject_code: { type: String, required: true, unique: true },
    subject_name: { type: String, required: true },
}, {
    timestamps: true,
});

subjectSchema.virtual('teachers', {
    ref: 'TeacherSubject',
    localField: 'subject_code',
    foreignField: 'subject_code',
});

subjectSchema.virtual('scores', {
    ref: 'Score',
    localField: 'subject_code',
    foreignField: 'subject_code',
});

const Subject = mongoose.model('Subject', subjectSchema);
module.exports = Subject;