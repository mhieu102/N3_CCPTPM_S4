const { OAuth2Client } = require('google-auth-library');
const { generateToken, saveAccessToken } = require('../utils/authUtils');
const Student = require('../models/student');
const Teacher = require('../models/teacher');
const dotenv = require('dotenv');

dotenv.config();

const client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  'http://localhost:5173'
);

const redirectToGoogle = (req, res) => {
  console.log('Received GET request to /api/auth/google');
  const url = client.generateAuthUrl({
    access_type: 'offline',
    scope: ['profile', 'email'],
  });
  res.redirect(url);
};

const handleGoogleCallback = async (req, res) => {
  console.log('Received GET request to /api/auth/google/callback?code=', req.query.code);
  try {
    const { code } = req.query;
    const { tokens } = await client.getToken(code);
    client.setCredentials(tokens);

    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const googleId = payload['sub'];
    const email = payload['email'];
    const name = payload['name'];

    const student = await Student.findOne({ googleId });
    if (student) {
      const token = generateToken(student.student_code, 'student');
      await saveAccessToken(token, student.student_code, 'student'); // Lưu token
      return res.json({ token, user: student });
    }

    const teacher = await Teacher.findOne({ googleId });
    if (teacher) {
      const token = generateToken(teacher.teacher_code, 'teacher');
      await saveAccessToken(token, teacher.teacher_code, 'teacher'); // Lưu token
      return res.json({ token, user: teacher });
    }

    res.json({
      message: 'Chọn vai trò',
      user_data: { google_id: googleId, email, name },
    });
  } catch (error) {
    console.error('Google Login Error:', error);
    res.status(500).json({ error: error.message });
  }
};

const selectRole = async (req, res) => {
  console.log('Received POST request to /api/select-role');
  const { role, user_data } = req.body;
  const { google_id, email, name } = user_data;

  try {
    if (role === 'student') {
      const lastStudent = await Student.findOne().sort({ createdAt: -1 });
      const studentCode = lastStudent ? `S${parseInt(lastStudent.student_code.slice(1)) + 1}` : 'S1';
      const student = new Student({
        email,
        name,
        googleId: google_id,
        role_code: 'R2',
        student_code: studentCode,
        password: 'google-auth-' + Math.random().toString(36).slice(2),
      });

      await student.save();
      const token = generateToken(student.student_code, 'student');
      await saveAccessToken(token, student.student_code, 'student'); // Lưu token
      res.json({ token, user: student });
    } else if (role === 'teacher') {
      const lastTeacher = await Teacher.findOne().sort({ createdAt: -1 });
      const teacherCode = lastTeacher ? `T${parseInt(lastTeacher.teacher_code.slice(1)) + 1}` : 'T1';
      const teacher = new Teacher({
        email,
        name,
        googleId: google_id,
        role_code: 'R1',
        teacher_code: teacherCode,
        password: 'google-auth-' + Math.random().toString(36).slice(2),
      });

      await teacher.save();
      const token = generateToken(teacher.teacher_code, 'teacher');
      await saveAccessToken(token, teacher.teacher_code, 'teacher'); // Lưu token
      res.json({ token, user: teacher });
    } else {
      res.status(400).json({ error: 'Vai trò không hợp lệ' });
    }
  } catch (error) {
    console.error('Role Selection Error:', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = { redirectToGoogle, handleGoogleCallback, selectRole };