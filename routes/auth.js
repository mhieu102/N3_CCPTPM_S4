const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { getAllTeachers, getStudentsByClassroom, assignHomeroomClassroom, assignTeachingClassroom, getTeachersInClassroom, enterScores, updateTeacher, getClassroomScores } = require('../controllers/teacherController');
const RoleController = require('../controllers/roleController');
const { getSchoolYears, createSchoolYear, getSchoolYearByCode, updateSchoolYear, deleteSchoolYear } = require('../controllers/schoolYearController');
const ClassroomController = require('../controllers/classroomController');
const { getExams, createExam, getExamByCode, updateExam, deleteExam } = require('../controllers/examController');
const { getGrades, createGrade, getGradeByCode, updateGrade, deleteGrade } = require('../controllers/gradeController');
const { getSubjects, createSubject, getSubjectByCode, updateSubject, deleteSubject } = require('../controllers/subjectController');
const { getTerms, createTerm, getTermByCode, updateTerm, deleteTerm } = require('../controllers/termController');
const { getScores, updateStudent } = require('../controllers/studentController');
const {
    getClassroomYearlyRankings,
    getGradeYearlyRankings,
    getClassroomTermRankings,
    getGradeTermRankings,
} = require('../controllers/rankingController');
const academicPerformanceController = require('../controllers/academicPerformanceController');
const auth = require('../middleware/auth');
const { redirectToGoogle, handleGoogleCallback, selectRole } = require('../controllers/googleController');
const {
    exportScores,
    exportStudentScores,
    exportStudentTermAverages,
    exportStudentYearlyAverages,
} = require('../controllers/exportController');
const { importScores } = require('../controllers/importController');
const upload = require('../middleware/multerConfig');
const AIController = require('../controllers/AIController');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/password/forgot', authController.forgotPassword);
router.post('/password/reset', authController.resetPassword);
router.get('/password/validate-token', authController.validateToken);

router.get('/status', (req, res) => { res.json({ status: 'ok', backend: 'js' }); });

router.get('/auth/google', redirectToGoogle);
router.get('/auth/google/callback', handleGoogleCallback);
router.post('/select-role', express.json(), selectRole);

router.get('/roles', RoleController.getRoles);
router.get('/school-years', getSchoolYears);
router.get('/classrooms', ClassroomController.getClassrooms);
router.get('/exams', getExams);
router.get('/grades', getGrades);
router.get('/subjects', getSubjects);
router.get('/terms', getTerms);

router.get('/teachers-in-classroom', getTeachersInClassroom);

router.post('/rankings/classroom-yearly', getClassroomYearlyRankings);
router.post('/rankings/grade-yearly', getGradeYearlyRankings);
router.post('/rankings/classroom-term', getClassroomTermRankings);
router.post('/rankings/grade-term', getGradeTermRankings);

router.post('/academic-performance/classroom-term', academicPerformanceController.getClassroomTermPerformance);
router.post('/academic-performance/classroom-yearly', academicPerformanceController.getClassroomYearlyPerformance);
router.post('/academic-performance/grade-term', academicPerformanceController.getGradeTermPerformance);
router.post('/academic-performance/grade-yearly', academicPerformanceController.getGradeYearlyPerformance);

router.get('/export-scores', exportScores);
router.get('/export-student-term-averages', exportStudentTermAverages);
router.get('/export-student-yearly-averages', exportStudentYearlyAverages);

router.post('/import-scores', upload.single('file'), importScores);

router.post('/ai/ask', AIController.ask);

router.use(auth);////////////////////////////////////////////////////////////////////////////////////////////////

router.post('/logout', authController.logout);
router.get('/user', authController.getUser);

router.get('/teachers', getAllTeachers);
router.get('/students-by-classroom', getStudentsByClassroom);
router.post('/assign-homeroom-classroom', assignHomeroomClassroom);
router.post('/assign-teaching-classroom', assignTeachingClassroom);
router.post('/teacher/enter-scores', enterScores);
router.put('/teacher/update', updateTeacher);
router.post('/teacher/classroom-scores', getClassroomScores);

router.post('/student/scores', getScores);
router.put('/student/update', updateStudent);
router.post('/export/student-scores', exportStudentScores);

// Thêm các route CRUD cho Classroom
router.post('/classrooms', ClassroomController.createClassroom);
router.get('/classrooms/:classroom_code', ClassroomController.getClassroomByCode);
router.put('/classrooms/:classroom_code', ClassroomController.updateClassroom);
router.delete('/classrooms/:classroom_code', ClassroomController.deleteClassroom);

// Thêm các route CRUD cho Exam
router.post('/exams', createExam);
router.get('/exams/:exam_code', getExamByCode);
router.put('/exams/:exam_code', updateExam);
router.delete('/exams/:exam_code', deleteExam);

// Thêm các route CRUD cho Grade
router.post('/grades', createGrade);
router.get('/grades/:grade_code', getGradeByCode);
router.put('/grades/:grade_code', updateGrade);
router.delete('/grades/:grade_code', deleteGrade);

// Thêm các route CRUD cho SchoolYear
router.post('/school-years', createSchoolYear);
router.get('/school-years/:school_year_code', getSchoolYearByCode);
router.put('/school-years/:school_year_code', updateSchoolYear);
router.delete('/school-years/:school_year_code', deleteSchoolYear);

// Thêm các route CRUD cho Subject
router.post('/subjects', createSubject);
router.get('/subjects/:subject_code', getSubjectByCode);
router.put('/subjects/:subject_code', updateSubject);
router.delete('/subjects/:subject_code', deleteSubject);

// Thêm các route CRUD cho Term
router.post('/terms', createTerm);
router.get('/terms/:term_code', getTermByCode);
router.put('/terms/:term_code', updateTerm);
router.delete('/terms/:term_code', deleteTerm);

module.exports = router;