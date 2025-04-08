const { success, fail } = require('../utils/responseFormatter');
const Role = require('../models/role');

/**
 * Lấy danh sách tất cả các role
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const getRoles = async (req, res) => {
    try {
        const roles = await Role.find({}, 'role_code role_name');
        return success(res, roles, 'Lấy danh sách role thành công');
    } catch (error) {
        return fail(res, 'Không thể lấy danh sách role: ' + error.message, null, 500);
    }
};

module.exports = { getRoles };