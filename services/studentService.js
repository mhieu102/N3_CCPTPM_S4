const Score = require('../models/score');
const Student = require('../models/student');
const { formidable } = require('formidable');
const fs = require('fs').promises;
const axios = require('axios');

/**
 * Lấy danh sách điểm của học sinh với bộ lọc tùy chọn.
 * @param {string} studentCode - Mã học sinh
 * @param {string|null} subjectCode - Mã môn học (tùy chọn)
 * @param {string|null} termCode - Mã kỳ học (tùy chọn)
 * @returns {Array} - Danh sách điểm
 */
async function getStudentScores(studentCode, subjectCode = null, termCode = null) {
    // Tạo pipeline cho aggregation
    const pipeline = [
        // Lọc điểm của học sinh
        {
            $match: {
                student_code: studentCode,
            },
        },
        // Lookup để lấy thông tin từ collection exams
        {
            $lookup: {
                from: 'exams',
                localField: 'exam_code',
                foreignField: 'exam_code',
                as: 'exam',
            },
        },
        // Unwind để chuyển mảng exam thành object
        {
            $unwind: '$exam',
        },
        // Project để chỉ lấy các trường cần thiết
        {
            $project: {
                exam_code: 1,
                term_code: '$exam.term_code',
                subject_code: '$exam.subject_code',
                date: '$exam.date', // Thêm trường date từ collection exams
                score_value: 1,
                _id: 0, // Loại bỏ trường _id
            },
        },
    ];

    // Áp dụng bộ lọc subject_code và term_code nếu có
    const matchStage = {};
    if (subjectCode) {
        matchStage.subject_code = subjectCode;
    }
    if (termCode) {
        matchStage.term_code = termCode;
    }
    if (Object.keys(matchStage).length > 0) {
        pipeline.push({
            $match: matchStage,
        });
    }

    // Thực hiện aggregation
    const scores = await Score.aggregate(pipeline);

    return scores;
}

/**
 * Cập nhật thông tin học sinh
 * @param {Object} req - Request từ client
 * @param {Object} student - Học sinh hiện tại
 * @returns {Object} - Thông tin học sinh sau khi cập nhật
 */
async function updateStudent(req, student) {
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
        const existingStudent = await Student.findOne({ email: emailValue });
        if (existingStudent && existingStudent.student_code !== student.student_code) {
            throw new Error('Email đã được sử dụng bởi học sinh khác.');
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
        console.log('Avatar uploaded to CDN for student:', updateData.avatarUrl);

        // Xóa file tạm sau khi upload
        await fs.unlink(file.filepath);
    } else {
        console.log('No avatar file received.');
    }

    // Kiểm tra xem có thay đổi nào để cập nhật không
    if (Object.keys(updateData).length === 0) {
        console.log('No changes detected for student:', student.student_code);
        return student;
    }

    // Cập nhật thông tin học sinh
    const updatedStudent = await Student.findOneAndUpdate(
        { student_code: student.student_code },
        { $set: updateData },
        { new: true }
    ).select('-password');

    if (!updatedStudent) {
        throw new Error('Không thể lưu dữ liệu vào database');
    }

    console.log('Student data updated successfully:', student.student_code);
    return updatedStudent.toObject();
}

module.exports = {
    getStudentScores,
    updateStudent,
};