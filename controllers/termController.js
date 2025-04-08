const { success, fail } = require('../utils/responseFormatter');
const Term = require('../models/term');

/**
 * Lấy danh sách tất cả các học kỳ
 */
const getTerms = async (req, res) => {
    try {
        const terms = await Term.find({}, 'term_code term_name start_date end_date school_year_code')
            .populate('schoolYear', 'school_year_code school_year_name');
        return success(res, terms, 'Lấy danh sách học kỳ thành công');
    } catch (error) {
        return fail(res, 'Không thể lấy danh sách học kỳ: ' + error.message, null, 500);
    }
};

/**
 * Tạo một học kỳ mới
 */
const createTerm = async (req, res) => {
    try {
        const { term_name, start_date, end_date, school_year_code } = req.body;

        // Validate input
        if (!term_name || !start_date || !end_date || !school_year_code) {
            return fail(res, 'Tất cả các trường (term_name, start_date, end_date, school_year_code) là bắt buộc', null, 400);
        }

        const startDate = new Date(start_date);
        const endDate = new Date(end_date);
        if (endDate <= startDate) {
            return fail(res, 'Ngày kết thúc phải sau ngày bắt đầu', null, 400);
        }

        // Kiểm tra uniqueness của term_name
        const existingTermByName = await Term.findOne({ term_name });
        if (existingTermByName) {
            return fail(res, 'Tên học kỳ đã tồn tại', null, 400);
        }

        // Kiểm tra school_year_code có tồn tại không
        const SchoolYear = require('../models/schoolYear');
        const schoolYear = await SchoolYear.findOne({ school_year_code });
        if (!schoolYear) {
            return fail(res, 'Mã năm học không tồn tại', null, 400);
        }

        // Tạo term_code dựa trên school_year_name (giống seedTerms)
        const [startYear, endYear] = schoolYear.school_year_name.split('-');
        const termCount = await Term.countDocuments({ school_year_code });
        const termCodePrefix = termCount === 0 ? 'T1' : 'T2'; // T1 cho học kỳ 1, T2 cho học kỳ 2
        const termCode = `${termCodePrefix}_${startYear}-${endYear}`;

        // Kiểm tra uniqueness của term_code
        const existingTermByCode = await Term.findOne({ term_code: termCode });
        if (existingTermByCode) {
            return fail(res, 'Mã học kỳ đã tồn tại', null, 400);
        }

        const term = new Term({
            term_code: termCode,
            term_name,
            start_date: startDate,
            end_date: endDate,
            school_year_code,
        });

        await term.save();

        // Populate thông tin schoolYear
        const populatedTerm = await Term.findOne({ term_code: termCode })
            .populate('schoolYear', 'school_year_code school_year_name');

        return success(res, populatedTerm, 'Tạo học kỳ thành công');
    } catch (error) {
        return fail(res, 'Không thể tạo học kỳ: ' + error.message, null, 500);
    }
};

/**
 * Lấy thông tin chi tiết của một học kỳ theo term_code
 */
const getTermByCode = async (req, res) => {
    try {
        const { term_code } = req.params;

        const term = await Term.findOne({ term_code }, 'term_code term_name start_date end_date school_year_code')
            .populate('schoolYear', 'school_year_code school_year_name');

        if (!term) {
            return fail(res, 'Học kỳ không tồn tại', null, 404);
        }

        return success(res, term, 'Lấy thông tin học kỳ thành công');
    } catch (error) {
        return fail(res, 'Không thể lấy thông tin học kỳ: ' + error.message, null, 500);
    }
};

/**
 * Cập nhật thông tin một học kỳ
 */
const updateTerm = async (req, res) => {
    try {
        const { term_code } = req.params;
        const { term_name, start_date, end_date, school_year_code } = req.body;

        const term = await Term.findOne({ term_code });
        if (!term) {
            return fail(res, 'Học kỳ không tồn tại', null, 404);
        }

        // Validate input
        if (!term_name || !start_date || !end_date || !school_year_code) {
            return fail(res, 'Tất cả các trường (term_name, start_date, end_date, school_year_code) là bắt buộc', null, 400);
        }

        const startDate = new Date(start_date);
        const endDate = new Date(end_date);
        if (endDate <= startDate) {
            return fail(res, 'Ngày kết thúc phải sau ngày bắt đầu', null, 400);
        }

        // Kiểm tra uniqueness của term_name (trừ chính bản ghi hiện tại)
        const existingTermByName = await Term.findOne({ term_name, _id: { $ne: term._id } });
        if (existingTermByName) {
            return fail(res, 'Tên học kỳ đã tồn tại', null, 400);
        }

        // Kiểm tra school_year_code có tồn tại không
        const SchoolYear = require('../models/schoolYear');
        const schoolYear = await SchoolYear.findOne({ school_year_code });
        if (!schoolYear) {
            return fail(res, 'Mã năm học không tồn tại', null, 400);
        }

        // Cập nhật thông tin (term_code không thay đổi)
        term.term_name = term_name;
        term.start_date = startDate;
        term.end_date = endDate;
        term.school_year_code = school_year_code;

        await term.save();

        // Populate thông tin schoolYear
        const populatedTerm = await Term.findOne({ term_code })
            .populate('schoolYear', 'school_year_code school_year_name');

        return success(res, populatedTerm, 'Cập nhật học kỳ thành công');
    } catch (error) {
        return fail(res, 'Không thể cập nhật học kỳ: ' + error.message, null, 500);
    }
};

/**
 * Xóa một học kỳ
 */
const deleteTerm = async (req, res) => {
    try {
        const { term_code } = req.params;

        const term = await Term.findOne({ term_code });
        if (!term) {
            return fail(res, 'Học kỳ không tồn tại', null, 404);
        }

        // Kiểm tra xem học kỳ có điểm số hoặc kỳ thi liên quan không
        await term.populate('scores');
        if (term.scores && term.scores.length > 0) {
            return fail(res, 'Không thể xóa học kỳ vì đã có điểm số liên quan', null, 400);
        }

        const Exam = require('../models/exam');
        const examCount = await Exam.countDocuments({ term_code });
        if (examCount > 0) {
            return fail(res, 'Không thể xóa học kỳ vì đã có kỳ thi liên quan', null, 400);
        }

        await term.deleteOne();

        return success(res, null, 'Xóa học kỳ thành công');
    } catch (error) {
        return fail(res, 'Không thể xóa học kỳ: ' + error.message, null, 500);
    }
};

module.exports = { getTerms, createTerm, getTermByCode, updateTerm, deleteTerm };