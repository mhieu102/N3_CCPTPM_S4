const multer = require('multer');

// Cấu hình multer để lưu file vào bộ nhớ (không lưu vào disk)
const storage = multer.memoryStorage();

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
        if (!allowedTypes.includes(file.mimetype)) {
            return cb(new Error('Invalid file format. Only xlsx and xls are allowed.'));
        }
        cb(null, true);
    },
    limits: {
        fileSize: 5 * 1024 * 1024, // Giới hạn file 5MB
    },
});

module.exports = upload;