const { body, validationResult } = require('express-validator');
const RankingService = require('../services/rankingservice');

// Validation middleware
const validateClassroomRankings = [
    body('classroom_code').notEmpty().withMessage('Classroom code is required'),
];

const validateGradeRankings = [
    body('grade_code').notEmpty().withMessage('Grade code is required'),
];

const validateTermRankings = [
    body('term_code').notEmpty().withMessage('Term code is required'),
];

// Lấy thứ hạng cả năm của học sinh trong một lớp cụ thể
const getClassroomYearlyRankings = [
    ...validateClassroomRankings,
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ status: 'error', message: errors.array()[0].msg });
            }

            const { classroom_code } = req.body;

            const result = await RankingService.getClassroomYearlyRankings(classroom_code);

            return res.status(200).json({
                status: 'success',
                data: result,
            });
        } catch (error) {
            return res.status(error.cause?.status || 500).json({
                status: 'error',
                message: error.message,
            });
        }
    },
];

// Lấy thứ hạng cả năm của học sinh trong một khối cụ thể
const getGradeYearlyRankings = [
    ...validateGradeRankings,
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ status: 'error', message: errors.array()[0].msg });
            }

            const { grade_code } = req.body;

            const result = await RankingService.getGradeYearlyRankings(grade_code);

            return res.status(200).json({
                status: 'success',
                data: result,
            });
        } catch (error) {
            return res.status(error.cause?.status || 500).json({
                status: 'error',
                message: error.message,
            });
        }
    },
];

// Lấy thứ hạng học kỳ của học sinh trong một lớp cụ thể
const getClassroomTermRankings = [
    ...validateClassroomRankings,
    ...validateTermRankings,
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ status: 'error', message: errors.array()[0].msg });
            }

            const { classroom_code, term_code } = req.body;

            const result = await RankingService.getClassroomTermRankings(classroom_code, term_code);

            return res.status(200).json({
                status: 'success',
                data: result,
            });
        } catch (error) {
            return res.status(error.cause?.status || 500).json({
                status: 'error',
                message: error.message,
            });
        }
    },
];

// Lấy thứ hạng học kỳ của học sinh trong một khối cụ thể
const getGradeTermRankings = [
    ...validateGradeRankings,
    ...validateTermRankings,
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ status: 'error', message: errors.array()[0].msg });
            }

            const { grade_code, term_code } = req.body;

            const result = await RankingService.getGradeTermRankings(grade_code, term_code);

            return res.status(200).json({
                status: 'success',
                data: result,
            });
        } catch (error) {
            return res.status(error.cause?.status || 500).json({
                status: 'error',
                message: error.message,
            });
        }
    },
];

module.exports = {
    getClassroomYearlyRankings,
    getGradeYearlyRankings,
    getClassroomTermRankings,
    getGradeTermRankings,
};