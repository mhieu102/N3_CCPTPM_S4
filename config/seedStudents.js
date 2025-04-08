const mongoose = require('mongoose');
const Classroom = require('../models/classroom');
const Student = require('../models/student');
const bcrypt = require('bcryptjs');

const seedStudents = async () => {
    try {
        console.log('Starting student seeding...');

        // Danh sách grade_code cần xử lý
        const targetGrades = ['G10', 'G11', 'G12'];

        // Lấy tất cả các lớp thuộc G10, G11, G12
        const classrooms = await Classroom.find({
            grade_code: { $in: targetGrades.map(grade => new RegExp(`^${grade}`)) }
        });

        if (!classrooms.length) {
            console.log('No classrooms found for grades G10, G11, or G12.');
            return;
        }

        // Lấy student_code lớn nhất hiện tại
        const latestStudent = await Student.findOne().sort('-student_code');
        let currentNumber = latestStudent ? parseInt(latestStudent.student_code.slice(1)) : 0;

        for (const classroom of classrooms) {
            // Tính số học sinh còn thiếu để đạt tối đa 10
            const studentsToAdd = 10 - classroom.student_count;

            if (studentsToAdd <= 0) {
                console.log(`Classroom ${classroom.classroom_code} already has ${classroom.student_count} students, skipping...`);
                continue;
            }

            // Lấy phần đầu của grade_code (G10, G11, G12)
            const gradePrefix = classroom.grade_code.split('_')[0];

            console.log(`Adding ${studentsToAdd} students to classroom ${classroom.classroom_code} (grade: ${classroom.grade_code})`);

            // Tạo học sinh cho lớp này
            for (let i = 1; i <= studentsToAdd; i++) {
                currentNumber++;
                const studentCode = `S${currentNumber}`;

                const studentData = {
                    student_code: studentCode,
                    name: `Student ${gradePrefix} ${classroom.student_count + i}`,
                    email: `student${gradePrefix}${currentNumber}@example.com`,
                    password: 'password123', // Mã hóa mật khẩu
                    role_code: 'R2',
                    classroom_code: classroom.classroom_code,
                };

                try {
                    const student = new Student(studentData);
                    await student.save();

                    // Cập nhật student_count trong classroom
                    classroom.student_count += 1;
                    await classroom.save();

                    console.log(`Created student: ${studentData.email} with code ${studentCode} for classroom ${classroom.classroom_code}`);
                } catch (error) {
                    console.error(`Error creating student ${studentCode}: ${error.message}`);
                    break; // Dừng nếu có lỗi
                }
            }
        }

        console.log('Student seeding completed.');
    } catch (error) {
        console.error('Error seeding students:', error);
    } finally {
        // Đóng kết nối nếu cần (tùy thuộc vào cách bạn cấu hình mongoose)
        // mongoose.connection.close();
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

    await seedStudents();
};

// Nếu file được chạy trực tiếp (node seedStudents.js)
if (require.main === module) {
    runSeed().then(() => process.exit(0)).catch(err => {
        console.error(err);
        process.exit(1);
    });
}

module.exports = { seedStudents };