const Classroom = require('../models/classroom');
const Teacher = require('../models/teacher');

/**
 * Gán giáo viên làm chủ nhiệm nếu lớp chưa có giáo viên chủ nhiệm
 * @param {Object} teacher - Đối tượng Teacher vừa được tạo
 * @param {string} classroomCode - Mã lớp học
 * @throws {Error} Nếu lớp không tồn tại hoặc đã có giáo viên chủ nhiệm
 */
const assignHomeroomTeacher = async (teacher, classroomCode) => {
    const classroom = await Classroom.findOne({ classroom_code: classroomCode });
    if (!classroom) {
        throw new Error('Lớp không tồn tại');
    }

    if (classroom.homeroom_teacher_code !== null) {
        throw new Error('Lớp này đã có giáo viên chủ nhiệm');
    }

    classroom.homeroom_teacher_code = teacher.teacher_code;
    await classroom.save();
};

/**
 * Kiểm tra và gán giáo viên làm chủ nhiệm nếu hợp lệ
 * @param {Object} user - Đối tượng người dùng vừa được tạo
 * @param {string} classroomCode - Mã lớp học
 * @throws {Error} Nếu classroom_code không hợp lệ
 */
const validateAndAssignHomeroomTeacher = async (user, classroomCode) => {
    // Validation classroom_code
    if (typeof classroomCode !== 'string' || !classroomCode.trim()) {
        throw new Error('classroom_code phải là chuỗi hợp lệ');
    }

    await assignHomeroomTeacher(user, classroomCode);
};

/**
 * Tự động xếp học sinh vào lớp dựa trên grade_code
 * @param {string} gradeCode - Mã khối của học sinh
 * @returns {Object} Đối tượng Classroom được gán
 * @throws {Error} Nếu không có lớp trống
 */
const assignClassroomForStudent = async (gradeCode) => {
    const classroom = await Classroom.findOne({
        grade_code: gradeCode,
        student_count: { $lt: 10 },
    }).sort({ classroom_code: 1 }); // Sắp xếp tăng dần theo classroom_code

    if (!classroom) {
        throw new Error('No available classroom in this grade');
    }

    classroom.student_count += 1;
    await classroom.save();

    return classroom;
};

module.exports = {
    assignHomeroomTeacher,
    validateAndAssignHomeroomTeacher,
    assignClassroomForStudent,
};