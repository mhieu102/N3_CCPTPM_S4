const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const teacherSchema = new mongoose.Schema({
    teacher_code: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    name: { type: String, required: true },
    googleId: { type: String, unique: true, sparse: true },
    role_code: { type: String, ref: 'Role', required: true },
    avatarUrl: { type: String, default: null},
}, {
    timestamps: true,
});

teacherSchema.pre('save', async function (next) {
    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 10);
    }
    next();
});

teacherSchema.statics.findByEmail = async function (email) {
    return this.findOne({ email });
};

teacherSchema.statics.findByCode = async function (teacher_code) {
    return this.findOne({ teacher_code });
};

teacherSchema.virtual('classrooms', {
    ref: 'ClassroomTeacher',
    localField: 'teacher_code',
    foreignField: 'teacher_code',
});

teacherSchema.virtual('subjects', {
    ref: 'TeacherSubject',
    localField: 'teacher_code',
    foreignField: 'teacher_code',
});

teacherSchema.virtual('scores', {
    ref: 'Score',
    localField: 'teacher_code',
    foreignField: 'subject_code',
});

teacherSchema.virtual('homeroomClass', {
    ref: 'Classroom',
    localField: 'teacher_code',
    foreignField: 'homeroom_teacher_code',
    justOne: true,
});

const Teacher = mongoose.model('Teacher', teacherSchema);
module.exports = Teacher;