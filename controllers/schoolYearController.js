const { success, fail } = require('../utils/responseFormatter');
const SchoolYear = require('../models/schoolYear');

/**
 * Lấy danh sách tất cả các năm học
 */
const getSchoolYears = async (req, res) => {
    try {
        const schoolYears = await SchoolYear.find({}, 'school_year_code school_year_name');
        return success(res, schoolYears, 'Lấy danh sách năm học thành công');
    } catch (error) {
        return fail(res, 'Không thể lấy danh sách năm học: ' + error.message, null, 500);
    }
};

/**
 * Tạo một năm học mới
 */
const createSchoolYear = async (req, res) => {
    try {
        const { start_year } = req.body;

        // Validate input
        if (!start_year || isNaN(start_year) || start_year < 2000 || start_year > 9999) {
            return fail(res, 'start_year phải là số nguyên từ 2000 đến 9999', null, 400);
        }

        const startYear = parseInt(start_year);
        const nextYear = startYear + 1;

        // Tạo school_year_code theo định dạng SY_{start_year}-{next_year}
        const school_year_code = `SY_${startYear}-${nextYear}`;

        // Tạo school_year_name theo định dạng {start_year}-{next_year}
        const school_year_name = `${startYear}-${nextYear}`;

        // Kiểm tra uniqueness của school_year_code
        const existingCode = await SchoolYear.findOne({ school_year_code });
        if (existingCode) {
            return fail(res, `Năm học với school_year_code ${school_year_code} đã tồn tại`, null, 400);
        }

        // Kiểm tra uniqueness của school_year_name
        const existingName = await SchoolYear.findOne({ school_year_name });
        if (existingName) {
            return fail(res, `Năm học với school_year_name ${school_year_name} đã tồn tại`, null, 400);
        }

        const schoolYear = new SchoolYear({
            school_year_code,
            school_year_name,
        });

        await schoolYear.save();

        return success(res, schoolYear, 'Tạo năm học thành công');
    } catch (error) {
        return fail(res, 'Không thể tạo năm học: ' + error.message, null, 500);
    }
};

/**
 * Lấy thông tin chi tiết của một năm học theo school_year_code
 */
const getSchoolYearByCode = async (req, res) => {
    try {
        const { school_year_code } = req.params;

        const schoolYear = await SchoolYear.findOne({ school_year_code }, 'school_year_code school_year_name');

        if (!schoolYear) {
            return fail(res, 'Năm học không tồn tại', null, 404);
        }

        return success(res, schoolYear, 'Lấy thông tin năm học thành công');
    } catch (error) {
        return fail(res, 'Không thể lấy thông tin năm học: ' + error.message, null, 500);
    }
};

/**
 * Cập nhật thông tin một năm học
 */
const updateSchoolYear = async (req, res) => {
    try {
        const { school_year_code } = req.params;
        const { start_year } = req.body;

        const schoolYear = await SchoolYear.findOne({ school_year_code });
        if (!schoolYear) {
            return fail(res, 'Năm học không tồn tại', null, 404);
        }

        // Validate input
        if (!start_year || isNaN(start_year) || start_year < 2000 || start_year > 9999) {
            return fail(res, 'start_year phải là số nguyên từ 2000 đến 9999', null, 400);
        }

        const startYear = parseInt(start_year);
        const nextYear = startYear + 1;

        // Tạo school_year_code mới
        const new_school_year_code = `SY_${startYear}-${nextYear}`;

        // Tạo school_year_name mới
        const new_school_year_name = `${startYear}-${nextYear}`;

        // Kiểm tra uniqueness của school_year_code mới (nếu thay đổi)
        if (new_school_year_code !== schoolYear.school_year_code) {
            const existingCode = await SchoolYear.findOne({ school_year_code: new_school_year_code });
            if (existingCode) {
                return fail(res, `Năm học với school_year_code ${new_school_year_code} đã tồn tại`, null, 400);
            }
        }

        // Kiểm tra uniqueness của school_year_name mới (nếu thay đổi)
        if (new_school_year_name !== schoolYear.school_year_name) {
            const existingName = await SchoolYear.findOne({ school_year_name: new_school_year_name });
            if (existingName) {
                return fail(res, `Năm học với school_year_name ${new_school_year_name} đã tồn tại`, null, 400);
            }
        }

        // Cập nhật thông tin
        schoolYear.school_year_code = new_school_year_code;
        schoolYear.school_year_name = new_school_year_name;

        await schoolYear.save();

        return success(res, schoolYear, 'Cập nhật năm học thành công');
    } catch (error) {
        return fail(res, 'Không thể cập nhật năm học: ' + error.message, null, 500);
    }
};

/**
 * Xóa một năm học
 */
const deleteSchoolYear = async (req, res) => {
    try {
        const { school_year_code } = req.params;

        const schoolYear = await SchoolYear.findOne({ school_year_code });
        if (!schoolYear) {
            return fail(res, 'Năm học không tồn tại', null, 404);
        }

        // Kiểm tra xem năm học có Term hoặc Grade liên quan không
        const Term = require('../models/term');
        const Grade = require('../models/grade');
        const termCount = await Term.countDocuments({ school_year_code });
        const gradeCount = await Grade.countDocuments({ school_year_code });
        if (termCount > 0 || gradeCount > 0) {
            return fail(res, 'Không thể xóa năm học vì có học kỳ hoặc khối liên quan', null, 400);
        }

        await schoolYear.deleteOne();

        return success(res, null, 'Xóa năm học thành công');
    } catch (error) {
        return fail(res, 'Không thể xóa năm học: ' + error.message, null, 500);
    }
};

module.exports = { getSchoolYears, createSchoolYear, getSchoolYearByCode, updateSchoolYear, deleteSchoolYear };