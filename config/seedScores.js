const mongoose = require('mongoose');
const Student = require('../models/student');
const Exam = require('../models/exam');
const Score = require('../models/score');
const { updateAverages } = require('../services/averageService');

const seedScores = async () => {
    try {
        console.log('Starting score seeding...');

        // Lấy tất cả học sinh
        const students = await Student.find();
        if (!students.length) {
            console.log('No students found in the system.');
            return;
        }

        // Lấy tất cả bài kiểm tra
        const exams = await Exam.find();
        if (!exams.length) {
            console.log('No exams found in the system.');
            return;
        }

        // Lấy tất cả điểm hiện có trong collection scores
        const existingScores = await Score.find().select('student_code exam_code');
        const existingScoresMap = existingScores.reduce((map, score) => {
            map[`${score.student_code}_${score.exam_code}`] = true;
            return map;
        }, {});

        const totalStudents = students.length;
        const totalExams = exams.length;
        console.log(`Found ${totalStudents} students and ${totalExams} exams.`);

        const scoresToAdd = [];
        let missingScoresCount = 0;

        // Duyệt qua từng học sinh và từng bài kiểm tra
        for (const student of students) {
            for (const exam of exams) {
                const key = `${student.student_code}_${exam.exam_code}`;

                // Kiểm tra xem cặp student_code và exam_code đã có điểm chưa
                if (!existingScoresMap[key]) {
                    missingScoresCount++;
                    const scoreValue = (Math.random() * 9 + 1).toFixed(1); // Random điểm từ 1.0 đến 10.0

                    scoresToAdd.push({
                        student_code: student.student_code,
                        exam_code: exam.exam_code,
                        score_value: parseFloat(scoreValue),
                        created_at: new Date(),
                        updated_at: new Date(),
                    });

                    console.log(`Adding score for student ${student.student_code} in exam ${exam.exam_code}: ${scoreValue}`);
                } else {
                    console.log(`Score already exists for student ${student.student_code} in exam ${exam.exam_code}, skipping...`);
                }
            }
        }

        if (!scoresToAdd.length) {
            console.log('No missing scores to add.');
            return;
        }

        // Thêm tất cả điểm mới vào collection scores
        try {
            await Score.insertMany(scoresToAdd);
            console.log(`Successfully added ${missingScoresCount} missing scores.`);
        } catch (error) {
            console.error(`Error adding scores: ${error.message}`);
            return;
        }

        // Gọi updateAverages thủ công cho từng cặp student_code và exam_code
        const uniqueStudentExamPairs = [...new Set(scoresToAdd.map(score => `${score.student_code}_${score.exam_code}`))];
        for (const pair of uniqueStudentExamPairs) {
            const [studentCode, examCode] = pair.split('_');
            try {
                await updateAverages(studentCode, examCode);
                console.log(`Updated averages for student ${studentCode} and exam ${examCode}`);
            } catch (error) {
                console.error(`Error updating averages for student ${studentCode} and exam ${examCode}: ${error.message}`);
            }
        }

        console.log('Score seeding completed.');
    } catch (error) {
        console.error('Error seeding scores:', error);
    }
};

// Hàm chạy seed thủ công
const runSeed = async () => {
    // Kết nối đến MongoDB nếu chưa kết nối
    if (mongoose.connection.readyState === 0) {
        await mongoose.connect('mongodb://localhost:27017/scoremanagementjs', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('Connected to MongoDB');
    }

    await seedScores();

    // Ngắt kết nối sau khi hoàn thành
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
};

// Nếu file được chạy trực tiếp (node seedScores.js)
if (require.main === module) {
    runSeed().then(() => process.exit(0)).catch(err => {
        console.error(err);
        process.exit(1);
    });
}

module.exports = { seedScores };