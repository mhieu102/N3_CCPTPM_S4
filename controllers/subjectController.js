const { success, fail } = require('../utils/responseFormatter');
const Subject = require('../models/subject');

/**
 * Lấy danh sách tất cả các môn học
 */
const getSubjects = async (req, res) => {
    try {
        const subjects = await Subject.find({}, 'subject_code subject_name');
        return success(res, subjects, 'Lấy danh sách môn học thành công');
    } catch (error) {
        return fail(res, 'Không thể lấy danh sách môn học: ' + error.message, null, 500);
    }
};

/**
 * Tạo một môn học mới
 */
const createSubject = async (req, res) => {
    try {
        const { subject_code, subject_name } = req.body;

        // Validate input
        if (!subject_code || typeof subject_code !== 'string' || subject_code.length > 10) {
            return fail(res, 'subject_code là bắt buộc và phải là chuỗi dưới 10 ký tự', null, 400);
        }
        if (!subject_name || typeof subject_name !== 'string' || subject_name.length > 255) {
            return fail(res, 'subject_name là bắt buộc và phải là chuỗi dưới 255 ký tự', null, 400);
        }

        // Kiểm tra uniqueness của subject_code
        const existingCode = await Subject.findOne({ subject_code });
        if (existingCode) {
            return fail(res, `Môn học với subject_code ${subject_code} đã tồn tại`, null, 400);
        }

        // Kiểm tra uniqueness của subject_name
        const existingName = await Subject.findOne({ subject_name });
        if (existingName) {
            return fail(res, `Môn học với subject_name ${subject_name} đã tồn tại`, null, 400);
        }

        const subject = new Subject({
            subject_code,
            subject_name,
        });

        await subject.save();

        return success(res, subject, 'Tạo môn học thành công');
    } catch (error) {
        return fail(res, 'Không thể tạo môn học: ' + error.message, null, 500);
    }
};

/**
 * Lấy thông tin chi tiết của một môn học theo subject_code
 */
const getSubjectByCode = async (req, res) => {
    try {
        const { subject_code } = req.params;

        const subject = await Subject.findOne({ subject_code }, 'subject_code subject_name');

        if (!subject) {
            return fail(res, 'Môn học không tồn tại', null, 404);
        }

        return success(res, subject, 'Lấy thông tin môn học thành công');
    } catch (error) {
        return fail(res, 'Không thể lấy thông tin môn học: ' + error.message, null, 500);
    }
};

/**
 * Cập nhật thông tin một môn học
 */
const updateSubject = async (req, res) => {
    try {
        const { subject_code } = req.params;
        const { new_subject_code, subject_name } = req.body;

        const subject = await Subject.findOne({ subject_code });
        if (!subject) {
            return fail(res, 'Môn học không tồn tại', null, 404);
        }

        // Validate input
        // if (!new_subject_code || typeof new_subject_code !== 'string' || new_subject_code.length > 10) {
        //     return fail(res, 'new_subject_code là bắt buộc và phải là chuỗi dưới 10 ký tự', null, 400);
        // }
        if (!subject_name || typeof subject_name !== 'string' || subject_name.length > 255) {
            return fail(res, 'subject_name là bắt buộc và phải là chuỗi dưới 255 ký tự', null, 400);
        }

        // Kiểm tra uniqueness của new_subject_code (nếu thay đổi)
        if (new_subject_code !== subject.subject_code) {
            const existingCode = await Subject.findOne({ subject_code: new_subject_code });
            if (existingCode) {
                return fail(res, `Môn học với subject_code ${new_subject_code} đã tồn tại`, null, 400);
            }
        }

        // Kiểm tra uniqueness của subject_name (nếu thay đổi)
        if (subject_name !== subject.subject_name) {
            const existingName = await Subject.findOne({ subject_name });
            if (existingName) {
                return fail(res, `Môn học với subject_name ${subject_name} đã tồn tại`, null, 400);
            }
        }

        // Cập nhật thông tin
        subject.subject_code = new_subject_code;
        subject.subject_name = subject_name;

        await subject.save();

        return success(res, subject, 'Cập nhật môn học thành công');
    } catch (error) {
        return fail(res, 'Không thể cập nhật môn học: ' + error.message, null, 500);
    }
};

/**
 * Xóa một môn học
 */
const deleteSubject = async (req, res) => {
    try {
        const { subject_code } = req.params;

        const subject = await Subject.findOne({ subject_code });
        if (!subject) {
            return fail(res, 'Môn học không tồn tại', null, 404);
        }

        // Kiểm tra xem môn học có TeacherSubject hoặc Score liên quan không
        const TeacherSubject = require('../models/teacherSubject');
        const Score = require('../models/score');
        const teacherSubjectCount = await TeacherSubject.countDocuments({ subject_code });
        const scoreCount = await Score.countDocuments({ subject_code });
        if (teacherSubjectCount > 0 || scoreCount > 0) {
            return fail(res, 'Không thể xóa môn học vì có giáo viên hoặc điểm số liên quan', null, 400);
        }

        await subject.deleteOne();

        return success(res, null, 'Xóa môn học thành công');
    } catch (error) {
        return fail(res, 'Không thể xóa môn học: ' + error.message, null, 500);
    }
};

module.exports = { getSubjects, createSubject, getSubjectByCode, updateSubject, deleteSubject };