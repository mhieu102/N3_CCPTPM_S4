const mongoose = require('mongoose');
const Role = require('../models/role');
const Term = require('../models/term');
const Classroom = require('../models/classroom');
const Subject = require('../models/subject');
const Exam = require('../models/exam');
const SchoolYear = require('../models/schoolYear');
const Grade = require('../models/grade');

const seedRoles = async () => {
    try {
        const roleCount = await Role.countDocuments();
        if (roleCount === 0) {
            console.log('Seeding roles...');
            await Role.insertMany([
                { role_code: 'R1', role_name: 'Teacher' },
                { role_code: 'R2', role_name: 'Student' },
            ]);
            console.log('Roles seeded successfully');
        } else {
            console.log('Roles already exist, skipping seed');
        }
    } catch (error) {
        console.error('Error seeding roles:', error);
    }
};

const seedSubjects = async () => {
    try {
        const subjectCount = await Subject.countDocuments();
        if (subjectCount === 0) {
            console.log('Seeding subjects...');
            const subjects = [
                { subject_code: 'MATH', subject_name: 'Toán', createdAt: new Date(), updatedAt: new Date() },
                { subject_code: 'LIT', subject_name: 'Văn', createdAt: new Date(), updatedAt: new Date() },
                { subject_code: 'ENG', subject_name: 'Anh', createdAt: new Date(), updatedAt: new Date() },
                { subject_code: 'PHY', subject_name: 'Lý', createdAt: new Date(), updatedAt: new Date() },
            ];
            await Subject.insertMany(subjects);
            console.log('Subjects seeded successfully');
        } else {
            console.log('Subjects already exist, skipping seed');
        }
    } catch (error) {
        console.error('Error seeding subjects:', error);
    }
};

const seedSchoolYears = async () => {
    try {
        const schoolYearCount = await SchoolYear.countDocuments();
        if (schoolYearCount === 0) {
            console.log('Seeding school years...');
            const schoolYears = [
                { school_year_code: 'SY_2024-2025', school_year_name: '2024-2025', createdAt: new Date(), updatedAt: new Date() },
            ];
            await SchoolYear.insertMany(schoolYears);
            console.log('School years seeded successfully');
        } else {
            console.log('School years already exist, skipping seed');
        }
    } catch (error) {
        console.error('Error seeding school years:', error);
    }
};

const seedTerms = async () => {
    try {
        const termCount = await Term.countDocuments();
        if (termCount === 0) {
            console.log('Seeding terms...');
            const schoolYears = await SchoolYear.find();
            const terms = [];

            for (const schoolYear of schoolYears) {
                const [startYear, endYear] = schoolYear.school_year_name.split('-');
                terms.push({
                    term_code: `T1_${startYear}-${endYear}`,
                    term_name: `Học kỳ 1 Năm ${startYear}-${endYear}`,
                    start_date: new Date(`${startYear}-09-01`),
                    end_date: new Date(`${startYear}-12-31`),
                    school_year_code: schoolYear.school_year_code,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                });
                terms.push({
                    term_code: `T2_${startYear}-${endYear}`,
                    term_name: `Học kỳ 2 Năm ${startYear}-${endYear}`,
                    start_date: new Date(`${endYear}-01-01`),
                    end_date: new Date(`${endYear}-05-31`),
                    school_year_code: schoolYear.school_year_code,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                });
            }
            await Term.insertMany(terms);
            console.log('Terms seeded successfully');
        } else {
            console.log('Terms already exist, skipping seed');
        }
    } catch (error) {
        console.error('Error seeding terms:', error);
    }
};

const seedGrades = async () => {
    try {
        const gradeCount = await Grade.countDocuments();
        if (gradeCount === 0) {
            console.log('Seeding grades...');
            const schoolYears = await SchoolYear.find();
            const grades = [];

            for (const schoolYear of schoolYears) {
                const [startYear, endYear] = schoolYear.school_year_name.split('-');
                grades.push({
                    grade_code: `G10_${schoolYear.school_year_code}`,
                    grade_name: `Khối 10 Năm ${schoolYear.school_year_name}`,
                    classroom_count: 0,
                    school_year_code: schoolYear.school_year_code,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                });
                grades.push({
                    grade_code: `G11_${schoolYear.school_year_code}`,
                    grade_name: `Khối 11 Năm ${schoolYear.school_year_name}`,
                    classroom_count: 0,
                    school_year_code: schoolYear.school_year_code,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                });
                grades.push({
                    grade_code: `G12_${schoolYear.school_year_code}`,
                    grade_name: `Khối 12 Năm ${schoolYear.school_year_name}`,
                    classroom_count: 0,
                    school_year_code: schoolYear.school_year_code,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                });
            }

            await Grade.insertMany(grades);
            console.log('Grades seeded successfully');
        } else {
            console.log('Grades already exist, skipping seed');
        }
    } catch (error) {
        console.error('Error seeding grades:', error);
    }
};

const seedClassrooms = async () => {
    try {
        const classroomCount = await Classroom.countDocuments();
        if (classroomCount === 0) {
            console.log('Seeding classrooms...');
            const grades = await Grade.find();
            const classrooms = [];

            for (const grade of grades) {
                if (grade.grade_code.includes('G10')) {
                    classrooms.push({
                        classroom_code: `C1_${grade.grade_code}`,
                        classroom_name: '10A',
                        grade_code: grade.grade_code,
                        student_count: 0,
                        homeroom_teacher_code: null,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    });
                    classrooms.push({
                        classroom_code: `C2_${grade.grade_code}`,
                        classroom_name: '10B',
                        grade_code: grade.grade_code,
                        student_count: 0,
                        homeroom_teacher_code: null,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    });
                } else if (grade.grade_code.includes('G11')) {
                    classrooms.push({
                        classroom_code: `C3_${grade.grade_code}`,
                        classroom_name: '11A',
                        grade_code: grade.grade_code,
                        student_count: 0,
                        homeroom_teacher_code: null,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    });
                    classrooms.push({
                        classroom_code: `C4_${grade.grade_code}`,
                        classroom_name: '11B',
                        grade_code: grade.grade_code,
                        student_count: 0,
                        homeroom_teacher_code: null,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    });
                } else if (grade.grade_code.includes('G12')) {
                    classrooms.push({
                        classroom_code: `C5_${grade.grade_code}`,
                        classroom_name: '12A',
                        grade_code: grade.grade_code,
                        student_count: 0,
                        homeroom_teacher_code: null,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    });
                    classrooms.push({
                        classroom_code: `C6_${grade.grade_code}`,
                        classroom_name: '12B',
                        grade_code: grade.grade_code,
                        student_count: 0,
                        homeroom_teacher_code: null,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    });
                }
            }

            await Classroom.insertMany(classrooms);

            // Cập nhật classroom_count cho từng Grade
            for (const grade of grades) {
                const count = await Classroom.countDocuments({ grade_code: grade.grade_code });
                await Grade.updateOne({ grade_code: grade.grade_code }, { classroom_count: count });
            }

            console.log('Classrooms seeded successfully');
        } else {
            console.log('Classrooms already exist, skipping seed');
        }
    } catch (error) {
        console.error('Error seeding classrooms:', error);
    }
};

const seedExams = async () => {
    try {
        const examCount = await Exam.countDocuments();
        if (examCount === 0) {
            console.log('Seeding exams...');
            const subjects = await Subject.find({}, 'subject_code subject_name');
            const terms = await Term.find({}, 'term_code start_date end_date school_year_code');
            const schoolYears = await SchoolYear.find({}, 'school_year_code school_year_name');
            
            // Tạo map để tra cứu nhanh
            const schoolYearMap = schoolYears.reduce((map, sy) => {
                map[sy.school_year_code] = sy.school_year_name;
                return map;
            }, {});

            const exams = [];
            let examCounter = 1;

            for (const term of terms) {
                for (const subject of subjects) {
                    const startDate = new Date(term.start_date);
                    const endDate = new Date(term.end_date);
                    const diffInDays = Math.round((endDate - startDate) / (1000 * 60 * 60 * 24));

                    // Xác định học kỳ từ term_code
                    const termNumber = term.term_code.split('_')[0]; // Lấy T1 hoặc T2
                    const termName = termNumber === 'T1' ? 'Học kỳ 1' : 'Học kỳ 2';

                    // Lấy school_year_name từ school_year_code
                    const schoolYearName = schoolYearMap[term.school_year_code];

                    // Tạo exam_name cho kỳ thi giữa kỳ
                    const midDate = new Date(startDate);
                    midDate.setDate(startDate.getDate() + Math.floor(diffInDays / 3));
                    exams.push({
                        exam_code: `E${examCounter}`,
                        exam_name: `Thi giữa ${termName} môn ${subject.subject_name} năm học ${schoolYearName}`,
                        subject_code: subject.subject_code,
                        term_code: term.term_code,
                        date: midDate,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    });
                    examCounter++;

                    // Tạo exam_name cho kỳ thi cuối kỳ
                    const finalDate = new Date(endDate);
                    finalDate.setDate(endDate.getDate() - Math.floor(diffInDays / 6));
                    exams.push({
                        exam_code: `E${examCounter}`,
                        exam_name: `Thi cuối ${termName} môn ${subject.subject_name} năm học ${schoolYearName}`,
                        subject_code: subject.subject_code,
                        term_code: term.term_code,
                        date: finalDate,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    });
                    examCounter++;
                }
            }

            await Exam.insertMany(exams);
            console.log('Exams seeded successfully');
        } else {
            console.log('Exams already exist, skipping seed');
        }
    } catch (error) {
        console.error('Error seeding exams:', error);
    }
};

module.exports = { 
    seedRoles, 
    seedSubjects, 
    seedSchoolYears,
    seedTerms, 
    seedExams, 
    seedGrades,
    seedClassrooms,
};