const mongoose = require('mongoose');
const { success, fail } = require('../utils/responseFormatter');
const authController = require('../controllers/authController');

// Mock toàn bộ module passwordService
jest.mock('../services/passwordService', () => ({
    forgotPasswordService: jest.fn(),
    resetPasswordService: jest.fn(),
    validateTokenService: jest.fn(),
}));

const PasswordService = require('../services/passwordService');

// Mock response object
const mockResponse = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

describe('AuthController - resetPassword', () => {
    let req, res;

    beforeEach(() => {
        req = {
            query: {},
            headers: {},
            body: {},
        };
        res = mockResponse();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    // Test Case 1: email không tồn tại
    it('should fail if email is not provided', async () => {
        req.query.email = null;
        req.headers.authorization = 'Bearer token123';
        req.body = {
            password: 'newpassword123',
            password_confirmation: 'newpassword123',
        };

        await authController.resetPassword(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            status: 'fail',
            message: 'Email và token là bắt buộc',
            data: null,
        });
    });

    // Test Case 2: token không tồn tại
    it('should fail if token is not provided', async () => {
        req.query.email = 'user@example.com';
        req.headers.authorization = null;
        req.body = {
            password: 'newpassword123',
            password_confirmation: 'newpassword123',
        };

        await authController.resetPassword(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            status: 'fail',
            message: 'Email và token là bắt buộc',
            data: null,
        });
    });

    // Test Case 3: password không tồn tại
    it('should fail if password is not provided', async () => {
        req.query.email = 'user@example.com';
        req.headers.authorization = 'Bearer token123';
        req.body = {
            password: null,
            password_confirmation: 'newpassword123',
        };

        await authController.resetPassword(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            status: 'fail',
            message: 'Mật khẩu và xác nhận mật khẩu là bắt buộc',
            data: null,
        });
    });

    // Test Case 4: password_confirmation không tồn tại
    it('should fail if password_confirmation is not provided', async () => {
        req.query.email = 'user@example.com';
        req.headers.authorization = 'Bearer token123';
        req.body = {
            password: 'newpassword123',
            password_confirmation: null,
        };

        await authController.resetPassword(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            status: 'fail',
            message: 'Mật khẩu và xác nhận mật khẩu là bắt buộc',
            data: null,
        });
    });

    // Test Case 5: Tất cả hợp lệ, resetPasswordService thành công
    it('should succeed if all inputs are valid and resetPasswordService succeeds', async () => {
        req.query.email = 'user@example.com';
        req.headers.authorization = 'Bearer token123';
        req.body = {
            password: 'newpassword123',
            password_confirmation: 'newpassword123',
        };

        // Mock resetPasswordService
        PasswordService.resetPasswordService.mockResolvedValue({
            message: 'Đặt lại mật khẩu thành công',
        });

        await authController.resetPassword(req, res);

        expect(PasswordService.resetPasswordService).toHaveBeenCalledWith(
            'user@example.com',
            'token123',
            'newpassword123',
            'newpassword123'
        );
        expect(res.json).toHaveBeenCalledWith({
            status: 'success',
            message: 'Đặt lại mật khẩu thành công',
            data: { message: 'Đặt lại mật khẩu thành công' },
        });
    });

    // Test Case 6: Tất cả hợp lệ, resetPasswordService thất bại
    it('should fail if resetPasswordService throws an error', async () => {
        req.query.email = 'user@example.com';
        req.headers.authorization = 'Bearer token123';
        req.body = {
            password: 'newpassword123',
            password_confirmation: 'newpassword123',
        };

        // Mock resetPasswordService throw lỗi
        PasswordService.resetPasswordService.mockRejectedValue(
            new Error('Token không hợp lệ')
        );

        await authController.resetPassword(req, res);

        expect(PasswordService.resetPasswordService).toHaveBeenCalledWith(
            'user@example.com',
            'token123',
            'newpassword123',
            'newpassword123'
        );
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            status: 'fail',
            message: 'Yêu cầu không hợp lệ: Token không hợp lệ',
            data: null,
        });
    });

    // Test Case 7: Vào vòng lặp tại nút 5.2 (1 lần)
    it('should succeed with loop at node 5.2 (1 iteration)', async () => {
        req.query.email = 'user@example.com';
        req.headers.authorization = 'Bearer token123';
        req.body = {
            password: 'newpassword123',
            password_confirmation: 'newpassword123',
        };

        // Mock resetPasswordService với giả lập vòng lặp
        PasswordService.resetPasswordService.mockImplementation(() => {
            return new Promise((resolve) => {
                setTimeout(() => {
                    resolve({ message: 'Đặt lại mật khẩu thành công' });
                }, 10);
            });
        });

        await authController.resetPassword(req, res);

        expect(res.json).toHaveBeenCalledWith({
            status: 'success',
            message: 'Đặt lại mật khẩu thành công',
            data: { message: 'Đặt lại mật khẩu thành công' },
        });
    });

    // Test Case 8: Thoát vòng lặp tại nút 5.2 ngay lập tức
    it('should succeed without loop at node 5.2', async () => {
        req.query.email = 'user@example.com';
        req.headers.authorization = 'Bearer token123';
        req.body = {
            password: 'newpassword123',
            password_confirmation: 'newpassword123',
        };

        // Mock resetPasswordService
        PasswordService.resetPasswordService.mockResolvedValue({
            message: 'Đặt lại mật khẩu thành công',
        });

        await authController.resetPassword(req, res);

        expect(res.json).toHaveBeenCalledWith({
            status: 'success',
            message: 'Đặt lại mật khẩu thành công',
            data: { message: 'Đặt lại mật khẩu thành công' },
        });
    });

    // Test Case 9: Vào vòng lặp tại nút 7.2 (1 lần)
    it('should succeed with loop at node 7.2 (1 iteration)', async () => {
        req.query.email = 'user@example.com';
        req.headers.authorization = 'Bearer token123';
        req.body = {
            password: 'newpassword123',
            password_confirmation: 'newpassword123',
        };

        // Mock resetPasswordService với giả lập vòng lặp
        let iterationCount = 0;
        PasswordService.resetPasswordService.mockImplementation(() => {
            return new Promise((resolve) => {
                if (iterationCount === 0) {
                    iterationCount++;
                    setTimeout(() => {
                        resolve({ message: 'Đặt lại mật khẩu thành công' });
                    }, 10);
                } else {
                    resolve({ message: 'Đặt lại mật khẩu thành công' });
                }
            });
        });

        await authController.resetPassword(req, res);

        expect(res.json).toHaveBeenCalledWith({
            status: 'success',
            message: 'Đặt lại mật khẩu thành công',
            data: { message: 'Đặt lại mật khẩu thành công' },
        });
    });

    // Test Case 10: Thoát vòng lặp tại nút 7.2 ngay lập tức
    it('should succeed without loop at node 7.2', async () => {
        req.query.email = 'user@example.com';
        req.headers.authorization = 'Bearer token123';
        req.body = {
            password: 'newpassword123',
            password_confirmation: 'newpassword123',
        };

        // Mock resetPasswordService
        PasswordService.resetPasswordService.mockResolvedValue({
            message: 'Đặt lại mật khẩu thành công',
        });

        await authController.resetPassword(req, res);

        expect(res.json).toHaveBeenCalledWith({
            status: 'success',
            message: 'Đặt lại mật khẩu thành công',
            data: { message: 'Đặt lại mật khẩu thành công' },
        });
    });

    // Test Case 11: Vào vòng lặp tại nút 11 (1 lần)
    it('should succeed with loop at node 11 (1 iteration)', async () => {
        req.query.email = 'user@example.com';
        req.headers.authorization = 'Bearer token123';
        req.body = {
            password: 'newpassword123',
            password_confirmation: 'newpassword123',
        };

        // Mock resetPasswordService với giả lập vòng lặp
        PasswordService.resetPasswordService.mockImplementation(() => {
            let iterationCount = 0;
            return new Promise((resolve) => {
                const interval = setInterval(() => {
                    iterationCount++;
                    if (iterationCount >= 1) {
                        clearInterval(interval);
                        resolve({ message: 'Đặt lại mật khẩu thành công' });
                    }
                }, 10);
            });
        });

        await authController.resetPassword(req, res);

        expect(res.json).toHaveBeenCalledWith({
            status: 'success',
            message: 'Đặt lại mật khẩu thành công',
            data: { message: 'Đặt lại mật khẩu thành công' },
        });
    });
});