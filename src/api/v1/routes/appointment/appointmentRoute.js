import express from 'express';
import {
    createAppointment,
    getAppointments,
    getAppointmentById,
    checkInAppointment,
    cancelAppointment,
} from '../../../../controllers/appointment/appointmentController.js';
import {
    authenticateToken,
    authorize,
} from '../../../../middlewares/authMiddleware.js';

const Router = express.Router();

// Đặt lịch khám (public - không cần auth cho bệnh nhân)
Router.post('/', createAppointment);

// Tất cả routes khác đều yêu cầu xác thực
Router.use(authenticateToken);

// Lấy danh sách lịch khám với bộ lọc
Router.get('/', getAppointments);

// Lấy chi tiết lịch khám
Router.get('/:id', getAppointmentById);

// Check-in lịch khám
Router.patch('/:id/checkin', checkInAppointment);

// Hủy lịch khám
Router.patch('/:id/cancel', cancelAppointment);

export default Router;
