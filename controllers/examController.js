const { success, fail } = require('../utils/responseFormatter');
const Exam = require('../models/exam');
const Subject = require('../models/subject');
const Term = require('../models/term');

/**
 * Lấy danh sách tất cả các kỳ thi
 */
const getExams = async (req, res) => {
    try {
        const exams = await Exam.find({}, 'exam_code exam_name subject_code term_code date');
        const result = await Promise.all(exams.map(async (exam) => {
            const subject = await Subject.findOne({ subject_code: exam.subject_code }, 'subject_code subject_name');
            const term = await Term.findOne({ term_code: exam.term_code }, 'term_code term_name');
            return {
                ...exam._doc,
                subject_code: subject || null,
                term_code: term || null,
            };
        }));
        return success(res, result, 'Lấy danh sách kỳ thi thành công');
    } catch (error) {
        return fail(res, 'Không thể lấy danh sách kỳ thi: ' + error.message, null, 500);
    }
};

/**
 * Tạo một kỳ thi mới
 */
const createExam = async (req, res) => {
    try {
        const { exam_name, subject_code, term_code, date } = req.body;

        // Xác thực subject_code
        const subject = await Subject.findOne({ subject_code });
        if (!subject) {
            return fail(res, 'Mã môn học không tồn tại', null, 400);
        }

        // Xác thực term_code
        const term = await Term.findOne({ term_code });
        if (!term) {
            return fail(res, 'Mã học kỳ không tồn tại', null, 400);
        }

        // Tạo exam_code theo thứ tự
        const examCount = await Exam.countDocuments();
        const exam = new Exam({
            exam_code: `E${examCount + 1}`,
            exam_name,
            subject_code: subject.subject_code,
            term_code: term.term_code,
            date: new Date(date),
        });

        await exam.save();

        // Truy vấn thủ công để lấy thông tin subject và term
        const populatedExam = {
            ...exam._doc,
            subject_code: { subject_code: subject.subject_code, subject_name: subject.subject_name },
            term_code: { term_code: term.term_code, term_name: term.term_name },
        };

        return success(res, populatedExam, 'Tạo kỳ thi thành công');
    } catch (error) {
        return fail(res, 'Không thể tạo kỳ thi: ' + error.message, null, 500);
    }
};

/**
 * Lấy thông tin chi tiết của một kỳ thi theo exam_code
 */
const getExamByCode = async (req, res) => {
    try {
        const { exam_code } = req.params;

        const exam = await Exam.findOne({ exam_code }, 'exam_code exam_name subject_code term_code date');
        if (!exam) {
            return fail(res, 'Kỳ thi không tồn tại', null, 404);
        }

        // Truy vấn thủ công
        const subject = await Subject.findOne({ subject_code: exam.subject_code }, 'subject_code subject_name');
        const term = await Term.findOne({ term_code: exam.term_code }, 'term_code term_name');

        const populatedExam = {
            ...exam._doc,
            subject_code: subject || null,
            term_code: term || null,
        };

        return success(res, populatedExam, 'Lấy thông tin kỳ thi thành công');
    } catch (error) {
        return fail(res, 'Không thể lấy thông tin kỳ thi: ' + error.message, null, 500);
    }
};

/**
 * Cập nhật thông tin một kỳ thi
 */
const updateExam = async (req, res) => {
    try {
        const { exam_code } = req.params;
        const { exam_name, subject_code, term_code, date } = req.body;

        const exam = await Exam.findOne({ exam_code });
        if (!exam) {
            return fail(res, 'Kỳ thi không tồn tại', null, 404);
        }

        // Xác thực subject_code và term_code
        const subject = await Subject.findOne({ subject_code });
        if (!subject) {
            return fail(res, 'Mã môn học không tồn tại', null, 400);
        }

        const term = await Term.findOne({ term_code });
        if (!term) {
            return fail(res, 'Mã học kỳ không tồn tại', null, 400);
        }

        // Cập nhật thông tin
        exam.exam_name = exam_name;
        exam.subject_code = subject.subject_code;
        exam.term_code = term.term_code;
        exam.date = new Date(date);

        await exam.save();

        // Truy vấn thủ công
        const populatedExam = {
            ...exam._doc,
            subject_code: { subject_code: subject.subject_code, subject_name: subject.subject_name },
            term_code: { term_code: term.term_code, term_name: term.term_name },
        };

        return success(res, populatedExam, 'Cập nhật kỳ thi thành công');
    } catch (error) {
        return fail(res, 'Không thể cập nhật kỳ thi: ' + error.message, null, 500);
    }
};

/**
 * Xóa một kỳ thi
 */
const deleteExam = async (req, res) => {
    try {
        const { exam_code } = req.params;

        const exam = await Exam.findOne({ exam_code });
        if (!exam) {
            return fail(res, 'Kỳ thi không tồn tại', null, 404);
        }

        await exam.deleteOne();

        return success(res, null, 'Xóa kỳ thi thành công');
    } catch (error) {
        return fail(res, 'Không thể xóa kỳ thi: ' + error.message, null, 500);
    }
};

module.exports = { getExams, createExam, getExamByCode, updateExam, deleteExam };