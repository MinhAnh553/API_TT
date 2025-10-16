import express from 'express';
import {
    createExamination,
    updateExamination,
    getExaminationById,
    getPatientExaminationHistory,
    getExaminations,
    completeExamination,
    cancelExamination,
} from '../../../../controllers/examination/examinationController.js';
import {
    authenticateToken,
    authorize,
} from '../../../../middlewares/authMiddleware.js';

const Router = express.Router();

// Tất cả routes đều yêu cầu xác thực
Router.use(authenticateToken);

// Tạo hồ sơ bệnh án ban đầu cho bệnh nhân
Router.post('/', authorize('admin', 'doctor'), createExamination);

// Lấy danh sách hồ sơ khám bệnh với bộ lọc
Router.get('/', getExaminations);

// Xem chi tiết hồ sơ bệnh án
Router.get('/:id', getExaminationById);

// Cập nhật hồ sơ bệnh án
Router.put('/:id', authorize('admin', 'doctor'), updateExamination);

// Hoàn thành hồ sơ khám bệnh
Router.patch(
    '/:id/complete',
    authorize('admin', 'doctor'),
    completeExamination,
);

// Hủy hồ sơ khám bệnh
Router.patch('/:id/cancel', authorize('admin', 'doctor'), cancelExamination);

// Xem lịch sử các lần khám của bệnh nhân
Router.get('/patient/:patientId/history', getPatientExaminationHistory);

export default Router;
