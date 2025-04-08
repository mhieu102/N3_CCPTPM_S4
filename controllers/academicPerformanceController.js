const AcademicPerformanceService = require('../services/academicperformanceservice');

/**
 * Lấy danh sách học sinh theo học lực trong một lớp (theo kỳ).
 */
const getClassroomTermPerformance = async (req, res) => {
    try {
        const { classroom_code, term_code, academic_performance } = req.body;

        // Validate request
        if (!classroom_code || !term_code || !academic_performance) {
            return res.status(400).json({
                status: 'error',
                message: 'Classroom code, term code, and academic performance are required.',
            });
        }

        if (!['Giỏi', 'Khá', 'Trung bình', 'Yếu'].includes(academic_performance)) {
            return res.status(400).json({
                status: 'error',
                message: 'Academic performance must be one of: Giỏi, Khá, Trung bình, Yếu.',
            });
        }

        const result = await AcademicPerformanceService.getClassroomTermPerformance(classroom_code, term_code, academic_performance);

        return res.status(200).json({
            status: 'success',
            data: result,
        });
    } catch (error) {
        console.log(`Error in getClassroomTermPerformance: ${error.message}`);
        return res.status(error.cause?.status || 500).json({
            status: 'error',
            message: error.message,
        });
    }
};

/**
 * Lấy danh sách học sinh theo học lực trong một lớp (theo năm).
 */
const getClassroomYearlyPerformance = async (req, res) => {
    try {
        const { classroom_code, academic_performance } = req.body;

        // Validate request
        if (!classroom_code || !academic_performance) {
            return res.status(400).json({
                status: 'error',
                message: 'Classroom code and academic performance are required.',
            });
        }

        if (!['Giỏi', 'Khá', 'Trung bình', 'Yếu'].includes(academic_performance)) {
            return res.status(400).json({
                status: 'error',
                message: 'Academic performance must be one of: Giỏi, Khá, Trung bình, Yếu.',
            });
        }

        const result = await AcademicPerformanceService.getClassroomYearlyPerformance(classroom_code, academic_performance);

        return res.status(200).json({
            status: 'success',
            data: result,
        });
    } catch (error) {
        console.log(`Error in getClassroomYearlyPerformance: ${error.message}`);
        return res.status(error.cause?.status || 500).json({
            status: 'error',
            message: error.message,
        });
    }
};

/**
 * Lấy danh sách học sinh theo học lực trong một khối (theo kỳ).
 */
const getGradeTermPerformance = async (req, res) => {
    try {
        const { grade_code, term_code, academic_performance } = req.body;

        // Validate request
        if (!grade_code || !term_code || !academic_performance) {
            return res.status(400).json({
                status: 'error',
                message: 'Grade code, term code, and academic performance are required.',
            });
        }

        if (!['Giỏi', 'Khá', 'Trung bình', 'Yếu'].includes(academic_performance)) {
            return res.status(400).json({
                status: 'error',
                message: 'Academic performance must be one of: Giỏi, Khá, Trung bình, Yếu.',
            });
        }

        const result = await AcademicPerformanceService.getGradeTermPerformance(grade_code, term_code, academic_performance);

        return res.status(200).json({
            status: 'success',
            data: result,
        });
    } catch (error) {
        console.log(`Error in getGradeTermPerformance: ${error.message}`);
        return res.status(error.cause?.status || 500).json({
            status: 'error',
            message: error.message,
        });
    }
};

/**
 * Lấy danh sách học sinh theo học lực trong một khối (theo năm).
 */
const getGradeYearlyPerformance = async (req, res) => {
    try {
        const { grade_code, academic_performance } = req.body;

        // Validate request
        if (!grade_code || !academic_performance) {
            return res.status(400).json({
                status: 'error',
                message: 'Grade code and academic performance are required.',
            });
        }

        if (!['Giỏi', 'Khá', 'Trung bình', 'Yếu'].includes(academic_performance)) {
            return res.status(400).json({
                status: 'error',
                message: 'Academic performance must be one of: Giỏi, Khá, Trung bình, Yếu.',
            });
        }

        const result = await AcademicPerformanceService.getGradeYearlyPerformance(grade_code, academic_performance);

        return res.status(200).json({
            status: 'success',
            data: result,
        });
    } catch (error) {
        console.log(`Error in getGradeYearlyPerformance: ${error.message}`);
        return res.status(error.cause?.status || 500).json({
            status: 'error',
            message: error.message,
        });
    }
};

module.exports = {
    getClassroomTermPerformance,
    getClassroomYearlyPerformance,
    getGradeTermPerformance,
    getGradeYearlyPerformance,
};