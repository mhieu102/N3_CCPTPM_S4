const Classroom = require('../models/classroom');
const Grade = require('../models/grade');
const Student = require('../models/student');
const StudentYearlyAverage = require('../models/studentYearlyAverage');
const StudentTermAverage = require('../models/studentTermAverage');
const Term = require('../models/term');

/**
 * Lấy thứ hạng cả năm của học sinh trong một lớp cụ thể.
 * @param {string} classroomCode - Mã lớp học
 * @returns {Object} - Kết quả với tổng số học sinh và danh sách xếp hạng
 * @throws {Error} - Nếu có lỗi xảy ra
 */
const getClassroomYearlyRankings = async (classroomCode) => {
    // Lấy classroom và grade để lấy school_year_code
    const classroom = await Classroom.findOne({ classroom_code: classroomCode });
    if (!classroom) {
        throw new Error('Classroom not found.', { cause: { status: 404 } });
    }

    const grade = await Grade.findOne({ grade_code: classroom.grade_code });
    if (!grade) {
        throw new Error('Grade not found for the specified classroom.', { cause: { status: 404 } });
    }

    const schoolYearCode = grade.school_year_code;

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
    const totalStudents = studentCodes.length;

    // Lấy thứ hạng cả năm của học sinh trong lớp
    const rankings = await StudentYearlyAverage.find({
        school_year_code: schoolYearCode,
        student_code: { $in: studentCodes },
    })
        .sort({ yearly_average: -1 })
        .select('student_code yearly_average classroom_rank')
        .lean();

    if (!rankings.length) {
        throw new Error('No yearly rankings found for the specified classroom.', { cause: { status: 404 } });
    }

    return {
        total_students: totalStudents,
        rankings: rankings.map(item => ({
            student_code: item.student_code,
            name: studentNames[item.student_code] || 'Unknown',
            yearly_average: item.yearly_average,
            classroom_rank: item.classroom_rank,
        })),
    };
};

/**
 * Lấy thứ hạng cả năm của học sinh trong một khối cụ thể.
 * @param {string} gradeCode - Mã khối
 * @returns {Object} - Kết quả với tổng số học sinh và danh sách xếp hạng
 * @throws {Error} - Nếu có lỗi xảy ra
 */
const getGradeYearlyRankings = async (gradeCode) => {
    // Lấy grade để lấy school_year_code
    const grade = await Grade.findOne({ grade_code: gradeCode });
    if (!grade) {
        throw new Error('Grade not found.', { cause: { status: 404 } });
    }

    const schoolYearCode = grade.school_year_code;

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
    const totalStudents = studentCodes.length;

    // Lấy thứ hạng cả năm của học sinh trong khối
    const rankings = await StudentYearlyAverage.find({
        school_year_code: schoolYearCode,
        student_code: { $in: studentCodes },
    })
        .sort({ yearly_average: -1 })
        .select('student_code yearly_average grade_rank')
        .lean();

    if (!rankings.length) {
        throw new Error('No yearly rankings found for the specified grade.', { cause: { status: 404 } });
    }

    // Kiểm tra xem grade_rank có bị null không
    const hasNullGradeRank = rankings.some(item => item.grade_rank == null);
    if (hasNullGradeRank) {
        console.log(`Some grade_rank values are null for grade ${gradeCode}, school_year ${schoolYearCode}`);
    }

    return {
        total_students: totalStudents,
        rankings: rankings.map(item => ({
            student_code: item.student_code,
            name: studentNames[item.student_code] || 'Unknown',
            yearly_average: item.yearly_average,
            grade_rank: item.grade_rank,
        })),
    };
};

/**
 * Lấy thứ hạng học kỳ của học sinh trong một lớp cụ thể.
 * @param {string} classroomCode - Mã lớp học
 * @param {string} termCode - Mã học kỳ
 * @returns {Object} - Kết quả với tổng số học sinh và danh sách xếp hạng
 * @throws {Error} - Nếu có lỗi xảy ra
 */
const getClassroomTermRankings = async (classroomCode, termCode) => {
    // Kiểm tra term_code có tồn tại không
    const term = await Term.findOne({ term_code: termCode });
    if (!term) {
        throw new Error('Term not found.', { cause: { status: 404 } });
    }

    // Lấy classroom để kiểm tra
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
    const totalStudents = studentCodes.length;

    // Lấy thứ hạng học kỳ của học sinh trong lớp
    const rankings = await StudentTermAverage.find({
        term_code: termCode,
        student_code: { $in: studentCodes },
    })
        .sort({ term_average: -1 })
        .select('student_code term_average classroom_rank')
        .lean();

    if (!rankings.length) {
        throw new Error('No term rankings found for the specified classroom and term.', { cause: { status: 404 } });
    }

    return {
        total_students: totalStudents,
        rankings: rankings.map(item => ({
            student_code: item.student_code,
            name: studentNames[item.student_code] || 'Unknown',
            term_average: item.term_average,
            classroom_rank: item.classroom_rank,
        })),
    };
};

/**
 * Lấy thứ hạng học kỳ của học sinh trong một khối cụ thể.
 * @param {string} gradeCode - Mã khối
 * @param {string} termCode - Mã học kỳ
 * @returns {Object} - Kết quả với tổng số học sinh và danh sách xếp hạng
 * @throws {Error} - Nếu có lỗi xảy ra
 */
const getGradeTermRankings = async (gradeCode, termCode) => {
    // Kiểm tra term_code có tồn tại không
    const term = await Term.findOne({ term_code: termCode });
    if (!term) {
        throw new Error('Term not found.', { cause: { status: 404 } });
    }

    // Lấy grade để kiểm tra
    const grade = await Grade.findOne({ grade_code: gradeCode });
    if (!grade) {
        throw new Error('Grade not found.', { cause: { status: 404 } });
    }

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
    const totalStudents = studentCodes.length;

    // Lấy thứ hạng học kỳ của học sinh trong khối
    const rankings = await StudentTermAverage.find({
        term_code: termCode,
        student_code: { $in: studentCodes },
    })
        .sort({ term_average: -1 })
        .select('student_code term_average grade_rank')
        .lean();

    if (!rankings.length) {
        throw new Error('No term rankings found for the specified grade and term.', { cause: { status: 404 } });
    }

    // Kiểm tra xem grade_rank có bị null không
    const hasNullGradeRank = rankings.some(item => item.grade_rank == null);
    if (hasNullGradeRank) {
        console.log(`Some grade_rank values are null for grade ${gradeCode}, term ${termCode}`);
    }

    return {
        total_students: totalStudents,
        rankings: rankings.map(item => ({
            student_code: item.student_code,
            name: studentNames[item.student_code] || 'Unknown',
            term_average: item.term_average,
            grade_rank: item.grade_rank,
        })),
    };
};

module.exports = {
    getClassroomYearlyRankings,
    getGradeYearlyRankings,
    getClassroomTermRankings,
    getGradeTermRankings,
};