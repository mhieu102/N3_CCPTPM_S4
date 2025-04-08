const jwt = require('jsonwebtoken');
const PasswordResetToken = require('../models/passwordResetToken');
const Teacher = require('../models/teacher');
const Student = require('../models/student');
const sgMail = require('@sendgrid/mail');
require('dotenv').config();

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendEmail = async (to, subject, html) => {
    const msg = {
        to,
        from: 'vubatien20031410@gmail.com',
        subject,
        html
    };

    try {
        await sgMail.send(msg);
        console.log('Email sent successfully');
    } catch (error) {
        console.error('Error sending email:', error.response?.body || error.message);
        throw new Error('Failed to send email');
    }
};

const forgotPasswordService = async (email) => {
    const teacher = await Teacher.findOne({ email });
    const student = await Student.findOne({ email });

    if (!teacher && !student) {
        throw new Error('Email không tồn tại');
    }

    const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '1h' });

    await PasswordResetToken.create({ email, token });

    const resetLink = `${process.env.BASE_URL}/reset-password?email=${encodeURIComponent(email)}`;

    // Đọc file HTML template
    const fs = require('fs').promises;
    const path = require('path');
    const templatePath = path.join(__dirname, '../views/emails/resetPassword.html');
    let html = await fs.readFile(templatePath, 'utf-8');

    // Thay thế placeholder
    html = html.replace('{{resetLink}}', resetLink);

    // Gửi email
    const msg = {
        to: email,
        from: process.env.FROM_EMAIL,
        subject: 'Đặt lại mật khẩu ScoreManagementJS',
        html: html,
    };

    await sgMail.send(msg);

    return { message: 'Link đặt lại mật khẩu đã được gửi đến email của bạn' };
};

const resetPasswordService = async (email, token, password, passwordConfirmation) => {
    const resetToken = await PasswordResetToken.findOne({ email, token });
    if (!resetToken) {
        throw new Error('Token không hợp lệ hoặc đã hết hạn');
    }

    try {
        await new Promise((resolve, reject) => {
            jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
                if (err) {
                    return reject(new Error('Token không hợp lệ hoặc đã hết hạn'));
                }
                resolve(decoded);
            });
        });
    } catch (err) {
        throw new Error('Token không hợp lệ hoặc đã hết hạn');
    }

    if (password !== passwordConfirmation) {
        throw new Error('Mật khẩu xác nhận không khớp');
    }

    let user;
    user = await Teacher.findOne({ email });
    if (!user) {
        user = await Student.findOne({ email });
    }

    if (!user) {
        throw new Error('Người dùng không tồn tại');
    }

    user.password = password;
    //console.log('Before saving user:', user); // Debug
    await user.save();
    //console.log('After saving user:', user); // Debug

    await PasswordResetToken.deleteOne({ email, token });

    return { message: 'Đặt lại mật khẩu thành công' };
};

const validateTokenService = async (email) => {
    const resetToken = await PasswordResetToken.findOne({ email }).sort({ createdAt: -1 });
    if (!resetToken) {
        throw new Error('Không tìm thấy token cho email này hoặc token đã hết hạn');
    }

    return { token: resetToken.token };
};

module.exports = { forgotPasswordService, resetPasswordService, validateTokenService };