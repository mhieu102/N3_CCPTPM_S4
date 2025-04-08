const mongoose = require('mongoose');

const teacherSubjectSchema = new mongoose.Schema({
    teacher_code: { type: String, ref: 'Teacher', required: true },
    subject_code: { type: String, ref: 'Subject', required: true },
}, {
    timestamps: true,
});

const TeacherSubject = mongoose.model('TeacherSubject', teacherSubjectSchema);
module.exports = TeacherSubject;