const StudentTermAverage = require('../models/studentTermAverage');
const StudentYearlyAverage = require('../models/studentYearlyAverage');
const Student = require('../models/student');
const Classroom = require('../models/classroom');
const Grade = require('../models/grade');

/**
 * Lấy danh sách học sinh theo học lực trong một lớp (theo kỳ).
 * @param {string} classroomCode - Mã lớp học
 * @param {string} termCode - Mã học kỳ
 * @param {string} academicPerformance - Học lực (Giỏi, Khá, Trung bình, Yếu)
 * @returns {Object} - Kết quả với tổng số học sinh và danh sách học sinh
 * @throws {Error} - Nếu có lỗi xảy ra
 */
const getClassroomTermPerformance = async (classroomCode, termCode, academicPerformance) => {
    // Kiểm tra classroom
    const classroom = await Classroom.findOne({ classroom_code: classroomCode });
    if (!classroom) {
        throw new Error('Classroom not found.', { cause: { status: 404 } });
    }

    // Lấy danh sách học sinh trong lớp
    const students = await Student.find({ classroom_code: classroomCode }).select('student_code name');
    if (!students.length) {
        throw new Error('No students found in the specified classroom.', { cause: { status: 404 } });
    }

    const studentCodes = students.map(student => student.student_code);
    const studentNames = students.reduce((map, student) => {
        map[student.student_code] = student.name;
        return map;
    }, {});

    // Lấy danh sách học sinh theo học lực trong kỳ
    const studentsWithPerformance = await StudentTermAverage.find({
        term_code: termCode,
        student_code: { $in: studentCodes },
        academic_performance: academicPerformance, // Sử dụng academicPerformance thay vì academic_performance
    }).select('student_code term_average academic_performance');

    if (!studentsWithPerformance.length) {
        throw new Error(`No students found with academic performance '${academicPerformance}' in the specified classroom and term.`, { cause: { status: 404 } });
    }

    const totalStudents = studentsWithPerformance.length;

    return {
        total_students: totalStudents,
        students: studentsWithPerformance.map(item => ({
            student_code: item.student_code,
            name: studentNames[item.student_code] || 'Unknown',
            term_average: item.term_average,
            academic_performance: item.academic_performance,
        })),
    };
};

/**
 * Lấy danh sách học sinh theo học lực trong một lớp (theo năm).
 * @param {string} classroomCode - Mã lớp học
 * @param {string} academicPerformance - Học lực (Giỏi, Khá, Trung bình, Yếu)
 * @returns {Object} - Kết quả với tổng số học sinh và danh sách học sinh
 * @throws {Error} - Nếu có lỗi xảy ra
 */
const getClassroomYearlyPerformance = async (classroomCode, academicPerformance) => {
    // Kiểm tra classroom và grade
    const classroom = await Classroom.findOne({ classroom_code: classroomCode });
    if (!classroom) {
        throw new Error('Classroom not found.', { cause: { status: 404 } });
    }

    const grade = await Grade.findOne({ grade_code: classroom.grade_code });
    if (!grade) {
        throw new Error('Grade not found for the specified classroom.', { cause: { status: 404 } });
    }

    const school_year_code = grade.school_year_code;

    // Lấy danh sách học sinh trong lớp
    const students = await Student.find({ classroom_code: classroomCode }).select('student_code name');
    if (!students.length) {
        throw new Error('No students found in the specified classroom.', { cause: { status: 404 } });
    }

    const studentCodes = students.map(student => student.student_code);
    const studentNames = students.reduce((map, student) => {
        map[student.student_code] = student.name;
        return map;
    }, {});

    // Lấy danh sách học sinh theo học lực trong năm
    const studentsWithPerformance = await StudentYearlyAverage.find({
        school_year_code,
        student_code: { $in: studentCodes },
        academic_performance: academicPerformance, // Sử dụng academicPerformance thay vì academic_performance
    }).select('student_code yearly_average academic_performance');

    if (!studentsWithPerformance.length) {
        throw new Error(`No students found with academic performance '${academicPerformance}' in the specified classroom and school year.`, { cause: { status: 404 } });
    }

    const totalStudents = studentsWithPerformance.length;

    return {
        total_students: totalStudents,
        students: studentsWithPerformance.map(item => ({
            student_code: item.student_code,
            name: studentNames[item.student_code] || 'Unknown',
            yearly_average: item.yearly_average,
            academic_performance: item.academic_performance,
        })),
    };
};

/**
 * Lấy danh sách học sinh theo học lực trong một khối (theo kỳ).
 * @param {string} gradeCode - Mã khối
 * @param {string} termCode - Mã học kỳ
 * @param {string} academicPerformance - Học lực (Giỏi, Khá, Trung bình, Yếu)
 * @returns {Object} - Kết quả với tổng số học sinh và danh sách học sinh
 * @throws {Error} - Nếu có lỗi xảy ra
 */
const getGradeTermPerformance = async (gradeCode, termCode, academicPerformance) => {
    // Lấy danh sách lớp học trong khối
    const classroomsInGrade = await Classroom.find({ grade_code: gradeCode }).distinct('classroom_code');
    if (!classroomsInGrade.length) {
        throw new Error('No classrooms found in the specified grade.', { cause: { status: 404 } });
    }

    // Lấy danh sách học sinh trong khối
    const students = await Student.find({
        classroom_code: { $in: classroomsInGrade },
    }).select('student_code name');
    if (!students.length) {
        throw new Error('No students found in the specified grade.', { cause: { status: 404 } });
    }

    const studentCodes = students.map(student => student.student_code);
    const studentNames = students.reduce((map, student) => {
        map[student.student_code] = student.name;
        return map;
    }, {});

    // Lấy danh sách học sinh theo học lực trong kỳ
    const studentsWithPerformance = await StudentTermAverage.find({
        term_code: termCode,
        student_code: { $in: studentCodes },
        academic_performance: academicPerformance, // Sử dụng academicPerformance thay vì academic_performance
    }).select('student_code term_average academic_performance');

    if (!studentsWithPerformance.length) {
        throw new Error(`No students found with academic performance '${academicPerformance}' in the specified grade and term.`, { cause: { status: 404 } });
    }

    const totalStudents = studentsWithPerformance.length;

    return {
        total_students: totalStudents,
        students: studentsWithPerformance.map(item => ({
            student_code: item.student_code,
            name: studentNames[item.student_code] || 'Unknown',
            term_average: item.term_average,
            academic_performance: item.academic_performance,
        })),
    };
};

/**
 * Lấy danh sách học sinh theo học lực trong một khối (theo năm).
 * @param {string} gradeCode - Mã khối
 * @param {string} academicPerformance - Học lực (Giỏi, Khá, Trung bình, Yếu)
 * @returns {Object} - Kết quả với tổng số học sinh và danh sách học sinh
 * @throws {Error} - Nếu có lỗi xảy ra
 */
const getGradeYearlyPerformance = async (gradeCode, academicPerformance) => {
    // Kiểm tra grade
    const grade = await Grade.findOne({ grade_code: gradeCode });
    if (!grade) {
        throw new Error('Grade not found.', { cause: { status: 404 } });
    }

    const school_year_code = grade.school_year_code;

    // Lấy danh sách lớp học trong khối
    const classroomsInGrade = await Classroom.find({ grade_code: gradeCode }).distinct('classroom_code');
    if (!classroomsInGrade.length) {
        throw new Error('No classrooms found in the specified grade.', { cause: { status: 404 } });
    }

    // Lấy danh sách học sinh trong khối
    const students = await Student.find({
        classroom_code: { $in: classroomsInGrade },
    }).select('student_code name');
    if (!students.length) {
        throw new Error('No students found in the specified grade.', { cause: { status: 404 } });
    }

    const studentCodes = students.map(student => student.student_code);
    const studentNames = students.reduce((map, student) => {
        map[student.student_code] = student.name;
        return map;
    }, {});

    // Lấy danh sách học sinh theo học lực trong năm
    const studentsWithPerformance = await StudentYearlyAverage.find({
        school_year_code,
        student_code: { $in: studentCodes },
        academic_performance: academicPerformance, // Sử dụng academicPerformance thay vì academic_performance
    }).select('student_code yearly_average academic_performance');

    if (!studentsWithPerformance.length) {
        throw new Error(`No students found with academic performance '${academicPerformance}' in the specified grade and school year.`, { cause: { status: 404 } });
    }

    const totalStudents = studentsWithPerformance.length;

    return {
        total_students: totalStudents,
        students: studentsWithPerformance.map(item => ({
            student_code: item.student_code,
            name: studentNames[item.student_code] || 'Unknown',
            yearly_average: item.yearly_average,
            academic_performance: item.academic_performance,
        })),
    };
};

module.exports = {
    getClassroomTermPerformance,
    getClassroomYearlyPerformance,
    getGradeTermPerformance,
    getGradeYearlyPerformance,
};