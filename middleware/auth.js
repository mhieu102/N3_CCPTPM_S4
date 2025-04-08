const jwt = require('jsonwebtoken');
const Teacher = require('../models/teacher');
const Student = require('../models/student');
const AccessToken = require('../models/accessToken');

const auth = async (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }

    try {
        const tokenRecord = await AccessToken.findOne({ token });
        if (!tokenRecord || tokenRecord.revoked || tokenRecord.expires_at < new Date()) {
            return res.status(401).json({ message: 'Token is invalid or expired' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        let user;
        if (decoded.type === 'teacher') {
            user = await Teacher.findByCode(decoded.id);
        } else if (decoded.type === 'student') {
            user = await Student.findByCode(decoded.id);
        }

        if (!user) {
            throw new Error();
        }

        req.user = user;
        req.token = token;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Invalid token' });
    }
};

module.exports = auth;