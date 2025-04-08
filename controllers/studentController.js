const { success, fail } = require('../utils/responseFormatter');
const StudentService = require('../services/studentService');

/**
 * Kiểm tra người dùng có phải là học sinh không
 * @param {Object} user - Đối tượng người dùng từ request
 * @throws {Error} Nếu không phải học sinh
 */
const ensureStudent = (user) => {
    if (!user || user.role_code !== 'R2') {
        throw new Error('Không có quyền truy cập. Chỉ học sinh mới được phép.');
    }
};

/**
 * Lấy danh sách điểm của học sinh đã xác thực
 */
const getScores = async (req, res) => {
    try {
        // Kiểm tra người dùng có phải là học sinh không
        ensureStudent(req.user);

        // Lấy subject_code và term_code từ request body
        const { subject_code, term_code } = req.body;

        // Lấy danh sách điểm của học sinh
        const scores = await StudentService.getStudentScores(req.user.student_code, subject_code, term_code);

        if (!scores.length) {
            return success(res, [], 'Không tìm thấy điểm nào phù hợp với bộ lọc');
        }

        return success(res, scores, 'Lấy danh sách điểm thành công');
    } catch (error) {
        const statusCode = error.message.includes('Không có quyền') ? 403 : 400;
        return fail(res, error.message || 'Lỗi server', null, statusCode);
    }
};

/**
 * Cập nhật thông tin học sinh
 * Chỉ học sinh (role_code = 'R2') mới được phép thực hiện
 */
const updateStudent = async (req, res) => {
    try {
        ensureStudent(req.user);

        const updatedStudent = await StudentService.updateStudent(req, req.user);
        return success(res, updatedStudent, 'Cập nhật thông tin học sinh thành công');
    } catch (error) {
        const statusCode = error.message.includes('Không có quyền') ? 403 : 400;
        return fail(res, error.message || 'Lỗi server', null, statusCode);
    }
};

module.exports = {
    getScores,
    updateStudent, // Thêm hàm updateStudent
};