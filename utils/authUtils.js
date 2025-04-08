const Teacher = require('../models/teacher');
const Student = require('../models/student');
const AccessToken = require('../models/accessToken');
const jwt = require('jsonwebtoken');

const checkEmailExists = async (email) => {
    const teacher = await Teacher.findByEmail(email);
    const student = await Student.findByEmail(email);
    return teacher || student;
};

const generateCode = async (role_code) => {
    if (role_code === 'R1') {
        const latestTeacher = await Teacher.findOne().sort('-teacher_code');
        const number = latestTeacher ? parseInt(latestTeacher.teacher_code.slice(1)) + 1 : 1;
        return `T${number}`;
    } else if (role_code === 'R2') {
        // Lấy tất cả student_code hiện có để tìm mã lớn nhất
        const students = await Student.find({}, 'student_code');
        let maxNumber = 0;

        students.forEach(student => {
            const number = parseInt(student.student_code.slice(1));
            if (number > maxNumber) maxNumber = number;
        });

        const nextNumber = maxNumber + 1;
        return `S${nextNumber}`;
    }
    throw new Error('Invalid role_code');
};

const generateToken = (id, type) => {
    return jwt.sign({ id, type }, process.env.JWT_SECRET, { expiresIn: '1h' });
};

const saveAccessToken = async (token, user_id, user_type) => {
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 giờ
    const accessToken = new AccessToken({
        token,
        user_id,
        user_type,
        expires_at: expiresAt,
    });
    await accessToken.save();
};

const findUserByEmail = async (email) => {
    let user = await Teacher.findByEmail(email);
    let type = 'teacher';
    if (!user) {
        user = await Student.findByEmail(email);
        type = 'student';
    }
    return { user, type };
};

module.exports = {
    checkEmailExists,
    generateCode,
    generateToken,
    saveAccessToken,
    findUserByEmail,
};