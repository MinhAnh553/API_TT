import express from 'express';
import {
    createDoctorSchedule,
    getDoctorSchedules,
    getDoctorScheduleById,
    updateDoctorSchedule,
    deleteDoctorSchedule,
    getDoctorCalendar,
} from '../../../../controllers/doctorSchedule/doctorScheduleController.js';
import {
    authenticateToken,
    authorize,
} from '../../../../middlewares/authMiddleware.js';

const router = express.Router();

// Tất cả routes đều yêu cầu xác thực và quyền admin/doctor
router.use(authenticateToken);
router.use(authorize(['admin', 'doctor']));

// CRUD operations
router.post('/', createDoctorSchedule); // Tạo lịch trực
router.get('/', getDoctorSchedules); // Lấy danh sách lịch trực
router.get('/calendar', getDoctorCalendar); // Lấy lịch calendar
router.get('/:id', getDoctorScheduleById); // Lấy chi tiết lịch trực
router.put('/:id', updateDoctorSchedule); // Cập nhật lịch trực
router.delete('/:id', deleteDoctorSchedule); // Xóa lịch trực

export default router;
