/**
 * Định dạng response thành công.
 * @param {Object} res - Response object
 * @param {any} data - Dữ liệu trả về
 * @param {string} message - Thông điệp mô tả
 * @param {number} statusCode - Mã trạng thái HTTP
 */
const success = (res, data = null, message = 'Thành công', statusCode = 200) => {
    return res.status(statusCode).json({
        status: 'success',
        message,
        data,
    });
};

/**
 * Định dạng response thất bại.
 * @param {Object} res - Response object
 * @param {string} message - Thông điệp lỗi
 * @param {any} data - Dữ liệu trả về (nếu có)
 * @param {number} statusCode - Mã trạng thái HTTP
 */
const fail = (res, message = 'Thất bại', data = null, statusCode = 400) => {
    return res.status(statusCode).json({
        status: 'fail',
        message,
        data,
    });
};

module.exports = { success, fail };