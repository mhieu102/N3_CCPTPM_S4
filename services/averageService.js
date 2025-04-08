const Score = require('../models/score');
const Exam = require('../models/exam');
const Term = require('../models/term');
const SubjectAverage = require('../models/subjectAverage');
const SubjectYearlyAverage = require('../models/subjectYearlyAverage');
const StudentYearlyAverage = require('../models/studentYearlyAverage');
const StudentTermAverage = require('../models/studentTermAverage');
const Student = require('../models/student');
const Classroom = require('../models/classroom');

// Kiểm tra Score ngay sau khi import
// console.log('Score in averageService.js:', Score);
if (!Score || typeof Score.find !== 'function') {
    throw new Error('Score is not a valid Mongoose model in averageService.js');
}

/**
 * Tính học lực dựa trên điểm trung bình.
 *
 * @param {number} average Điểm trung bình
 * @returns {string} Học lực
 */
const calculateAcademicPerformance = (average) => {
    if (average >= 8.0) {
        return 'Giỏi';
    } else if (average >= 6.5) {
        return 'Khá';
    } else if (average >= 5.0) {
        return 'Trung bình';
    } else {
        return 'Yếu';
    }
};

// Cập nhật điểm trung bình khi có thay đổi trong Score
const updateAverages = async (studentCode, examCode) => {
    try {
        // Lấy thông tin bài kiểm tra
        const exam = await Exam.findOne({ exam_code: examCode });
        if (!exam) {
            console.log(`Exam ${examCode} not found`);
            return;
        }

        const subjectCode = exam.subject_code;
        const termCode = exam.term_code;

        // Lấy term để lấy school_year_code
        const term = await Term.findOne({ term_code: termCode });
        if (!term) {
            console.log(`Term ${termCode} not found`);
            return;
        }
        const schoolYearCode = term.school_year_code;

        // Cập nhật điểm trung bình trong kỳ cho từng môn
        await updateSubjectTermAverage(studentCode, subjectCode, termCode);

        // Kiểm tra xem SubjectAverage đã được tạo chưa
        const subjectAverage = await SubjectAverage.findOne({
            student_code: studentCode,
            subject_code: subjectCode,
            term_code: termCode,
        });
        if (!subjectAverage) {
            console.log(`SubjectAverage for student ${studentCode}, subject ${subjectCode}, term ${termCode} not found`);
            return;
        }

        // Cập nhật điểm trung bình học kỳ của học sinh (tất cả các môn)
        await updateStudentTermAverage(studentCode, termCode);

        // Cập nhật điểm trung bình cả năm của môn học
        await updateSubjectYearlyAverage(studentCode, subjectCode, schoolYearCode);

        // Kiểm tra xem SubjectYearlyAverage đã được tạo chưa
        const subjectYearlyAverage = await SubjectYearlyAverage.findOne({
            student_code: studentCode,
            subject_code: subjectCode,
            school_year_code: schoolYearCode,
        });
        if (!subjectYearlyAverage) {
            console.log(`SubjectYearlyAverage for student ${studentCode}, subject ${subjectCode}, school year ${schoolYearCode} not found`);
            return;
        }

        // Cập nhật điểm trung bình cả năm và thứ hạng của học sinh
        await updateStudentYearlyAverage(studentCode, schoolYearCode);
    } catch (error) {
        console.log(`Error in updateAverages for student ${studentCode}, exam ${examCode}: ${error.message}`);
        throw error;
    }
};

// Cập nhật điểm trung bình trong kỳ cho một môn học
const updateSubjectTermAverage = async (studentCode, subjectCode, termCode) => {
    try {
        // Kiểm tra xem có dữ liệu trong Score không
        const scores = await Score.find({ student_code: studentCode });

        // Tính điểm trung bình trong kỳ
        const scoresAggregation = await Score.aggregate([
            { $match: { student_code: studentCode } },
            {
                $lookup: {
                    from: 'exams',
                    localField: 'exam_code',
                    foreignField: 'exam_code',
                    as: 'exam',
                },
            },
            { $unwind: '$exam' },
            {
                $match: {
                    'exam.subject_code': subjectCode,
                    'exam.term_code': termCode,
                },
            },
            {
                $group: {
                    _id: null,
                    term_average: { $avg: '$score_value' },
                },
            },
        ]);

        const termAverage = scoresAggregation.length > 0 ? scoresAggregation[0].term_average : 0;

        // Cập nhật hoặc tạo mới bản ghi SubjectAverage
        const result = await SubjectAverage.findOneAndUpdate(
            { student_code: studentCode, subject_code: subjectCode, term_code: termCode },
            { term_average: termAverage },
            { upsert: true, new: true, runValidators: true }
        );
        if (!result) {
            console.log(`Failed to upsert SubjectAverage for student ${studentCode}, subject ${subjectCode}, term ${termCode}`);
            return;
        }
    } catch (error) {
        console.log(`Error in updateSubjectTermAverage for student ${studentCode}, subject ${subjectCode}, term ${termCode}: ${error.message}`);
        throw error;
    }
};

// Cập nhật điểm trung bình học kỳ của học sinh (tất cả các môn)
const updateStudentTermAverage = async (studentCode, termCode) => {
    try {
        // Tính điểm trung bình học kỳ của học sinh (trung bình của tất cả các môn trong học kỳ)
        const termAverages = await SubjectAverage.aggregate([
            {
                $match: {
                    student_code: studentCode,
                    term_code: termCode,
                },
            },
            {
                $group: {
                    _id: null,
                    term_average: { $avg: '$term_average' },
                },
            },
        ]);

        const termAverage = termAverages.length > 0 ? termAverages[0].term_average : 0;

        // Tính học lực dựa trên điểm trung bình học kỳ
        const academicPerformance = calculateAcademicPerformance(termAverage);

        // Cập nhật hoặc tạo mới bản ghi StudentTermAverage
        const result = await StudentTermAverage.findOneAndUpdate(
            { student_code: studentCode, term_code: termCode },
            { term_average: termAverage, academic_performance: academicPerformance },
            { upsert: true, new: true, runValidators: true }
        );

        if (!result) {
            console.log(`Failed to upsert StudentTermAverage for student ${studentCode}, term ${termCode}`);
            return;
        }

        // Cập nhật thứ hạng học kỳ
        await updateTermRankings(studentCode, termCode);
    } catch (error) {
        console.log(`Error in updateStudentTermAverage for student ${studentCode}, term ${termCode}: ${error.message}`);
        throw error;
    }
};

// Cập nhật thứ hạng trong lớp và trong khối cho điểm trung bình học kỳ
const updateTermRankings = async (studentCode, termCode) => {
    try {
        // Lấy thông tin học sinh và mối quan hệ với classroom
        const student = await Student.findOne({ student_code: studentCode }).populate('classroom');
        if (!student) {
            console.log(`Student ${studentCode} not found`);
            return;
        }

        if (!student.classroom) {
            console.log(`Classroom for student ${studentCode} not found`);
            return;
        }

        const classroomCode = student.classroom.classroom_code;
        const gradeCode = student.classroom.grade_code;

        // Lấy tất cả học sinh trong lớp
        const classroomStudents = await Student.find({ classroom_code: classroomCode }).distinct('student_code');

        // Lấy tất cả lớp học trong khối
        const classroomsInGrade = await Classroom.find({ grade_code: gradeCode }).distinct('classroom_code');

        // Lấy tất cả học sinh trong khối dựa trên classroom_code
        const gradeStudents = await Student.find({
            classroom_code: { $in: classroomsInGrade },
        }).distinct('student_code');

        if (!gradeStudents.length) {
            console.log(`No students found in grade ${gradeCode} for term ${termCode}`);
            return;
        }

        // Lấy điểm trung bình học kỳ của tất cả học sinh trong lớp
        const classroomAverages = await StudentTermAverage.find({
            term_code: termCode,
            student_code: { $in: classroomStudents },
        })
            .sort({ term_average: -1, student_code: 1 })
            .lean();

        const classroomRankings = classroomAverages.reduce((acc, item, index) => {
            acc[item.student_code] = index + 1;
            return acc;
        }, {});

        // Lấy điểm trung bình học kỳ của tất cả học sinh trong khối
        const gradeAverages = await StudentTermAverage.find({
            term_code: termCode,
            student_code: { $in: gradeStudents },
        })
            .sort({ term_average: -1, student_code: 1 })
            .lean();

        if (!gradeAverages.length) {
            console.log(`No StudentTermAverage records found for grade ${gradeCode}, term ${termCode}`);
            return;
        }

        const gradeRankings = gradeAverages.reduce((acc, item, index) => {
            acc[item.student_code] = index + 1;
            return acc;
        }, {});

        // Cập nhật thứ hạng cho tất cả học sinh trong lớp
        for (const [studentCode, rank] of Object.entries(classroomRankings)) {
            await StudentTermAverage.updateOne(
                { student_code: studentCode, term_code: termCode },
                { classroom_rank: rank }
            );
        }

        // Cập nhật thứ hạng cho tất cả học sinh trong khối
        for (const [studentCode, rank] of Object.entries(gradeRankings)) {
            await StudentTermAverage.updateOne(
                { student_code: studentCode, term_code: termCode },
                { grade_rank: rank }
            );
        }

        // Kiểm tra xem StudentTermAverage có tồn tại không
        const studentTermAverage = await StudentTermAverage.findOne({
            student_code: studentCode,
            term_code: termCode,
        });

        if (!studentTermAverage) {
            console.log(`StudentTermAverage for student ${studentCode} and term ${termCode} not found`);
            return;
        }
    } catch (error) {
        console.log(`Error in updateTermRankings for student ${studentCode}, term ${termCode}: ${error.message}`);
        throw error;
    }
};

// Cập nhật điểm trung bình cả năm cho một môn học
const updateSubjectYearlyAverage = async (studentCode, subjectCode, schoolYearCode) => {
    try {
        // Lấy tất cả term_codes thuộc school_year_code
        const termCodes = await Term.find({ school_year_code: schoolYearCode }).distinct('term_code');

        // Kiểm tra xem có dữ liệu trong SubjectAverage không
        const subjectAverages = await SubjectAverage.find({
            student_code: studentCode,
            subject_code: subjectCode,
            term_code: { $in: termCodes },
        });

        // Tính điểm trung bình cả năm của môn học
        const averages = await SubjectAverage.aggregate([
            {
                $match: {
                    student_code: studentCode,
                    subject_code: subjectCode,
                    term_code: { $in: termCodes },
                },
            },
            {
                $group: {
                    _id: null,
                    yearly_average: { $avg: '$term_average' },
                },
            },
        ]);

        const yearlyAverage = averages.length > 0 ? averages[0].yearly_average : 0;

        // Cập nhật hoặc tạo mới bản ghi SubjectYearlyAverage
        const result = await SubjectYearlyAverage.findOneAndUpdate(
            { student_code: studentCode, subject_code: subjectCode, school_year_code: schoolYearCode },
            { yearly_average: yearlyAverage },
            { upsert: true, new: true, runValidators: true }
        );
        if (!result) {
            console.log(`Failed to upsert SubjectYearlyAverage for student ${studentCode}, subject ${subjectCode}, school year ${schoolYearCode}`);
            return;
        }
    } catch (error) {
        console.log(`Error in updateSubjectYearlyAverage for student ${studentCode}, subject ${subjectCode}, school year ${schoolYearCode}: ${error.message}`);
        throw error;
    }
};

// Cập nhật điểm trung bình cả năm và thứ hạng của học sinh
const updateStudentYearlyAverage = async (studentCode, schoolYearCode) => {
    try {
        // Kiểm tra xem có dữ liệu trong SubjectYearlyAverage không
        const subjectYearlyAverages = await SubjectYearlyAverage.find({
            student_code: studentCode,
            school_year_code: schoolYearCode,
        });

        // Tính điểm trung bình cả năm của học sinh
        const averages = await SubjectYearlyAverage.aggregate([
            {
                $match: {
                    student_code: studentCode,
                    school_year_code: schoolYearCode,
                },
            },
            {
                $group: {
                    _id: null,
                    yearly_average: { $avg: '$yearly_average' },
                },
            },
        ]);

        const yearlyAverage = averages.length > 0 ? averages[0].yearly_average : 0;

        // Tính học lực dựa trên điểm trung bình cả năm
        const academicPerformance = calculateAcademicPerformance(yearlyAverage);

        // Cập nhật hoặc tạo mới bản ghi StudentYearlyAverage
        const result = await StudentYearlyAverage.findOneAndUpdate(
            { student_code: studentCode, school_year_code: schoolYearCode },
            { yearly_average: yearlyAverage, academic_performance: academicPerformance },
            { upsert: true, new: true, runValidators: true }
        );

        if (!result) {
            console.log(`Failed to upsert StudentYearlyAverage for student ${studentCode}, school year ${schoolYearCode}`);
            return;
        }

        // Cập nhật thứ hạng
        await updateRankings(studentCode, schoolYearCode);
    } catch (error) {
        console.log(`Error in updateStudentYearlyAverage for student ${studentCode}, school year ${schoolYearCode}: ${error.message}`);
        throw error;
    }
};

// Cập nhật thứ hạng trong lớp và trong khối cho điểm trung bình cả năm
const updateRankings = async (studentCode, schoolYearCode) => {
    try {
        // Lấy thông tin học sinh và mối quan hệ với classroom
        const student = await Student.findOne({ student_code: studentCode }).populate('classroom');
        if (!student) {
            console.log(`Student ${studentCode} not found`);
            return;
        }

        if (!student.classroom) {
            console.log(`Classroom for student ${studentCode} not found`);
            return;
        }

        const classroomCode = student.classroom.classroom_code;
        const gradeCode = student.classroom.grade_code;

        // Lấy tất cả học sinh trong lớp
        const classroomStudents = await Student.find({ classroom_code: classroomCode }).distinct('student_code');

        // Lấy tất cả lớp học trong khối
        const classroomsInGrade = await Classroom.find({ grade_code: gradeCode }).distinct('classroom_code');

        // Lấy tất cả học sinh trong khối dựa trên classroom_code
        const gradeStudents = await Student.find({
            classroom_code: { $in: classroomsInGrade },
        }).distinct('student_code');

        if (!gradeStudents.length) {
            console.log(`No students found in grade ${gradeCode} for school year ${schoolYearCode}`);
            return;
        }

        // Lấy điểm trung bình cả năm của tất cả học sinh trong lớp
        const classroomAverages = await StudentYearlyAverage.find({
            school_year_code: schoolYearCode,
            student_code: { $in: classroomStudents },
        })
            .sort({ yearly_average: -1, student_code: 1 })
            .lean();

        const classroomRankings = classroomAverages.reduce((acc, item, index) => {
            acc[item.student_code] = index + 1;
            return acc;
        }, {});

        // Lấy điểm trung bình cả năm của tất cả học sinh trong khối
        const gradeAverages = await StudentYearlyAverage.find({
            school_year_code: schoolYearCode,
            student_code: { $in: gradeStudents },
        })
            .sort({ yearly_average: -1, student_code: 1 })
            .lean();

        if (!gradeAverages.length) {
            console.log(`No StudentYearlyAverage records found for grade ${gradeCode}, school year ${schoolYearCode}`);
            return;
        }

        const gradeRankings = gradeAverages.reduce((acc, item, index) => {
            acc[item.student_code] = index + 1;
            return acc;
        }, {});

        // Cập nhật thứ hạng cho tất cả học sinh trong lớp
        for (const [studentCode, rank] of Object.entries(classroomRankings)) {
            await StudentYearlyAverage.updateOne(
                { student_code: studentCode, school_year_code: schoolYearCode },
                { classroom_rank: rank }
            );
        }

        // Cập nhật thứ hạng cho tất cả học sinh trong khối
        for (const [studentCode, rank] of Object.entries(gradeRankings)) {
            await StudentYearlyAverage.updateOne(
                { student_code: studentCode, school_year_code: schoolYearCode },
                { grade_rank: rank }
            );
        }

        // Kiểm tra xem StudentYearlyAverage có tồn tại không
        const studentYearlyAverage = await StudentYearlyAverage.findOne({
            student_code: studentCode,
            school_year_code: schoolYearCode,
        });

        if (!studentYearlyAverage) {
            console.log(`StudentYearlyAverage for student ${studentCode} and school_year ${schoolYearCode} not found`);
            return;
        }
    } catch (error) {
        console.log(`Error in updateRankings for student ${studentCode}, school_year ${schoolYearCode}: ${error.message}`);
        throw error;
    }
};

module.exports = {
    updateAverages,
    updateSubjectTermAverage,
    updateStudentTermAverage,
    updateTermRankings,
    updateSubjectYearlyAverage,
    updateStudentYearlyAverage,
    updateRankings,
};