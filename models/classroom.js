const mongoose = require('mongoose');

const classroomSchema = new mongoose.Schema({
    classroom_code: { type: String, required: true, unique: true },
    classroom_name: { type: String, required: true },
    grade_code: { type: String, ref: 'Grade', default: null },
    student_count: { type: Number, default: 0 },
    homeroom_teacher_code: { type: String, ref: 'Teacher', default: null },
}, {
    timestamps: true,
});

classroomSchema.virtual('teachers', {
    ref: 'ClassroomTeacher',
    localField: 'classroom_code',
    foreignField: 'classroom_code',
});

classroomSchema.virtual('students', {
    ref: 'Student',
    localField: 'classroom_code',
    foreignField: 'classroom_code',
});

classroomSchema.virtual('homeroomTeacher', {
    ref: 'Teacher',
    localField: 'homeroom_teacher_code',
    foreignField: 'teacher_code',
    justOne: true,
});

const Classroom = mongoose.model('Classroom', classroomSchema);
module.exports = Classroom;