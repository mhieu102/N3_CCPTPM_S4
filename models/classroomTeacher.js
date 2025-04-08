const mongoose = require('mongoose');

const classroomTeacherSchema = new mongoose.Schema({
    classroom_code: { type: String, ref: 'Classroom', required: true },
    teacher_code: { type: String, ref: 'Teacher', required: true },
    subject_code: { type: String, ref: 'Subject', required: true },
}, {
    timestamps: true,
});

const ClassroomTeacher = mongoose.model('ClassroomTeacher', classroomTeacherSchema);
module.exports = ClassroomTeacher;