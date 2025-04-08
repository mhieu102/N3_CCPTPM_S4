const { success, fail } = require('../utils/responseFormatter');
const Classroom = require('../models/classroom');
const Grade = require('../models/grade');

/**
 * Lấy danh sách tất cả các lớp học
 */
const getClassrooms = async (req, res) => {
    try {
        const classrooms = await Classroom.find({}, 'classroom_code classroom_name grade_code student_count homeroom_teacher_code')
            .populate({ path: 'grade', select: 'grade_code grade_name classroom_count school_year_code', strictPopulate: false })
            .populate({ path: 'homeroomTeacher', select: 'teacher_code full_name', strictPopulate: false });
        return success(res, classrooms, 'Lấy danh sách lớp học thành công');
    } catch (error) {
        return fail(res, 'Không thể lấy danh sách lớp học: ' + error.message, null, 500);
    }
};

/**
 * Tạo một lớp học mới
 */
const createClassroom = async (req, res) => {
    try {
        const { classroom_name, grade_code, homeroom_teacher_code } = req.body;

        // Kiểm tra các trường bắt buộc
        if (!classroom_name || !grade_code) {
            return fail(res, 'Tên lớp và mã khối là bắt buộc', null, 400);
        }

        // Kiểm tra grade_code có tồn tại không
        const grade = await Grade.findOne({ grade_code });
        if (!grade) {
            return fail(res, 'Khối không tồn tại', null, 404);
        }

        // Kiểm tra classroom_name có phù hợp với grade_code không
        let gradePrefix = '';
        if (grade.grade_code.includes('G10')) {
            gradePrefix = '10';
        } else if (grade.grade_code.includes('G11')) {
            gradePrefix = '11';
        } else if (grade.grade_code.includes('G12')) {
            gradePrefix = '12';
        }

        if (!gradePrefix || !new RegExp(`^${gradePrefix}[A-Z]$`).test(classroom_name)) {
            return fail(res, `Tên lớp phải bắt đầu bằng '${gradePrefix}' và kết thúc bằng một chữ cái in hoa (ví dụ: ${gradePrefix}A, ${gradePrefix}B)`, null, 400);
        }

        // Kiểm tra classroom_name đã tồn tại chưa
        const existingClassroom = await Classroom.findOne({ classroom_name });
        if (existingClassroom) {
            return fail(res, 'Tên lớp đã tồn tại', null, 400);
        }

        // Tạo classroom_code
        const classroomCount = await Classroom.countDocuments({ grade_code });
        const classroom_code = `C${classroomCount + 1}_${grade_code}`;

        // Tạo lớp học mới
        const newClassroom = new Classroom({
            classroom_code,
            classroom_name,
            grade_code,
            student_count: 0,
            homeroom_teacher_code: homeroom_teacher_code || null,
        });

        await newClassroom.save();

        // Cập nhật classroom_count trong Grade
        grade.classroom_count = await Classroom.countDocuments({ grade_code });
        await grade.save();

        // Populate thông tin grade và homeroomTeacher
        await newClassroom.populate({ path: 'grade', select: 'grade_code grade_name classroom_count school_year_code', strictPopulate: false });
        await newClassroom.populate({ path: 'homeroomTeacher', select: 'teacher_code full_name', strictPopulate: false });

        return success(res, newClassroom, 'Tạo lớp học thành công');
    } catch (error) {
        return fail(res, 'Không thể tạo lớp học: ' + error.message, null, 500);
    }
};

/**
 * Lấy thông tin chi tiết của một lớp học
 */
const getClassroomByCode = async (req, res) => {
    try {
        const { classroom_code } = req.params;

        const classroom = await Classroom.findOne({ classroom_code }, 'classroom_code classroom_name grade_code student_count homeroom_teacher_code')
            .populate({ path: 'grade', select: 'grade_code grade_name classroom_count school_year_code', strictPopulate: false })
            .populate({ path: 'homeroomTeacher', select: 'teacher_code full_name', strictPopulate: false });

        if (!classroom) {
            return fail(res, 'Lớp học không tồn tại', null, 404);
        }

        return success(res, classroom, 'Lấy thông tin lớp học thành công');
    } catch (error) {
        return fail(res, 'Không thể lấy thông tin lớp học: ' + error.message, null, 500);
    }
};

/**
 * Cập nhật thông tin một lớp học
 */
const updateClassroom = async (req, res) => {
    try {
        const { classroom_code } = req.params;
        const { classroom_name, grade_code, homeroom_teacher_code } = req.body;

        // Kiểm tra lớp học có tồn tại không
        const classroom = await Classroom.findOne({ classroom_code });
        if (!classroom) {
            return fail(res, 'Lớp học không tồn tại', null, 404);
        }

        // Kiểm tra các trường bắt buộc
        if (!classroom_name || !grade_code) {
            return fail(res, 'Tên lớp và mã khối là bắt buộc', null, 400);
        }

        // Kiểm tra grade_code có tồn tại không
        const grade = await Grade.findOne({ grade_code });
        if (!grade) {
            return fail(res, 'Khối không tồn tại', null, 404);
        }

        // Kiểm tra classroom_name có phù hợp với grade_code không
        let gradePrefix = '';
        if (grade.grade_code.includes('G10')) {
            gradePrefix = '10';
        } else if (grade.grade_code.includes('G11')) {
            gradePrefix = '11';
        } else if (grade.grade_code.includes('G12')) {
            gradePrefix = '12';
        }

        if (!gradePrefix || !new RegExp(`^${gradePrefix}[A-Z]$`).test(classroom_name)) {
            return fail(res, `Tên lớp phải bắt đầu bằng '${gradePrefix}' và kết thúc bằng một chữ cái in hoa (ví dụ: ${gradePrefix}A, ${gradePrefix}B)`, null, 400);
        }

        // Kiểm tra classroom_name có bị trùng không (ngoại trừ chính lớp đang cập nhật)
        const existingClassroom = await Classroom.findOne({ classroom_name, classroom_code: { $ne: classroom_code } });
        if (existingClassroom) {
            return fail(res, 'Tên lớp đã tồn tại', null, 400);
        }

        // Nếu grade_code thay đổi, cập nhật classroom_code
        const oldGradeCode = classroom.grade_code;
        if (oldGradeCode !== grade_code) {
            const classroomCount = await Classroom.countDocuments({ grade_code });
            classroom.classroom_code = `C${classroomCount + 1}_${grade_code}`;
        }

        // Cập nhật thông tin lớp học
        classroom.classroom_name = classroom_name;
        classroom.grade_code = grade_code;
        if (typeof homeroom_teacher_code !== 'undefined') {
            classroom.homeroom_teacher_code = homeroom_teacher_code === '' || homeroom_teacher_code === null ? null : homeroom_teacher_code;
        }

        await classroom.save();

        // Cập nhật classroom_count cho grade cũ và grade mới (nếu có thay đổi)
        if (oldGradeCode !== grade_code) {
            const oldGrade = await Grade.findOne({ grade_code: oldGradeCode });
            if (oldGrade) {
                oldGrade.classroom_count = await Classroom.countDocuments({ grade_code: oldGradeCode });
                await oldGrade.save();
            }
        }
        grade.classroom_count = await Classroom.countDocuments({ grade_code });
        await grade.save();

        // Populate thông tin grade và homeroomTeacher
        await classroom.populate({ path: 'grade', select: 'grade_code grade_name classroom_count school_year_code', strictPopulate: false });
        await classroom.populate({ path: 'homeroomTeacher', select: 'teacher_code full_name', strictPopulate: false });

        return success(res, classroom, 'Cập nhật lớp học thành công');
    } catch (error) {
        return fail(res, 'Không thể cập nhật lớp học: ' + error.message, null, 500);
    }
};

/**
 * Xóa một lớp học
 */
const deleteClassroom = async (req, res) => {
    try {
        const { classroom_code } = req.params;

        // Kiểm tra lớp học có tồn tại không
        const classroom = await Classroom.findOne({ classroom_code })
            .populate({ path: 'students', strictPopulate: false })
            .populate({ path: 'teachers', strictPopulate: false });

        if (!classroom) {
            return fail(res, 'Lớp học không tồn tại', null, 404);
        }

        // Kiểm tra nếu lớp học có học sinh hoặc giáo viên liên quan
        if (classroom.students.length > 0 || classroom.teachers.length > 0) {
            return fail(res, 'Không thể xóa lớp học vì có học sinh hoặc giáo viên liên quan', null, 400);
        }

        // Lấy grade để cập nhật classroom_count
        const grade = await Grade.findOne({ grade_code: classroom.grade_code });

        // Xóa lớp học
        await classroom.deleteOne();

        // Cập nhật classroom_count trong Grade
        if (grade) {
            grade.classroom_count = await Classroom.countDocuments({ grade_code: classroom.grade_code });
            await grade.save();
        }

        return success(res, null, 'Xóa lớp học thành công');
    } catch (error) {
        return fail(res, 'Không thể xóa lớp học: ' + error.message, null, 500);
    }
};

module.exports = { getClassrooms, createClassroom, getClassroomByCode, updateClassroom, deleteClassroom };