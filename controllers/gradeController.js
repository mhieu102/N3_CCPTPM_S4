const { success, fail } = require('../utils/responseFormatter');
const Grade = require('../models/grade');

/**
 * Lấy danh sách tất cả các khối
 */
const getGrades = async (req, res) => {
    try {
        const grades = await Grade.find({}, 'grade_code grade_name classroom_count school_year_code');
        return success(res, grades, 'Lấy danh sách khối thành công');
    } catch (error) {
        return fail(res, 'Không thể lấy danh sách khối: ' + error.message, null, 500);
    }
};

module.exports = { getGrades };