const mongoose = require('mongoose');
const Teacher = require('../models/teacher');
const Classroom = require('../models/classroom');
const Subject = require('../models/subject');
const TeacherSubject = require('../models/teacherSubject');
const ClassroomTeacher = require('../models/classroomTeacher');
const bcrypt = require('bcryptjs');

const seedTeachers = async () => {
    try {
        console.log('Starting teacher seeding...');

        const classrooms = await Classroom.find();
        if (!classrooms.length) {
            console.log('No classrooms found.');
            return;
        }

        const allSubjects = (await Subject.find()).map(s => s.subject_code);
        if (!allSubjects.length) {
            throw new Error('Chưa có môn học nào trong hệ thống. Vui lòng seed bảng subjects trước.');
        }

        const latestTeacher = await Teacher.findOne().sort('-teacher_code');
        let teacherCounter = latestTeacher ? parseInt(latestTeacher.teacher_code.slice(1)) : 0;

        for (const classroom of classrooms) {
            console.log(`Processing classroom ${classroom.classroom_code}...`);

            const assignedSubjects = (await ClassroomTeacher.find({ classroom_code: classroom.classroom_code }))
                .map(ct => ct.subject_code);
            const remainingSubjects = allSubjects.filter(s => !assignedSubjects.includes(s));
            const needsSubjects = remainingSubjects.length > 0;
            const hasSubjectTeachers = assignedSubjects.length > 0;
            const needsHomeroomTeacher = !classroom.homeroom_teacher_code;

            if (needsHomeroomTeacher) {
                teacherCounter++;
                const teacherCode = `T${teacherCounter}`;
                const teacherData = {
                    teacher_code: teacherCode,
                    email: `teacher${teacherCounter}@example.com`,
                    password: 'password123',
                    name: `Teacher ${teacherCounter}`,
                    role_code: 'R1',
                };
                const teacher = new Teacher(teacherData);
                await teacher.save();

                console.log(`Created teacher: ${teacherData.email} with code ${teacherCode}`);

                classroom.homeroom_teacher_code = teacherCode;
                await classroom.save();
                console.log(`Assigned teacher ${teacherCode} as homeroom teacher for classroom ${classroom.classroom_code}`);

                if (needsSubjects) {
                    const subjectsToAssign = remainingSubjects;
                    const teacherSubjectData = subjectsToAssign.map(subject_code => ({
                        teacher_code: teacherCode,
                        subject_code,
                    }));
                    await TeacherSubject.insertMany(teacherSubjectData);

                    const classroomTeacherData = subjectsToAssign.map(subject_code => ({
                        classroom_code: classroom.classroom_code,
                        teacher_code: teacherCode,
                        subject_code,
                    }));
                    await ClassroomTeacher.insertMany(classroomTeacherData);

                    console.log(
                        hasSubjectTeachers
                            ? `Classroom ${classroom.classroom_code} already has some subject teachers. Assigned remaining subjects to homeroom teacher ${teacherCode}: ${subjectsToAssign.join(', ')}`
                            : `Classroom ${classroom.classroom_code} has no subject teachers. Assigned all subjects to homeroom teacher ${teacherCode}: ${subjectsToAssign.join(', ')}`
                    );
                } else {
                    console.log(`Classroom ${classroom.classroom_code} already has all subjects assigned, no additional subjects needed for homeroom teacher.`);
                }
            } else if (needsSubjects) {
                const existingTeacher = await findExistingTeacherForSubjects(remainingSubjects, classroom.classroom_code);
                if (existingTeacher) {
                    const teacherCode = existingTeacher.teacher_code;
                    const subjectsToAssign = remainingSubjects.filter(s => existingTeacher.subjects.includes(s));

                    const classroomTeacherData = subjectsToAssign.map(subject_code => ({
                        classroom_code: classroom.classroom_code,
                        teacher_code: teacherCode,
                        subject_code,
                    }));
                    await ClassroomTeacher.insertMany(classroomTeacherData);

                    console.log(`Found existing teacher ${teacherCode} to teach remaining subjects in classroom ${classroom.classroom_code}: ${subjectsToAssign.join(', ')}`);
                } else {
                    teacherCounter++;
                    const teacherCode = `T${teacherCounter}`;
                    const teacherData = {
                        teacher_code: teacherCode,
                        email: `teacher${teacherCounter}@example.com`,
                        password: 'password123',
                        name: `Teacher ${teacherCounter}`,
                        role_code: 'R1',
                    };
                    const teacher = new Teacher(teacherData);
                    await teacher.save();

                    console.log(`No existing teacher found. Created new teacher: ${teacherData.email} with code ${teacherCode}`);

                    const subjectsToAssign = remainingSubjects;
                    const teacherSubjectData = subjectsToAssign.map(subject_code => ({
                        teacher_code: teacherCode,
                        subject_code,
                    }));
                    await TeacherSubject.insertMany(teacherSubjectData);

                    const classroomTeacherData = subjectsToAssign.map(subject_code => ({
                        classroom_code: classroom.classroom_code,
                        teacher_code: teacherCode,
                        subject_code,
                    }));
                    await ClassroomTeacher.insertMany(classroomTeacherData);

                    console.log(`Assigned remaining subjects to new teacher ${teacherCode} for classroom ${classroom.classroom_code}: ${subjectsToAssign.join(', ')}`);
                }
            } else {
                console.log(`Classroom ${classroom.classroom_code} already has a homeroom teacher and all subjects assigned, skipping...`);
            }
        }

        console.log('Teacher seeding completed.');
    } catch (error) {
        console.error('Error seeding teachers:', error.message);
    }
};

/**
 * Tìm giáo viên hiện có từ các lớp khác có thể dạy các môn còn thiếu.
 * @param {Array} requiredSubjects - Các môn còn thiếu
 * @param {string} currentClassroomCode - Mã lớp hiện tại
 * @returns {Object|null} - Thông tin giáo viên phù hợp hoặc null nếu không tìm thấy
 */
async function findExistingTeacherForSubjects(requiredSubjects, currentClassroomCode) {
    const teachers = await Teacher.find();
    if (!teachers.length) return null;

    const teacherSubjects = await TeacherSubject.find({ teacher_code: { $in: teachers.map(t => t.teacher_code) } });
    const teacherSubjectMap = teacherSubjects.reduce((map, ts) => {
        map[ts.teacher_code] = map[ts.teacher_code] || [];
        map[ts.teacher_code].push(ts.subject_code);
        return map;
    }, {});

    const classroomTeachers = await ClassroomTeacher.find({ teacher_code: { $in: teachers.map(t => t.teacher_code) } });
    const teacherClassroomMap = classroomTeachers.reduce((map, ct) => {
        map[ct.teacher_code] = map[ct.teacher_code] || [];
        if (!map[ct.teacher_code].includes(ct.classroom_code)) {
            map[ct.teacher_code].push(ct.classroom_code);
        }
        return map;
    }, {});

    let bestTeacher = null;
    let minClassrooms = Infinity;

    for (const teacher of teachers) {
        const subjects = teacherSubjectMap[teacher.teacher_code] || [];
        const canTeachSubjects = requiredSubjects.filter(s => subjects.includes(s));
        if (!canTeachSubjects.length) continue;

        const classroomsTaught = teacherClassroomMap[teacher.teacher_code] || [];
        if (classroomsTaught.includes(currentClassroomCode)) continue;

        const classroomCount = classroomsTaught.length;
        if (classroomCount < minClassrooms) {
            minClassrooms = classroomCount;
            bestTeacher = { teacher_code: teacher.teacher_code, subjects };
        }
    }

    return bestTeacher;
}

// Hàm chạy seed thủ công
const runSeed = async () => {
    if (mongoose.connection.readyState === 0) {
        await mongoose.connect('mongodb://localhost:27017/scoremanagementjs', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('Connected to MongoDB');
    }

    await seedTeachers();
};

// Nếu file được chạy trực tiếp (node seedTeachers.js)
if (require.main === module) {
    runSeed().then(() => process.exit(0)).catch(err => {
        console.error(err);
        process.exit(1);
    });
}

module.exports = { seedTeachers };