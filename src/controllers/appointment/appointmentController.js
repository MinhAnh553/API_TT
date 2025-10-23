import Joi from 'joi';
import Appointment from '../../models/appointmentModel.js';
import Patient from '../../models/patientModel.js';
import DoctorSchedule from '../../models/doctorScheduleModel.js';
import User from '../../models/userModel.js';
import SmartSchedulingService from '../../services/smartSchedulingService.js';

// Validation schemas
const createAppointmentSchema = Joi.object({
    patient: Joi.string().optional(), // Có thể tạo appointment mà chưa có patient
    fullName: Joi.string().when('patient', {
        is: Joi.exist(),
        then: Joi.optional(),
        otherwise: Joi.required().messages({
            'any.required': 'Họ tên là bắt buộc khi chưa có mã bệnh nhân',
        }),
    }),
    phone: Joi.string().when('patient', {
        is: Joi.exist(),
        then: Joi.optional(),
        otherwise: Joi.required().messages({
            'any.required':
                'Số điện thoại là bắt buộc khi chưa có mã bệnh nhân',
        }),
    }),
    appointmentDate: Joi.date().required().messages({
        'any.required': 'Ngày đặt lịch là bắt buộc',
    }),
    timeSlot: Joi.object({
        start: Joi.string()
            .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
            .required()
            .messages({
                'string.pattern.base':
                    'Định dạng thời gian không hợp lệ (HH:mm)',
                'any.required': 'Thời gian bắt đầu là bắt buộc',
            }),
        end: Joi.string()
            .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
            .required()
            .messages({
                'string.pattern.base':
                    'Định dạng thời gian không hợp lệ (HH:mm)',
                'any.required': 'Thời gian kết thúc là bắt buộc',
            }),
        duration: Joi.number().min(15).max(180).default(30).optional(),
    }).required(),
    // Thông tin bác sĩ và chuyên khoa
    doctor: Joi.string().optional(),
    department: Joi.string().optional(),
    reasonForVisit: Joi.string().trim().optional(),
}).custom((value, helpers) => {
    // Validate time slot
    if (value.timeSlot && value.timeSlot.start && value.timeSlot.end) {
        const startTime = new Date(`2000-01-01T${value.timeSlot.start}:00`);
        const endTime = new Date(`2000-01-01T${value.timeSlot.end}:00`);

        if (startTime >= endTime) {
            return helpers.error('any.custom', {
                message: 'Thời gian bắt đầu phải nhỏ hơn thời gian kết thúc',
            });
        }
    }

    // Validate appointment date (không được đặt lịch trong quá khứ)
    if (value.appointmentDate) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (new Date(value.appointmentDate) < today) {
            return helpers.error('any.custom', {
                message: 'Không thể đặt lịch trong quá khứ',
            });
        }
    }

    return value;
});

// Đặt lịch khám bệnh (public - không cần auth)
export const createAppointment = async (req, res) => {
    try {
        // Validate request body
        const { error, value } = createAppointmentSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                message: 'Định dạng không hợp lệ',
                errors: error.details.map((detail) => detail.message),
            });
        }

        // Kiểm tra xem đã có patient với số điện thoại này chưa
        let patient = await Patient.findOne({
            phone: value.phone,
            isActive: true,
        });

        let patientId = null;
        if (patient) {
            patientId = patient._id;
        }

        // Kiểm tra xung đột lịch bằng SmartSchedulingService
        if (value.doctor) {
            const conflictCheck =
                await SmartSchedulingService.checkAppointmentConflict({
                    doctor: value.doctor,
                    appointmentDate: value.appointmentDate,
                    timeSlot: value.timeSlot,
                });

            if (conflictCheck.hasConflict) {
                return res.status(400).json({
                    success: false,
                    message: conflictCheck.reason,
                });
            }
        }

        // Tạo appointment mới
        const appointment = new Appointment({
            ...value,
            patient: patientId,
            doctor: value.doctor || null,
            department: value.department || null,
            reasonForVisit: value.reasonForVisit || null,
            source: 'online', // Đặt lịch online
            createdBy: req.user?.userId || null,
        });

        await appointment.save();

        // Populate thông tin patient nếu có
        if (patientId) {
            await appointment.populate({
                path: 'patient',
                select: 'patientCode fullName phone',
            });
        }

        res.status(201).json({
            success: true,
            message: 'Đặt lịch khám thành công',
            data: {
                appointment,
            },
        });
    } catch (error) {
        console.error('Lỗi đặt lịch khám:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message,
        });
    }
};

// Lấy danh sách lịch khám (cần auth)
export const getAppointments = async (req, res) => {
    try {
        const {
            status,
            appointmentDateFrom,
            appointmentDateTo,
            page = 1,
            limit = 10,
            sortBy = 'appointmentDate',
            sortOrder = 'asc',
        } = req.query;

        // Xây dựng truy vấn lọc
        let query = {};

        if (status) {
            query.status = status;
        }

        // Lọc theo ngày đặt lịch
        if (appointmentDateFrom || appointmentDateTo) {
            const dateQuery = {};
            if (appointmentDateFrom) {
                dateQuery.$gte = new Date(appointmentDateFrom);
            }
            if (appointmentDateTo) {
                const toDate = new Date(appointmentDateTo);
                toDate.setHours(23, 59, 59, 999);
                dateQuery.$lte = toDate;
            }
            query.appointmentDate = dateQuery;
        }

        // Tính toán phân trang
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        // Xây dựng đối tượng sắp xếp
        const sortObj = {};
        sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1;

        // Thực hiện truy vấn
        const appointments = await Appointment.find(query)
            .populate({
                path: 'patient',
                select: 'patientCode fullName phone',
            })
            .select('-__v')
            .sort(sortObj)
            .skip(skip)
            .limit(limitNum);

        // Đếm tổng số
        const total = await Appointment.countDocuments(query);

        // Tính toán thông tin phân trang
        const totalPages = Math.ceil(total / limitNum);
        const hasNextPage = pageNum < totalPages;
        const hasPrevPage = pageNum > 1;

        res.status(200).json({
            success: true,
            message: 'Lấy danh sách lịch khám thành công',
            data: {
                appointments,
                pagination: {
                    currentPage: pageNum,
                    totalPages,
                    totalItems: total,
                    itemsPerPage: limitNum,
                    hasNextPage,
                    hasPrevPage,
                },
            },
        });
    } catch (error) {
        console.error('Lỗi lấy danh sách lịch khám:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message,
        });
    }
};

// Lấy chi tiết lịch khám (cần auth)
export const getAppointmentById = async (req, res) => {
    try {
        const { id } = req.params;

        const appointment = await Appointment.findOne({
            _id: id,
        }).populate({
            path: 'patient',
            select: 'patientCode fullName phone dateOfBirth gender address',
        });

        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: 'Lịch khám không tồn tại',
            });
        }

        res.status(200).json({
            success: true,
            message: 'Lấy thông tin lịch khám thành công',
            data: {
                appointment,
            },
        });
    } catch (error) {
        console.error('Lỗi lấy thông tin lịch khám:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message,
        });
    }
};

// Check-in lịch khám (cần auth)
export const checkInAppointment = async (req, res) => {
    try {
        const { id } = req.params;

        const appointment = await Appointment.findOne({
            _id: id,
            status: { $in: ['scheduled', 'confirmed'] },
        });

        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: 'Lịch khám không tồn tại hoặc không thể check-in',
            });
        }

        // Cập nhật trạng thái check-in
        const checkedInAppointment = await Appointment.findByIdAndUpdate(
            appointment._id,
            {
                status: 'checked_in',
                checkInTime: new Date(),
            },
            { new: true },
        ).populate({
            path: 'patient',
            select: 'patientCode fullName phone',
        });

        res.status(200).json({
            success: true,
            message: 'Check-in thành công',
            data: {
                appointment: checkedInAppointment,
            },
        });
    } catch (error) {
        console.error('Lỗi check-in:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message,
        });
    }
};

// Hủy lịch khám (cần auth)
// Tìm bác sĩ còn trống lịch
export const findAvailableDoctors = async (req, res) => {
    try {
        const { date, time, department, specialization, duration } = req.query;

        if (!date || !time) {
            return res.status(400).json({
                success: false,
                message: 'Ngày và giờ là bắt buộc',
            });
        }

        const availableDoctors =
            await SmartSchedulingService.findAvailableDoctors({
                date: new Date(date),
                time,
                department,
                specialization,
                duration: duration ? parseInt(duration) : 30,
            });

        res.status(200).json({
            success: true,
            data: availableDoctors,
        });
    } catch (error) {
        console.error('Lỗi tìm bác sĩ:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message,
        });
    }
};

// Gợi ý bác sĩ thay thế
export const suggestAlternativeDoctors = async (req, res) => {
    try {
        const {
            preferredDoctor,
            date,
            time,
            department,
            specialization,
            duration,
        } = req.query;

        if (!preferredDoctor || !date || !time) {
            return res.status(400).json({
                success: false,
                message: 'Bác sĩ mong muốn, ngày và giờ là bắt buộc',
            });
        }

        const alternatives =
            await SmartSchedulingService.suggestAlternativeDoctors({
                preferredDoctor,
                date: new Date(date),
                time,
                department,
                specialization,
                duration: duration ? parseInt(duration) : 30,
            });

        res.status(200).json({
            success: true,
            data: alternatives,
        });
    } catch (error) {
        console.error('Lỗi gợi ý bác sĩ:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message,
        });
    }
};

// Đổi lịch hẹn
export const rescheduleAppointment = async (req, res) => {
    try {
        const { id } = req.params;
        const { appointmentDate, timeSlot, doctor, reason } = req.body;

        // Validate request body
        const { error, value } = Joi.object({
            appointmentDate: Joi.date().required(),
            timeSlot: Joi.object({
                start: Joi.string()
                    .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
                    .required(),
                end: Joi.string()
                    .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
                    .required(),
                duration: Joi.number().min(15).max(180).default(30).optional(),
            }).required(),
            doctor: Joi.string().optional(),
            reason: Joi.string().trim().optional(),
        }).validate({ appointmentDate, timeSlot, doctor, reason });

        if (error) {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: error.details.map((detail) => detail.message),
            });
        }

        // Find existing appointment
        const existingAppointment = await Appointment.findById(id);
        if (!existingAppointment) {
            return res.status(404).json({
                success: false,
                message: 'Lịch hẹn không tồn tại',
            });
        }

        // Check if appointment can be rescheduled
        if (
            existingAppointment.status === 'completed' ||
            existingAppointment.status === 'cancelled'
        ) {
            return res.status(400).json({
                success: false,
                message: 'Không thể đổi lịch hẹn đã hoàn thành hoặc đã hủy',
            });
        }

        // Check for conflicts
        const doctorToCheck = doctor || existingAppointment.doctor;
        if (doctorToCheck) {
            const conflictCheck =
                await SmartSchedulingService.checkAppointmentConflict({
                    doctor: doctorToCheck,
                    appointmentDate: value.appointmentDate,
                    timeSlot: value.timeSlot,
                    excludeAppointmentId: id,
                });

            if (conflictCheck.hasConflict) {
                return res.status(400).json({
                    success: false,
                    message: conflictCheck.reason,
                });
            }
        }

        // Update appointment
        const updatedAppointment = await Appointment.findByIdAndUpdate(
            id,
            {
                appointmentDate: value.appointmentDate,
                timeSlot: value.timeSlot,
                doctor: doctor || existingAppointment.doctor,
                status: 'rescheduled',
                rescheduleReason: value.reason,
                rescheduledAt: new Date(),
                rescheduledBy: req.user?.userId,
            },
            { new: true, runValidators: true },
        ).populate('patient', 'patientCode fullName phone');

        res.status(200).json({
            success: true,
            message: 'Đổi lịch hẹn thành công',
            data: updatedAppointment,
        });
    } catch (error) {
        console.error('Lỗi đổi lịch hẹn:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message,
        });
    }
};

// Xác nhận lịch hẹn
export const confirmAppointment = async (req, res) => {
    try {
        const { id } = req.params;

        const appointment = await Appointment.findByIdAndUpdate(
            id,
            { status: 'confirmed', confirmedAt: new Date() },
            { new: true, runValidators: true },
        ).populate('patient', 'patientCode fullName phone');

        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: 'Lịch hẹn không tồn tại',
            });
        }

        res.status(200).json({
            success: true,
            message: 'Xác nhận lịch hẹn thành công',
            data: {
                appointment,
                confirmationCode: appointment.appointmentCode,
            },
        });
    } catch (error) {
        console.error('Lỗi xác nhận lịch hẹn:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message,
        });
    }
};

// Lấy lịch hẹn theo mã xác nhận
export const getAppointmentByCode = async (req, res) => {
    try {
        const { code } = req.params;

        const appointment = await Appointment.findOne({
            appointmentCode: code,
            status: {
                $in: ['scheduled', 'confirmed', 'checked_in', 'in_progress'],
            },
        })
            .populate(
                'patient',
                'patientCode fullName phone dateOfBirth gender',
            )
            .populate('doctor', 'fullName doctorInfo');

        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: 'Lịch hẹn không tồn tại hoặc đã hết hạn',
            });
        }

        res.status(200).json({
            success: true,
            data: appointment,
        });
    } catch (error) {
        console.error('Lỗi lấy lịch hẹn:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message,
        });
    }
};

export const cancelAppointment = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        const appointment = await Appointment.findOne({
            _id: id,
            status: { $in: ['scheduled', 'confirmed'] }, // Chỉ hủy được khi chưa khám
        });

        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: 'Lịch khám không tồn tại hoặc không thể hủy',
            });
        }

        // Cập nhật trạng thái hủy
        const cancelledAppointment = await Appointment.findByIdAndUpdate(
            appointment._id,
            {
                status: 'cancelled',
                cancellationReason: reason,
                cancelledBy: req.user?.userId,
                cancelledAt: new Date(),
            },
            { new: true },
        ).populate({
            path: 'patient',
            select: 'patientCode fullName phone',
        });

        res.status(200).json({
            success: true,
            message: 'Hủy lịch khám thành công',
            data: {
                appointment: cancelledAppointment,
            },
        });
    } catch (error) {
        console.error('Lỗi hủy lịch khám:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message,
        });
    }
};
