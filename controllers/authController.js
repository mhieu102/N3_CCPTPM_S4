const { success, fail } = require('../utils/responseFormatter');
const Teacher = require('../models/teacher');
const Student = require('../models/student');
const Role = require('../models/role');
const TeacherSubject = require('../models/teacherSubject');
const ClassroomTeacher = require('../models/classroomTeacher');
const {
    checkEmailExists,
    generateCode,
    generateToken,
    saveAccessToken,
    findUserByEmail,
} = require('../utils/authUtils');
const bcrypt = require('bcryptjs');
const { forgotPasswordService, resetPasswordService, validateTokenService } = require('../services/passwordService');
const { validateAndAssignHomeroomTeacher, assignClassroomForStudent } = require('../services/authService');

const register = async (req, res) => {
    try {
        const { name, email, password, role_code, classroom_code, subject_codes, grade_code } = req.body;

        if (await checkEmailExists(email)) {
            return fail(res, 'Email đã tồn tại', null, 422);
        }

        const role = await Role.findOne({ role_code });
        if (!role) {
            return fail(res, 'role_code không hợp lệ', null, 422);
        }

        if (role_code === 'R1') {
            if (!subject_codes || !Array.isArray(subject_codes) || subject_codes.length === 0) {
                return fail(res, 'Giáo viên cần ít nhất một subject_code', null, 422);
            }
        } else if (role_code === 'R2') {
            if (!grade_code) {
                return fail(res, 'grade_code là bắt buộc cho học sinh', null, 422);
            }
        }

        const code = await generateCode(role_code);
        let user;

        if (role_code === 'R1') {
            user = new Teacher({ teacher_code: code, email, password, name, role_code });
            await user.save();

            if (subject_codes) {
                const teacherSubjects = subject_codes.map(subject_code => ({
                    teacher_code: code,
                    subject_code,
                }));
                await TeacherSubject.insertMany(teacherSubjects);
            }

            if (classroom_code) {
                await validateAndAssignHomeroomTeacher(user, classroom_code);

                // Tự động gán các môn giáo viên đăng ký vào ClassroomTeacher
                const classroomTeacherData = subject_codes.map(subject_code => ({
                    classroom_code,
                    teacher_code: code,
                    subject_code,
                }));
                await ClassroomTeacher.insertMany(classroomTeacherData);
            }
        } else if (role_code === 'R2') {
            const classroom = await assignClassroomForStudent(grade_code);
            user = new Student({
                student_code: code,
                email,
                password,
                name,
                role_code,
                classroom_code: classroom.classroom_code,
            });
            await user.save();
        }

        const token = generateToken(code, role_code === 'R1' ? 'teacher' : 'student');
        await saveAccessToken(token, code, role_code === 'R1' ? 'teacher' : 'student');

        return success(res, { token }, 'Đăng ký thành công', 201);
    } catch (error) {
        return fail(res, 'Lỗi server: ' + error.message, null, 500);
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        let user = await Teacher.findOne({ email });
        if (!user) {
            user = await Student.findOne({ email });
        }

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return fail(res, 'Thông tin đăng nhập không hợp lệ', null, 401);
        }

        const code = user.teacher_code || user.student_code;
        const type = user.teacher_code ? 'teacher' : 'student';
        const token = generateToken(code, type);
        await saveAccessToken(token, code, type);

        return success(res, { token }, 'Đăng nhập thành công');
    } catch (error) {
        return fail(res, 'Lỗi server: ' + error.message, null, 500);
    }
};

const logout = async (req, res) => {
    try {
        const token = req.token;
        await AccessToken.updateOne({ token }, { revoked: true });
        return success(res, null, 'Đăng xuất thành công', 204);
    } catch (error) {
        return fail(res, 'Lỗi server: ' + error.message, null, 500);
    }
};

const getUser = (req, res) => {
    const { password, ...userData } = req.user.toObject();
    return success(res, userData, 'Lấy thông tin người dùng thành công');
};

const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const result = await forgotPasswordService(email);
        return success(res, result, 'Gửi yêu cầu đặt lại mật khẩu thành công');
    } catch (error) {
        return fail(res, 'Lỗi server: ' + error.message, null, 500);
    }
};

const resetPassword = async (req, res) => {
    try {
        const { password, password_confirmation } = req.body;
        const email = req.query.email;
        const token = req.headers.authorization?.split(' ')[1];

        if (!email || !token) {
            return fail(res, 'Email và token là bắt buộc', null, 400);
        }

        if (!password || !password_confirmation) {
            return fail(res, 'Mật khẩu và xác nhận mật khẩu là bắt buộc', null, 400);
        }

        const result = await resetPasswordService(email, token, password, password_confirmation);
        return success(res, result, 'Đặt lại mật khẩu thành công');
    } catch (error) {
        return fail(res, 'Yêu cầu không hợp lệ: ' + error.message, null, 400);
    }
};

const validateToken = async (req, res) => {
    try {
        const { email } = req.query;
        if (!email) {
            return fail(res, 'Email là bắt buộc', null, 400);
        }
        const result = await validateTokenService(email);
        return success(res, { token: result.token }, 'Token hợp lệ');
    } catch (error) {
        return fail(res, error.message || 'Yêu cầu không hợp lệ', null, 400);
    }
};

module.exports = { register, login, logout, getUser, forgotPassword, resetPassword, validateToken };