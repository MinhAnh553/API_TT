import express from 'express';
import {
    createExamination,
    updateExamination,
    getExaminationById,
    getPatientExaminationHistory,
    getExaminations,
    completeExamination,
} from '../../../../controllers/examination/examinationController.js';
import {
    authenticateToken,
    authorize,
} from '../../../../middlewares/authMiddleware.js';

const Router = express.Router();

// Tất cả routes đều yêu cầu xác thực
Router.use(authenticateToken);

// Tạo phiếu khám mới
Router.post('/', authorize('admin', 'doctor'), createExamination);

// Lấy danh sách phiếu khám với bộ lọc
Router.get('/', getExaminations);

// Xem chi tiết phiếu khám
Router.get('/:id', getExaminationById);

// Cập nhật phiếu khám
Router.put('/:id', authorize('admin', 'doctor'), updateExamination);

// Hoàn thành phiếu khám
Router.patch(
    '/:id/complete',
    authorize('admin', 'doctor'),
    completeExamination,
);

// Xem lịch sử các lần khám của bệnh nhân
Router.get('/patient/:patientId/history', getPatientExaminationHistory);

export default Router;
