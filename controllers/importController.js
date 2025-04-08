const XLSX = require('xlsx');
const Score = require('../models/score');
const Exam = require('../models/exam');
const Student = require('../models/student');
const { updateAverages } = require('../services/averageService');

const importScores = async (req, res) => {
    try {
        console.log('Starting importScores...');

        // Kiểm tra file upload
        if (!req.file) {
            console.log('No file uploaded.');
            return res.status(400).json({
                status: 'error',
                message: 'No file uploaded.',
            });
        }

        const file = req.file;
        console.log('Uploaded file:', file.originalname);

        // Đọc file Excel
        const workbook = XLSX.read(file.buffer, { type: 'buffer' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        console.log('Total rows in Excel file:', rows.length);

        if (rows.length === 0) {
            console.log('Excel file is empty.');
            return res.status(400).json({
                status: 'error',
                message: 'Excel file is empty.',
            });
        }

        // Kiểm tra header của file Excel
        const header = rows.shift(); // Lấy dòng đầu tiên làm header
        const expectedHeader = ['student_code', 'name', 'exam_name', 'score_value'];
        if (JSON.stringify(header) !== JSON.stringify(expectedHeader)) {
            console.log('Invalid Excel header. Expected:', expectedHeader);
            return res.status(400).json({
                status: 'error',
                message: 'Invalid Excel header. Expected: student_code, name, exam_name, score_value.',
            });
        }

        // Xử lý từng dòng dữ liệu
        let importedCount = 0;
        const errors = [];

        for (let index = 0; index < rows.length; index++) {
            const row = rows[index];
            const rowNumber = index + 2; // Dòng 1 là header, nên bắt đầu từ dòng 2

            // Kiểm tra dòng trống
            if (!row || row.every(cell => !cell)) {
                console.log(`Skipping empty row at line ${rowNumber}`);
                continue;
            }

            // Lấy dữ liệu từ các cột
            const studentCode = row[0]; // student_code
            const examName = row[2]; // exam_name
            const scoreValue = row[3]; // score_value

            // Kiểm tra dữ liệu hợp lệ
            if (!studentCode || !examName || scoreValue === undefined || scoreValue === null) {
                errors.push(`Missing required fields at row ${rowNumber} (student_code: ${studentCode}, exam_name: ${examName})`);
                console.log(`Missing required fields at row ${rowNumber}`);
                continue;
            }

            // Kiểm tra student_code tồn tại
            const student = await Student.findOne({ student_code: studentCode });
            if (!student) {
                errors.push(`Student not found for student_code '${studentCode}' at row ${rowNumber}`);
                console.log(`Student not found for student_code '${studentCode}' at row ${rowNumber}`);
                continue;
            }

            // Kiểm tra điểm hợp lệ
            if (isNaN(scoreValue) || scoreValue < 0 || scoreValue > 10) {
                errors.push(`Invalid score value at row ${rowNumber}: ${scoreValue}`);
                console.log(`Invalid score value at row ${rowNumber}: ${scoreValue}`);
                continue;
            }

            // Tìm exam_code từ exam_name
            const exam = await Exam.findOne({ exam_name: examName });
            if (!exam) {
                errors.push(`Exam not found for exam_name '${examName}' at row ${rowNumber}`);
                console.log(`Exam not found for exam_name '${examName}' at row ${rowNumber}`);
                continue;
            }
            const examCode = exam.exam_code;

            // Kiểm tra xem điểm đã tồn tại chưa
            const existingScore = await Score.findOne({
                student_code: studentCode,
                exam_code: examCode,
            });

            if (existingScore) {
                // Cập nhật điểm nếu đã tồn tại
                existingScore.score_value = parseFloat(scoreValue);
                await existingScore.save();
                console.log(`Updated score at row ${rowNumber}: student_code=${studentCode}, exam_code=${examCode}, score_value=${scoreValue}`);
            } else {
                // Tạo mới điểm nếu chưa tồn tại
                const newScore = new Score({
                    student_code: studentCode,
                    exam_code: examCode,
                    score_value: parseFloat(scoreValue),
                });
                await newScore.save();
                console.log(`Imported score at row ${rowNumber}: student_code=${studentCode}, exam_code=${examCode}, score_value=${scoreValue}`);
            }

            // Cập nhật điểm trung bình sau khi thêm/cập nhật điểm
            await updateAverages(studentCode, examCode);

            importedCount++;
        }

        // Trả về kết quả
        const response = {
            status: 'success',
            message: `Imported/Updated ${importedCount} scores successfully.`,
            imported_count: importedCount,
        };

        if (errors.length > 0) {
            response.status = 'partial_success';
            response.message = `Imported/Updated ${importedCount} scores with some errors.`;
            response.errors = errors;
        }

        console.log(`Import completed: ${importedCount} scores imported/updated.`);
        return res.status(200).json(response);

    } catch (error) {
        console.error(`Error in importScores: ${error.message}`);
        console.error(error.stack);
        return res.status(500).json({
            status: 'error',
            message: 'An error occurred while importing scores.',
            error: error.message,
        });
    }
};

module.exports = { importScores };