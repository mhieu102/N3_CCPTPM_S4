const mongoose = require('mongoose');
const { success, fail } = require('../utils/responseFormatter');
const teacherController = require('../controllers/teacherController');
const TeacherService = require('../services/teacherService');

// Mock response object
const mockResponse = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

describe('TeacherController - enterScores', () => {
    let req, res;

    beforeEach(() => {
        req = {
            user: null, // Sẽ được cập nhật trong từng test case
            body: {},   // Sẽ được cập nhật trong từng test case
        };
        res = mockResponse();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    // Test case 1: Người dùng không phải giáo viên
    it('should fail if user is not a teacher (ensureTeacher throws error)', async () => {
        req.user = null; // Người dùng không hợp lệ
        req.body = {
            classroom_code: 'C1_G10_SY_2024-2025',
            exam_code: 'E1',
            scores: [{ student_code: 'S1', score_value: 8 }],
        };

        await teacherController.enterScores(req, res);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({
            status: 'fail',
            message: 'Không có quyền thực hiện. Chỉ giáo viên mới được phép.',
            data: null,
        });
    });

    // Test case 2: classroom_code không được cung cấp
    it('should fail if classroom_code is not provided', async () => {
        req.user = { role_code: 'R1' }; // Giáo viên hợp lệ
        req.body = {
            classroom_code: null,
            exam_code: 'E1',
            scores: [{ student_code: 'S1', score_value: 8 }],
        };

        await teacherController.enterScores(req, res);

        expect(res.status).toHaveBeenCalledWith(422);
        expect(res.json).toHaveBeenCalledWith({
            status: 'fail',
            message: 'classroom_code là bắt buộc',
            data: null,
        });
    });

    // Test case 3: exam_code không được cung cấp
    it('should fail if exam_code is not provided', async () => {
        req.user = { role_code: 'R1' };
        req.body = {
            classroom_code: 'C1_G10_SY_2024-2025',
            exam_code: null,
            scores: [{ student_code: 'S1', score_value: 8 }],
        };

        await teacherController.enterScores(req, res);

        expect(res.status).toHaveBeenCalledWith(422);
        expect(res.json).toHaveBeenCalledWith({
            status: 'fail',
            message: 'exam_code là bắt buộc',
            data: null,
        });
    });

    // Test case 4: scores là null
    it('should fail if scores is null', async () => {
        req.user = { role_code: 'R1' };
        req.body = {
            classroom_code: 'C1_G10_SY_2024-2025',
            exam_code: 'E1',
            scores: null,
        };

        await teacherController.enterScores(req, res);

        expect(res.status).toHaveBeenCalledWith(422);
        expect(res.json).toHaveBeenCalledWith({
            status: 'fail',
            message: 'Danh sách điểm (scores) là bắt buộc và không được rỗng',
            data: null,
        });
    });

    // Test case 5: scores không phải mảng
    it('should fail if scores is not an array', async () => {
        req.user = { role_code: 'R1' };
        req.body = {
            classroom_code: 'C1_G10_SY_2024-2025',
            exam_code: 'E1',
            scores: 'invalid',
        };

        await teacherController.enterScores(req, res);

        expect(res.status).toHaveBeenCalledWith(422);
        expect(res.json).toHaveBeenCalledWith({
            status: 'fail',
            message: 'Danh sách điểm (scores) là bắt buộc và không được rỗng',
            data: null,
        });
    });

    // Test case 6: scores là mảng nhưng rỗng
    it('should fail if scores is an empty array', async () => {
        req.user = { role_code: 'R1' };
        req.body = {
            classroom_code: 'C1_G10_SY_2024-2025',
            exam_code: 'E1',
            scores: [],
        };

        await teacherController.enterScores(req, res);

        expect(res.status).toHaveBeenCalledWith(422);
        expect(res.json).toHaveBeenCalledWith({
            status: 'fail',
            message: 'Danh sách điểm (scores) là bắt buộc và không được rỗng',
            data: null,
        });
    });

    // Test case 7: Tất cả điều kiện hợp lệ, TeacherService.enterScores thành công
    it('should succeed if all conditions are valid and TeacherService.enterScores succeeds', async () => {
        req.user = { role_code: 'R1' };
        req.body = {
            classroom_code: 'C1_G10_SY_2024-2025',
            exam_code: 'E1',
            scores: [{ student_code: 'S1', score_value: 8 }],
        };

        // Mock TeacherService.enterScores
        jest.spyOn(TeacherService, 'enterScores').mockResolvedValue([
            { student_code: 'S1', exam_code: 'E1', score_value: 8 },
        ]);

        await teacherController.enterScores(req, res);

        expect(TeacherService.enterScores).toHaveBeenCalledWith(
            req.user,
            'C1_G10_SY_2024-2025',
            'E1',
            [{ student_code: 'S1', score_value: 8 }],
        );
        expect(res.json).toHaveBeenCalledWith({
            status: 'success',
            message: 'Nhập điểm thành công',
            data: [{ student_code: 'S1', exam_code: 'E1', score_value: 8 }],
        });
    });

    // Test case 8: TeacherService.enterScores throw lỗi "Không có quyền"
    it('should fail with 403 if TeacherService.enterScores throws "Không có quyền"', async () => {
        req.user = { role_code: 'R1' };
        req.body = {
            classroom_code: 'C1_G10_SY_2024-2025',
            exam_code: 'E1',
            scores: [{ student_code: 'S1', score_value: 8 }],
        };

        // Mock TeacherService.enterScores throw lỗi
        jest.spyOn(TeacherService, 'enterScores').mockRejectedValue(new Error('Không có quyền'));

        await teacherController.enterScores(req, res);

        expect(TeacherService.enterScores).toHaveBeenCalledWith(
            req.user,
            'C1_G10_SY_2024-2025',
            'E1',
            [{ student_code: 'S1', score_value: 8 }],
        );
        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({
            status: 'fail',
            message: 'Không có quyền',
            data: null,
        });
    });

    // Test case 9: TeacherService.enterScores throw lỗi khác
    it('should fail with 400 if TeacherService.enterScores throws another error', async () => {
        req.user = { role_code: 'R1' };
        req.body = {
            classroom_code: 'C1_G10_SY_2024-2025',
            exam_code: 'E1',
            scores: [{ student_code: 'S1', score_value: 8 }],
        };

        // Mock TeacherService.enterScores throw lỗi
        jest.spyOn(TeacherService, 'enterScores').mockRejectedValue(new Error('Lỗi khác'));

        await teacherController.enterScores(req, res);

        expect(TeacherService.enterScores).toHaveBeenCalledWith(
            req.user,
            'C1_G10_SY_2024-2025',
            'E1',
            [{ student_code: 'S1', score_value: 8 }],
        );
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            status: 'fail',
            message: 'Lỗi khác',
            data: null,
        });
    });
});