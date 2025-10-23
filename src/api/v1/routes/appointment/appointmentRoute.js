import express from 'express';
import {
    createAppointment,
    getAppointments,
    getAppointmentById,
    checkInAppointment,
    cancelAppointment,
    findAvailableDoctors,
    suggestAlternativeDoctors,
    rescheduleAppointment,
    confirmAppointment,
    getAppointmentByCode,
} from '../../../../controllers/appointment/appointmentController.js';
import {
    authenticateToken,
    authorize,
} from '../../../../middlewares/authMiddleware.js';

const router = express.Router();

// Public routes (không cần auth)
router.post('/', createAppointment); // Đặt lịch khám
router.get('/available-doctors', findAvailableDoctors); // Tìm bác sĩ còn trống
router.get('/suggest-doctors', suggestAlternativeDoctors); // Gợi ý bác sĩ thay thế
router.get('/code/:code', getAppointmentByCode); // Lấy lịch hẹn theo mã

// Protected routes (cần auth)
router.get(
    '/',
    authenticateToken,
    authorize(['admin', 'doctor', 'receptionist']),
    getAppointments,
);
router.get(
    '/:id',
    authenticateToken,
    authorize(['admin', 'doctor', 'receptionist']),
    getAppointmentById,
);
router.patch(
    '/:id/checkin',
    authenticateToken,
    authorize(['admin', 'doctor', 'receptionist']),
    checkInAppointment,
);
router.patch(
    '/:id/cancel',
    authenticateToken,
    authorize(['admin', 'doctor', 'receptionist']),
    cancelAppointment,
);
router.patch(
    '/:id/reschedule',
    authenticateToken,
    authorize(['admin', 'doctor', 'receptionist']),
    rescheduleAppointment,
);
router.patch(
    '/:id/confirm',
    authenticateToken,
    authorize(['admin', 'doctor', 'receptionist']),
    confirmAppointment,
);

export default router;
