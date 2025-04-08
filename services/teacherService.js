const Score = require('../models/score');
const Exam = require('../models/exam');
const Term = require('../models/term');
const SubjectAverage = require('../models/subjectAverage');
const SubjectYearlyAverage = require('../models/subjectYearlyAverage');
const StudentYearlyAverage = require('../models/studentYearlyAverage');
const Student = require('../models/student');
const Classroom = require('../models/classroom');
const Teacher = require('../models/teacher');
const Subject = require('../models/subject');
const TeacherSubject = require('../models/teacherSubject');
const ClassroomTeacher = require('../models/classroomTeacher');
const { updateAverages } = require('../services/averageService');
const { formidable } = require('formidable');
const fs = require('fs').promises;
const axios = require('axios');

/**
 * Gán giáo viên nhận dạy lớp và tự động tính toán các môn có thể dạy.
 * @param {Object} teacher - Giáo viên hiện tại
 * @param {string} classroomCode - Mã lớp học
 * @returns {Array} - Danh sách môn được gán
 */
async function assignTeachingClassroom(teacher, classroomCode) {
    const classroom = await Classroom.findOne({ classroom_code: classroomCode });
    if (!classroom) {
        throw new Error('Không tìm thấy lớp học');
    }

    const allSubjects = (await Subject.find()).map(s => s.subject_code);
    if (!allSubjects.length) {
        throw new Error('Chưa có môn học nào trong hệ thống');
    }

    const teacherSubjects = (await TeacherSubject.find({ teacher_code: teacher.teacher_code }))
        .map(ts => ts.subject_code);
    if (!teacherSubjects.length) {
        throw new Error('Giáo viên này chưa được gán môn học nào');
    }

    const remainingSubjects = await getRemainingSubjects(classroomCode, allSubjects);
    if (!remainingSubjects.length) {
        throw new Error('Lớp đã đủ giáo viên dạy tất cả các môn');
    }

    const subjectsToAssign = teacherSubjects.filter(s => remainingSubjects.includes(s));
    if (!subjectsToAssign.length) {
        throw new Error('Giáo viên không có môn nào phù hợp để nhận dạy');
    }

    const insertData = subjectsToAssign.map(subjectCode => ({
        classroom_code: classroomCode,
        teacher_code: teacher.teacher_code,
        subject_code: subjectCode,
    }));
    await ClassroomTeacher.insertMany(insertData);

    return subjectsToAssign;
}

/**
 * Lấy danh sách môn còn lại mà lớp cần.
 * @param {string} classroomCode - Mã lớp học
 * @param {Array} allSubjects - Danh sách tất cả môn học
 * @returns {Array} - Danh sách môn còn thiếu
 */
async function getRemainingSubjects(classroomCode, allSubjects) {
    const assignedSubjects = (await ClassroomTeacher.find({ classroom_code: classroomCode }))
        .map(ct => ct.subject_code);
    return allSubjects.filter(s => !assignedSubjects.includes(s));
}

/**
 * Lấy danh sách giáo viên dạy trong một lớp dựa trên classroom_code.
 * @param {string} classroomCode - Mã lớp học
 * @returns {Array} - Danh sách giáo viên và các môn họ dạy
 */
async function getTeachersInClassroom(classroomCode) {
    const classroom = await Classroom.findOne({ classroom_code: classroomCode });
    if (!classroom) {
        throw new Error('Không tìm thấy lớp học');
    }

    const teachersInClass = await ClassroomTeacher.find({ classroom_code: classroomCode });
    if (!teachersInClass.length) {
        return [];
    }

    const teacherCodes = [...new Set(teachersInClass.map(t => t.teacher_code))];
    const teachers = await Teacher.find({ teacher_code: { $in: teacherCodes } }).select('-password');
    const subjectCodes = [...new Set(teachersInClass.map(t => t.subject_code))];
    const subjects = await Subject.find({ subject_code: { $in: subjectCodes } });

    const result = teacherCodes.map(teacherCode => {
        const teacher = teachers.find(t => t.teacher_code === teacherCode);
        const subjectsTaught = teachersInClass
            .filter(t => t.teacher_code === teacherCode)
            .map(t => {
                const subject = subjects.find(s => s.subject_code === t.subject_code);
                return subject ? { subject_code: subject.subject_code, subject_name: subject.subject_name } : null;
            })
            .filter(Boolean);

        return {
            teacher_code: teacher.teacher_code,
            name: teacher.name,
            email: teacher.email,
            subjects: subjectsTaught,
        };
    });

    return result;
}

/**
 * Nhập điểm mới hoặc sửa điểm cho học sinh trong một lớp cho một bài kiểm tra cụ thể.
 * @param {Object} teacher - Giáo viên hiện tại
 * @param {string} classroomCode - Mã lớp học
 * @param {string} examCode - Mã bài kiểm tra
 * @param {Array} scores - Danh sách điểm của học sinh
 * @returns {Array} - Danh sách tất cả điểm sau khi nhập hoặc sửa
 */
async function enterScores(teacher, classroomCode, examCode, scores) {
    // Kiểm tra lớp học có tồn tại không
    const classroom = await Classroom.findOne({ classroom_code: classroomCode });
    if (!classroom) {
        throw new Error('Không tìm thấy lớp học');
    }

    // Kiểm tra bài kiểm tra có tồn tại không
    const exam = await Exam.findOne({ exam_code: examCode });
    if (!exam) {
        throw new Error('Không tìm thấy bài kiểm tra');
    }

    // Kiểm tra xem giáo viên có quyền nhập điểm cho môn học này trong lớp này không
    const subjectCode = exam.subject_code;
    const isAssigned = await ClassroomTeacher.findOne({
        classroom_code: classroomCode,
        teacher_code: teacher.teacher_code,
        subject_code: subjectCode,
    });

    if (!isAssigned) {
        throw new Error('Bạn không có quyền nhập điểm cho môn học này trong lớp này');
    }

    // Lấy danh sách học sinh trong lớp
    const students = await Student.find({ classroom_code: classroomCode });
    const studentCodes = students.map(student => student.student_code);
    if (!studentCodes.length) {
        throw new Error('Lớp không có học sinh nào');
    }

    // Kiểm tra danh sách điểm gửi lên
    const studentCodesInRequest = scores.map(score => score.student_code);
    const scoreData = {};
    for (const score of scores) {
        const studentCode = score.student_code;
        const scoreValue = score.score_value;

        if (!studentCode || !studentCodes.includes(studentCode)) {
            throw new Error(`Học sinh ${studentCode} không thuộc lớp này`);
        }

        if (typeof scoreValue !== 'number' || scoreValue < 0 || scoreValue > 10) {
            throw new Error(`Điểm của học sinh ${studentCode} không hợp lệ. Điểm phải từ 0 đến 10.`);
        }

        scoreData[studentCode] = {
            student_code: studentCode,
            exam_code: examCode,
            score_value: scoreValue,
        };
    }

    // Lấy tất cả điểm hiện có của bài kiểm tra này cho học sinh trong lớp
    const existingScores = await Score.find({
        exam_code: examCode,
        student_code: { $in: studentCodes },
    });
    const existingScoresMap = existingScores.reduce((map, score) => {
        map[score.student_code] = score;
        return map;
    }, {});

    // Cập nhật hoặc thêm mới điểm
    const operations = [];
    for (const studentCode of studentCodesInRequest) {
        const score = scoreData[studentCode];
        const existingScore = existingScoresMap[studentCode];

        if (existingScore) {
            // Nếu điểm đã tồn tại, cập nhật điểm
            operations.push({
                updateOne: {
                    filter: { _id: existingScore._id },
                    update: {
                        $set: {
                            score_value: score.score_value,
                            updated_at: new Date(),
                        },
                    },
                },
            });
        } else {
            // Nếu điểm chưa tồn tại, thêm mới
            operations.push({
                insertOne: {
                    document: {
                        student_code: score.student_code,
                        exam_code: score.exam_code,
                        score_value: score.score_value,
                        created_at: new Date(),
                        updated_at: new Date(),
                    },
                },
            });
        }
    }

    // Thực hiện các thao tác bulkWrite
    if (operations.length > 0) {
        await Score.bulkWrite(operations);
    }

    // Gọi updateAverages thủ công cho từng học sinh
    for (const studentCode of studentCodesInRequest) {
        await updateAverages(studentCode, examCode);
    }

    // Lấy lại tất cả điểm (bao gồm cả điểm không được sửa) để trả về
    const updatedScores = await Score.find({
        exam_code: examCode,
        student_code: { $in: studentCodes },
    });

    return updatedScores.map(score => ({
        student_code: score.student_code,
        exam_code: score.exam_code,
        score_value: score.score_value,
    }));
}

/**
 * Lấy danh sách điểm của một lớp mà giáo viên dạy.
 * @param {Object} teacher - Giáo viên hiện tại
 * @param {string} classroomCode - Mã lớp học
 * @param {string} [examCode] - Mã bài kiểm tra (tùy chọn)
 * @param {string} [subjectCode] - Mã môn học (tùy chọn)
 * @returns {Array} - Danh sách điểm của học sinh
 */
async function getClassroomScores(teacher, classroomCode, examCode = null, subjectCode = null) {
    // Kiểm tra lớp học có tồn tại không
    const classroom = await Classroom.findOne({ classroom_code: classroomCode });
    if (!classroom) {
        throw new Error('Không tìm thấy lớp học');
    }

    // Kiểm tra xem giáo viên có dạy lớp này không
    const teacherSubjects = await ClassroomTeacher.find({
        classroom_code: classroomCode,
        teacher_code: teacher.teacher_code,
    }).select('subject_code');

    if (!teacherSubjects.length) {
        throw new Error('Bạn không dạy lớp này');
    }

    // Nếu có subjectCode, kiểm tra xem giáo viên có dạy môn đó trong lớp này không
    let subjectsToQuery = teacherSubjects.map(ts => ts.subject_code);
    if (subjectCode) {
        if (!subjectsToQuery.includes(subjectCode)) {
            throw new Error('Bạn không dạy môn này trong lớp này');
        }
        subjectsToQuery = [subjectCode];
    }

    // Kiểm tra examCode nếu có
    if (examCode) {
        const exam = await Exam.findOne({ exam_code: examCode });
        if (!exam) {
            throw new Error('Không tìm thấy bài kiểm tra');
        }
        // Kiểm tra xem bài kiểm tra có thuộc môn mà giáo viên dạy không
        if (!subjectsToQuery.includes(exam.subject_code)) {
            throw new Error('Bài kiểm tra không thuộc môn bạn dạy trong lớp này');
        }
    }

    // Lấy danh sách học sinh trong lớp
    const students = await Student.find({ classroom_code: classroomCode });
    const studentCodes = students.map(student => student.student_code);
    if (!studentCodes.length) {
        throw new Error('Lớp không có học sinh nào');
    }

    // Lấy danh sách điểm
    let query = Score.find({ student_code: { $in: studentCodes } })
        .populate({
            path: 'exam',
            match: { subject_code: { $in: subjectsToQuery } },
        })
        .lean();

    if (examCode) {
        query = query.where('exam_code').equals(examCode);
    }

    const scores = await query.exec();

    // Lọc bỏ các score không có exam (do populate match không khớp)
    const filteredScores = scores
        .filter(score => score.exam) // Chỉ giữ lại score có exam khớp với subject_code
        .map(score => ({
            student_code: score.student_code,
            exam_code: score.exam_code,
            score_value: score.score_value,
        }));

    return filteredScores;
}

/**
 * Lấy danh sách tất cả giáo viên
 * @returns {Array} - Danh sách giáo viên
 */
async function getAllTeachers() {
    const teachers = await Teacher.find().select('-password');
    return teachers.map(teacher => teacher.toObject());
}

/**
 * Lấy danh sách học sinh theo classroom_code
 * @param {string} classroomCode - Mã lớp học
 * @returns {Array} - Danh sách học sinh
 */
async function getStudentsByClassroom(classroomCode) {
    const classroom = await Classroom.findOne({ classroom_code: classroomCode });
    if (!classroom) {
        throw new Error('Không tìm thấy lớp học');
    }

    const students = await Student.find({ classroom_code: classroomCode }).select('-password');
    return students.map(student => student.toObject());
}

/**
 * Gán giáo viên làm chủ nhiệm của một lớp
 * @param {Object} teacher - Giáo viên hiện tại
 * @param {string} classroomCode - Mã lớp học
 * @returns {Object} - Thông tin lớp học
 */
async function assignHomeroomClassroom(teacher, classroomCode) {
    const classroom = await Classroom.findOne({ classroom_code: classroomCode });
    if (!classroom) {
        throw new Error('Không tìm thấy lớp học');
    }

    classroom.homeroom_teacher_code = teacher.teacher_code;
    await classroom.save();
    return classroom.toObject();
}

/**
 * Cập nhật thông tin giáo viên
 * @param {Object} req - Request từ client
 * @param {Object} teacher - Giáo viên hiện tại
 * @returns {Object} - Thông tin giáo viên sau khi cập nhật
 */
async function updateTeacher(req, teacher) {
    // Sử dụng formidable@3 để parse dữ liệu multipart/form-data
    const form = formidable({
        uploadDir: './public', // Sử dụng thư mục public để lưu file tạm
        keepExtensions: true,
        multiples: false, // Không cho phép upload nhiều file cùng lúc
    });

    const { fields, files } = await new Promise((resolve, reject) => {
        form.parse(req, (err, fields, files) => {
            if (err) {
                console.error('Error parsing form:', err);
                reject(err);
                return;
            }
            resolve({ fields, files });
        });
    });

    // Log để debug
    console.log('Fields received:', fields);
    console.log('Files received:', files);

    // Kiểm tra xem có dữ liệu gửi lên không
    if (!Object.keys(fields).length && !Object.keys(files).length) {
        throw new Error('Không có dữ liệu nào được gửi lên để cập nhật. Vui lòng cung cấp ít nhất một trường: name, email, hoặc avatar.');
    }

    // Validate dữ liệu
    const updateData = {};
    if (fields.name) {
        // Xử lý trường hợp fields.name là mảng
        const nameValue = Array.isArray(fields.name) ? fields.name[0] : fields.name;
        if (typeof nameValue !== 'string' || nameValue.length > 255) {
            throw new Error('Tên không hợp lệ. Tên phải là chuỗi và tối đa 255 ký tự.');
        }
        updateData.name = nameValue;
    }
    if (fields.email) {
        // Xử lý trường hợp fields.email là mảng
        const emailValue = Array.isArray(fields.email) ? fields.email[0] : fields.email;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(emailValue)) {
            throw new Error('Email không hợp lệ.');
        }
        const existingTeacher = await Teacher.findOne({ email: emailValue });
        if (existingTeacher && existingTeacher.teacher_code !== teacher.teacher_code) {
            throw new Error('Email đã được sử dụng bởi giáo viên khác.');
        }
        updateData.email = emailValue;
    }

    // Xử lý upload avatar nếu có
    if (files.avatar) {
        // Xử lý trường hợp files.avatar là mảng
        const file = Array.isArray(files.avatar) ? files.avatar[0] : files.avatar;
        console.log('Processing avatar file:', file);

        const allowedMimes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif'];
        const maxSize = 2 * 1024 * 1024; // 2MB

        if (!allowedMimes.includes(file.mimetype)) {
            await fs.unlink(file.filepath);
            throw new Error('Định dạng ảnh không hợp lệ. Chỉ chấp nhận jpeg, png, jpg, gif.');
        }
        if (file.size > maxSize) {
            await fs.unlink(file.filepath);
            throw new Error('Kích thước ảnh vượt quá 2MB.');
        }

        // Đọc nội dung file
        const fileContent = await fs.readFile(file.filepath);

        // Gửi ảnh lên CDN
        const response = await axios.post(
            'http://localhost:4000/cdn/upload-images?type=js',
            fileContent,
            {
                headers: {
                    'Content-Type': file.mimetype,
                },
            }
        );

        console.log('CDN response:', response.data);

        if (response.status !== 200 || !response.data.url) {
            await fs.unlink(file.filepath);
            throw new Error('Lỗi khi upload ảnh lên CDN: ' + (response.data.message || 'Không xác định'));
        }

        updateData.avatarUrl = 'http://localhost:4000' + response.data.url;
        console.log('Avatar uploaded to CDN for teacher:', updateData.avatarUrl);

        // Xóa file tạm sau khi upload
        await fs.unlink(file.filepath);
    } else {
        console.log('No avatar file received.');
    }

    // Kiểm tra xem có thay đổi nào để cập nhật không
    if (Object.keys(updateData).length === 0) {
        console.log('No changes detected for teacher:', teacher.teacher_code);
        return teacher;
    }

    // Cập nhật thông tin giáo viên
    const updatedTeacher = await Teacher.findOneAndUpdate(
        { teacher_code: teacher.teacher_code },
        { $set: updateData },
        { new: true }
    ).select('-password');

    if (!updatedTeacher) {
        throw new Error('Không thể lưu dữ liệu vào database');
    }

    console.log('Teacher data updated successfully:', teacher.teacher_code);
    return updatedTeacher.toObject();
}

module.exports = {
    assignTeachingClassroom,
    getRemainingSubjects,
    getTeachersInClassroom,
    enterScores,
    getClassroomScores,
    getAllTeachers,
    getStudentsByClassroom,
    assignHomeroomClassroom,
    updateTeacher,
};