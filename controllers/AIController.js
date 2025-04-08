const { GoogleGenerativeAI } = require('@google/generative-ai');
const moment = require('moment-timezone');
const DatabaseReaderService = require('../services/DatabaseReaderService');
const { v4: uuidv4 } = require('uuid'); // Thêm uuid để tạo sessionId

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

// Lưu trữ lịch sử trò chuyện theo sessionId
const conversationHistory = new Map();

const ask = async (req, res) => {
    const { question, sessionId } = req.body;

    if (!question) {
        return res.status(400).json({
            status: 'error',
            message: 'Question is required.',
        });
    }

    // Tạo sessionId nếu không có
    const currentSessionId = sessionId || uuidv4();

    try {
        // Lấy thời gian thực
        const currentTime = moment().tz('Asia/Ho_Chi_Minh'); // Múi giờ Việt Nam
        const currentTimeString = currentTime.format('HH:mm A, dddd, Do MMMM YYYY'); // Ví dụ: 17:53 PM, Monday, 31st March 2025
        const dayOfWeek = currentTime.format('dddd'); // Lấy ngày trong tuần: Monday

        // Kiểm tra xem câu hỏi có liên quan đến database không
        const isDatabaseRelated = isDatabaseRelatedFunc(question);

        // Kiểm tra xem câu hỏi có liên quan đến thời gian không
        const isTimeRelated = isTimeRelatedFunc(question);

        // Lấy lịch sử trò chuyện của session này
        let history = conversationHistory.get(currentSessionId) || [];
        
        // Tạo prompt cho Gemini AI, bao gồm lịch sử trò chuyện
        const prompt = await buildPrompt(question, isDatabaseRelated, isTimeRelated, currentTimeString, dayOfWeek, history);

        // Gọi API Gemini
        const result = await model.generateContent(prompt);
        const answer = result.response.text();

        // Cập nhật lịch sử trò chuyện
        history.push({ question, answer });
        
        // Giới hạn lịch sử để tránh vượt quá giới hạn token (giữ 5 tin nhắn gần nhất)
        if (history.length > 5) {
            history = history.slice(-5);
        }
        
        // Lưu lại lịch sử
        conversationHistory.set(currentSessionId, history);

        res.status(200).json({
            status: 'success',
            sessionId: currentSessionId, // Trả về sessionId để client lưu trữ
            answer,
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: `Error communicating with Gemini AI: ${error.message}`,
        });
    }
};

/**
 * Kiểm tra xem câu hỏi có liên quan đến database không
 */
const isDatabaseRelatedFunc = (question) => {
    const questionLower = question.toLowerCase();
    const databaseKeywords = [
        'student', 'classroom', 'grade', 'term', 'average', 'score', 'subject',
        'teacher', 'exam', 'role', 'school year', 'database', 'term average',
        'yearly average', 'subject average', 'subject yearly average', 'students', 'teachers',
        'hệ thống quản lý điểm', 'scoremanagement', 'trong database'
    ];

    return databaseKeywords.some(keyword => questionLower.includes(keyword));
};

/**
 * Kiểm tra xem câu hỏi có liên quan đến thời gian không
 */
const isTimeRelatedFunc = (question) => {
    const questionLower = question.toLowerCase();
    const timeKeywords = [
        'hôm nay', 'ngày', 'thứ', 'giờ', 'thời gian', 'bây giờ',
        'today', 'date', 'day', 'time', 'current', 'hour', 'minute',
        'tháng', 'năm', 'week', 'month', 'year', 'tomorrow', 'yesterday'
    ];

    return timeKeywords.some(keyword => questionLower.includes(keyword));
};

/**
 * Tạo prompt dựa trên loại câu hỏi, bao gồm lịch sử trò chuyện
 */
const buildPrompt = async (question, isDatabaseRelated, isTimeRelated, currentTimeString, dayOfWeek, history) => {
    // Luôn cung cấp thông tin thời gian thực cho Gemini AI
    let basePrompt = `You are an AI assistant with access to real-time information. The current time is: ${currentTimeString}.\n`;

    // Thêm lịch sử trò chuyện vào prompt
    if (history.length > 0) {
        basePrompt += `Here is the conversation history to provide context:\n`;
        history.forEach((entry, index) => {
            basePrompt += `User ${index + 1}: ${entry.question}\nAI ${index + 1}: ${entry.answer}\n`;
        });
        basePrompt += `\nNow, answer the following question while considering the conversation history:\n`;
    }

    if (isTimeRelated) {
        // Nếu câu hỏi liên quan đến thời gian, chỉ cần cung cấp thời gian và câu hỏi
        return basePrompt + `Answer the following question about time: ${question}`;
    }

    if (isDatabaseRelated) {
        // Lấy dữ liệu từ database
        const dataSummary = await DatabaseReaderService.getDataSummary();
        const data = await DatabaseReaderService.getRelevantData(question);

        // Cung cấp ngữ cảnh về hệ thống scoremanagement và quyền truy cập database
        const databaseContext = `
You are working within the "scoremanagement" system, a school management system that stores data about students, teachers, classrooms, grades, scores, and academic performance. You have full access to the database of this system. When a question mentions "database của tôi", "trong database", "hệ thống quản lý điểm", or "scoremanagement", it refers to this database, and you can use the provided data to answer the question.

The database contains the following models:
- student: Contains student information (e.g., studentId, firstName, lastName, dateOfBirth, gender, classroomId).
- classroom: Contains classroom information (e.g., classroomId, name, gradeId, schoolYearId).
- grade: Contains grade information (e.g., gradeId, name).
- score: Contains scores for students (e.g., scoreId, studentId, subjectId, examId, termId, value).
- studentYearlyAverage: Contains yearly average scores for students (e.g., studentId, schoolYearId, average, academicPerformance).
- studentTermAverage: Contains term average scores for students (e.g., studentId, termId, average, academicPerformance).
- subject: Contains subject information (e.g., subjectId, name).
- teacher: Contains teacher information (e.g., teacherId, firstName, lastName).
- term: Contains term information (e.g., termId, name, schoolYearId).
- schoolYear: Contains school year information (e.g., schoolYearId, name).
- exam: Contains exam information (e.g., examId, name, subjectId, termId).
- role: Contains role information (e.g., roleId, name).

To answer questions about the database:
1. Analyze the relevant data provided below.
2. If the question involves finding a maximum, minimum, or specific record (e.g., highest average), sort or filter the data accordingly.
3. If the question requires linking data between models (e.g., finding a student's name from their studentId), use the relationships between models (e.g., studentId in studentYearlyAverage can be linked to student to get the student's name).
4. Provide a clear and concise answer based on the data.
`;

        return basePrompt + databaseContext + `Here is the database summary:\n${dataSummary}\n\nHere is the relevant database data:\n${JSON.stringify(data, null, 2)}\n\nQuestion: ${question}`;
    }

    // Câu hỏi không liên quan đến database hoặc thời gian, trả lời dựa trên kiến thức chung
    return basePrompt + `Answer the following question using your general knowledge: ${question}`;
};

module.exports = {
    ask,
};