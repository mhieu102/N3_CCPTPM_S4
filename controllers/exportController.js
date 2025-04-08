const ExcelJS = require('exceljs');
const axios = require('axios');
const Score = require('../models/score');
const Student = require('../models/student');
const Exam = require('../models/exam');
const Term = require('../models/term');
const SchoolYear = require('../models/schoolYear');
const StudentTermAverage = require('../models/studentTermAverage');
const StudentYearlyAverage = require('../models/studentYearlyAverage');

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
 * Export điểm của học sinh đã xác thực
 */
const exportStudentScores = async (req, res) => {
    try {
        // Kiểm tra người dùng có phải là học sinh không
        ensureStudent(req.user);

        console.log('Starting exportStudentScores for student: ' + req.user.student_code);

        // Lấy điểm của học sinh đã xác thực
        const scores = await Score.find({ student_code: req.user.student_code })
            .populate('student', 'name')
            .populate('exam', 'exam_name');

        if (!scores.length) {
            console.log('No scores found for student: ' + req.user.student_code);
            return res.status(404).json({
                status: 'error',
                message: 'Không tìm thấy điểm nào để export.',
            });
        }

        // Tạo file Excel
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('My Scores');
        worksheet.columns = [
            { header: 'Student Code', key: 'student_code', width: 15 },
            { header: 'Name', key: 'name', width: 20 },
            { header: 'Exam Name', key: 'exam_name', width: 40 },
            { header: 'Score Value', key: 'score_value', width: 15 },
        ];
        worksheet.getRow(1).font = { bold: true };

        scores.forEach((score) => {
            if (!score.student || !score.exam) return;
            worksheet.addRow({
                student_code: score.student_code,
                name: score.student.name || 'N/A',
                exam_name: score.exam.exam_name || 'N/A',
                score_value: score.score_value,
            });
        });

        if (worksheet.rowCount === 1) {
            return res.status(404).json({
                status: 'error',
                message: 'Không tìm thấy điểm hợp lệ để export.',
            });
        }

        // Lưu file Excel vào buffer
        const buffer = await workbook.xlsx.writeBuffer();

        // Upload file lên CDN
        const cdnResponse = await axios.post(
            'http://localhost:4000/cdn/upload-scores?type=js',
            buffer,
            {
                headers: { 'Content-Type': 'application/octet-stream' },
            }
        );

        const fileUrl = `http://localhost:4000${cdnResponse.data.url}`;
        res.json({
            status: 'success',
            message: 'Điểm của bạn đã được export thành công',
            url: fileUrl,
            downloadUrl: `http://localhost:4000/cdn/download/${cdnResponse.data.url.split('/').pop()}`,
        });
    } catch (error) {
        console.error(`Error in exportStudentScores: ${error.message}`);
        const statusCode = error.message.includes('Không có quyền') ? 403 : 500;
        return res.status(statusCode).json({
            status: 'error',
            message: error.message.includes('Không có quyền')
                ? error.message
                : 'Lỗi khi export điểm của bạn',
            error: error.message,
        });
    }
};

const exportScores = async (req, res) => {
    try {
        console.log('Starting exportScores...');
        const scores = await Score.find()
            .populate('student', 'name')
            .populate('exam', 'exam_name');

        if (!scores.length) {
            return res.status(404).json({ status: 'error', message: 'No scores found to export.' });
        }

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Scores');
        worksheet.columns = [
            { header: 'Student Code', key: 'student_code', width: 15 },
            { header: 'Name', key: 'name', width: 20 },
            { header: 'Exam Name', key: 'exam_name', width: 40 },
            { header: 'Score Value', key: 'score_value', width: 15 },
        ];
        worksheet.getRow(1).font = { bold: true };

        scores.forEach((score) => {
            if (!score.student || !score.exam) return;
            worksheet.addRow({
                student_code: score.student_code,
                name: score.student.name || 'N/A',
                exam_name: score.exam.exam_name || 'N/A',
                score_value: score.score_value,
            });
        });

        if (worksheet.rowCount === 1) {
            return res.status(404).json({ status: 'error', message: 'No valid scores found to export.' });
        }

        const buffer = await workbook.xlsx.writeBuffer();
        const cdnResponse = await axios.post('http://localhost:4000/cdn/upload-scores?type=js', buffer, {
            headers: { 'Content-Type': 'application/octet-stream' },
        });

        const fileUrl = `http://localhost:4000${cdnResponse.data.url}`;
        res.json({
            status: 'success',
            message: 'Scores exported successfully',
            url: fileUrl,
            downloadUrl: `http://localhost:4000/cdn/download/${cdnResponse.data.url.split('/').pop()}`,
        });
    } catch (error) {
        console.error(`Error in exportScores: ${error.message}`);
        return res.status(500).json({ status: 'error', message: 'Error exporting scores', error: error.message });
    }
};

const exportStudentTermAverages = async (req, res) => {
    try {
        console.log('Starting exportStudentTermAverages...');
        const studentTermAverages = await StudentTermAverage.find()
            .populate('student', 'name')
            .populate('term', 'term_name');

        if (!studentTermAverages.length) {
            return res.status(404).json({ status: 'error', message: 'No student term averages found to export.' });
        }

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('StudentTermAverages');
        worksheet.columns = [
            { header: 'Student Code', key: 'student_code', width: 15 },
            { header: 'Name', key: 'name', width: 20 },
            { header: 'Term Name', key: 'term_name', width: 20 },
            { header: 'Term Average', key: 'term_average', width: 15 },
            { header: 'Classroom Rank', key: 'classroom_rank', width: 15 },
            { header: 'Grade Rank', key: 'grade_rank', width: 15 },
            { header: 'Academic Performance', key: 'academic_performance', width: 20 },
        ];
        worksheet.getRow(1).font = { bold: true };

        studentTermAverages.forEach((average) => {
            if (!average.student || !average.term) return;
            worksheet.addRow({
                student_code: average.student_code,
                name: average.student.name || 'N/A',
                term_name: average.term.term_name || 'N/A',
                term_average: average.term_average,
                classroom_rank: average.classroom_rank,
                grade_rank: average.grade_rank,
                academic_performance: average.academic_performance,
            });
        });

        if (worksheet.rowCount === 1) {
            return res.status(404).json({ status: 'error', message: 'No valid student term averages found to export.' });
        }

        const buffer = await workbook.xlsx.writeBuffer();
        const cdnResponse = await axios.post('http://localhost:4000/cdn/upload-student-term-averages?type=js', buffer, {
            headers: { 'Content-Type': 'application/octet-stream' },
        });

        const fileUrl = `http://localhost:4000${cdnResponse.data.url}`;
        res.json({
            status: 'success',
            message: 'Student term averages exported successfully',
            url: fileUrl,
            downloadUrl: `http://localhost:4000/cdn/download/${cdnResponse.data.url.split('/').pop()}`,
        });
    } catch (error) {
        console.error(`Error in exportStudentTermAverages: ${error.message}`);
        return res.status(500).json({ status: 'error', message: 'Error exporting student term averages', error: error.message });
    }
};

const exportStudentYearlyAverages = async (req, res) => {
    try {
        console.log('Starting exportStudentYearlyAverages...');
        const studentYearlyAverages = await StudentYearlyAverage.find()
            .populate('student', 'name')
            .populate('schoolYear', 'school_year_name');

        if (!studentYearlyAverages.length) {
            return res.status(404).json({ status: 'error', message: 'No student yearly averages found to export.' });
        }

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('StudentYearlyAverages');
        worksheet.columns = [
            { header: 'Student Code', key: 'student_code', width: 15 },
            { header: 'Name', key: 'name', width: 20 },
            { header: 'School Year Name', key: 'school_year_name', width: 20 },
            { header: 'Yearly Average', key: 'yearly_average', width: 15 },
            { header: 'Classroom Rank', key: 'classroom_rank', width: 15 },
            { header: 'Grade Rank', key: 'grade_rank', width: 15 },
            { header: 'Academic Performance', key: 'academic_performance', width: 20 },
        ];
        worksheet.getRow(1).font = { bold: true };

        studentYearlyAverages.forEach((average) => {
            if (!average.student || !average.schoolYear) return;
            worksheet.addRow({
                student_code: average.student_code,
                name: average.student.name || 'N/A',
                school_year_name: average.schoolYear.school_year_name || 'N/A',
                yearly_average: average.yearly_average,
                classroom_rank: average.classroom_rank,
                grade_rank: average.grade_rank,
                academic_performance: average.academic_performance,
            });
        });

        if (worksheet.rowCount === 1) {
            return res.status(404).json({ status: 'error', message: 'No valid student yearly averages found to export.' });
        }

        const buffer = await workbook.xlsx.writeBuffer();
        const cdnResponse = await axios.post('http://localhost:4000/cdn/upload-student-yearly-averages?type=js', buffer, {
            headers: { 'Content-Type': 'application/octet-stream' },
        });

        const fileUrl = `http://localhost:4000${cdnResponse.data.url}`;
        res.json({
            status: 'success',
            message: 'Student yearly averages exported successfully',
            url: fileUrl,
            downloadUrl: `http://localhost:4000/cdn/download/${cdnResponse.data.url.split('/').pop()}`,
        });
    } catch (error) {
        console.error(`Error in exportStudentYearlyAverages: ${error.message}`);
        return res.status(500).json({ status: 'error', message: 'Error exporting student yearly averages', error: error.message });
    }
};

module.exports = {
    exportScores,
    exportStudentScores,
    exportStudentTermAverages,
    exportStudentYearlyAverages,
};