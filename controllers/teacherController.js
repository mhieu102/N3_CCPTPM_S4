const { success, fail } = require('../utils/responseFormatter');
const TeacherService = require('../services/teacherService');

/**
 * Kiểm tra người dùng có phải là giáo viên không
 * @param {Object} user - Đối tượng người dùng từ request
 * @throws {Error} Nếu không phải giáo viên
 */
const ensureTeacher = (user) => {
    if (!user || user.role_code !== 'R1') {
        throw new Error('Không có quyền thực hiện. Chỉ giáo viên mới được phép.');
    }
};

/**
 * Lấy danh sách tất cả giáo viên
 * Chỉ giáo viên (role_code = 'R1') mới được phép truy cập
 */
const getAllTeachers = async (req, res) => {
    try {
        ensureTeacher(req.user);

        const teachers = await TeacherService.getAllTeachers();
        return success(res, teachers, 'Lấy danh sách giáo viên thành công');
    } catch (error) {
        const statusCode = error.message.includes('Không có quyền') ? 403 : 500;
        return fail(res, error.message || 'Lỗi server', null, statusCode);
    }
};

/**
 * Lấy danh sách học sinh theo classroom_code
 * Chỉ giáo viên (role_code = 'R1') mới được phép truy cập
 */
const getStudentsByClassroom = async (req, res) => {
    try {
        ensureTeacher(req.user);

        const { classroom_code } = req.query;
        if (!classroom_code) {
            return fail(res, 'classroom_code là bắt buộc', null, 422);
        }

        const students = await TeacherService.getStudentsByClassroom(classroom_code);
        return success(res, students, 'Lấy danh sách học sinh thành công');
    } catch (error) {
        const statusCode = error.message.includes('Không có quyền') ? 403 : 500;
        return fail(res, error.message || 'Lỗi server', null, statusCode);
    }
};

/**
 * Gán giáo viên hiện tại làm chủ nhiệm của một lớp
 * Chỉ giáo viên (role_code = 'R1') mới được phép thực hiện
 */
const assignHomeroomClassroom = async (req, res) => {
    try {
        ensureTeacher(req.user);

        const { classroom_code } = req.body;
        if (!classroom_code) {
            return fail(res, 'classroom_code là bắt buộc', null, 422);
        }

        const classroom = await TeacherService.assignHomeroomClassroom(req.user, classroom_code);
        return success(res, classroom, 'Gán giáo viên chủ nhiệm thành công');
    } catch (error) {
        const statusCode = error.message.includes('Không có quyền') ? 403 : 400;
        return fail(res, error.message || 'Lỗi server', null, statusCode);
    }
};

/**
 * Giáo viên nhận dạy lớp, hệ thống tự tính toán các môn có thể dạy
 */
const assignTeachingClassroom = async (req, res) => {
    try {
        ensureTeacher(req.user);

        const { classroom_code } = req.body;
        if (!classroom_code) {
            return fail(res, 'classroom_code là bắt buộc', null, 422);
        }

        const assignedSubjects = await TeacherService.assignTeachingClassroom(req.user, classroom_code);
        return success(res, { assigned_subjects: assignedSubjects }, 'Nhận dạy lớp thành công');
    } catch (error) {
        const statusCode = error.message.includes('Không có quyền') ? 403 : 400;
        return fail(res, error.message || 'Lỗi server', null, statusCode);
    }
};

/**
 * Lấy danh sách giáo viên dạy trong một lớp dựa trên classroom_code
 */
const getTeachersInClassroom = async (req, res) => {
    try {
        const { classroom_code } = req.query;
        if (!classroom_code) {
            return fail(res, 'classroom_code là bắt buộc', null, 422);
        }

        const teachers = await TeacherService.getTeachersInClassroom(classroom_code);
        return success(res, teachers, 'Lấy danh sách giáo viên dạy trong lớp thành công');
    } catch (error) {
        return fail(res, error.message || 'Lỗi server', null, 400);
    }
};

/**
 * Nhập điểm cho học sinh trong một lớp cho một bài kiểm tra
 * Chỉ giáo viên (role_code = 'R1') mới được phép thực hiện
 */
const enterScores = async (req, res) => {
    try {
        ensureTeacher(req.user);

        const { classroom_code, exam_code, scores } = req.body;

        if (!classroom_code) {
            return fail(res, 'classroom_code là bắt buộc', null, 422);
        }

        if (!exam_code) {
            return fail(res, 'exam_code là bắt buộc', null, 422);
        }

        if (!scores || !Array.isArray(scores) || scores.length === 0) {
            return fail(res, 'Danh sách điểm (scores) là bắt buộc và không được rỗng', null, 422);
        }

        const enteredScores = await TeacherService.enterScores(req.user, classroom_code, exam_code, scores);
        return success(res, enteredScores, 'Nhập điểm thành công');
    } catch (error) {
        const statusCode = error.message.includes('Không có quyền') ? 403 : 400;
        return fail(res, error.message || 'Lỗi server', null, statusCode);
    }
};

/**
 * Lấy danh sách điểm của một lớp mà giáo viên dạy
 * Chỉ giáo viên (role_code = 'R1') mới được phép thực hiện
 */
const getClassroomScores = async (req, res) => {
    try {
        ensureTeacher(req.user);

        const { classroom_code, exam_code, subject_code } = req.body;

        if (!classroom_code) {
            return fail(res, 'classroom_code là bắt buộc', null, 422);
        }

        const scores = await TeacherService.getClassroomScores(req.user, classroom_code, exam_code, subject_code);
        return success(res, scores, 'Lấy danh sách điểm của lớp thành công');
    } catch (error) {
        const statusCode = error.message.includes('Không có quyền') ? 403 : 400;
        return fail(res, error.message || 'Lỗi server', null, statusCode);
    }
};

/**
 * Cập nhật thông tin giáo viên
 * Chỉ giáo viên (role_code = 'R1') mới được phép thực hiện
 */
const updateTeacher = async (req, res) => {
    try {
        ensureTeacher(req.user);

        const updatedTeacher = await TeacherService.updateTeacher(req, req.user);
        return success(res, updatedTeacher, 'Cập nhật thông tin giáo viên thành công');
    } catch (error) {
        const statusCode = error.message.includes('Không có quyền') ? 403 : 400;
        return fail(res, error.message || 'Lỗi server', null, statusCode);
    }
};

module.exports = {
    getAllTeachers,
    getStudentsByClassroom,
    assignHomeroomClassroom,
    assignTeachingClassroom,
    getTeachersInClassroom,
    enterScores,
    getClassroomScores,
    updateTeacher,
};