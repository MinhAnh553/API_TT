import DoctorSchedule from '../../models/doctorScheduleModel.js';
import User from '../../models/userModel.js';
import Appointment from '../../models/appointmentModel.js';
import Joi from 'joi';

// Validation schemas
const createDoctorScheduleSchema = Joi.object({
    doctor: Joi.string().required().messages({
        'any.required': 'Bác sĩ là bắt buộc',
    }),
    department: Joi.string().required().messages({
        'any.required': 'Khoa/phòng là bắt buộc',
    }),
    scheduleDate: Joi.date().required().messages({
        'any.required': 'Ngày trực là bắt buộc',
    }),
    shiftType: Joi.string()
        .valid('morning', 'afternoon', 'evening', 'night')
        .required()
        .messages({
            'any.required': 'Loại ca trực là bắt buộc',
            'any.only':
                'Loại ca trực phải là morning, afternoon, evening hoặc night',
        }),
    timeSlots: Joi.array()
        .items(
            Joi.object({
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
                maxPatients: Joi.number().min(1).default(10).optional(),
                isAvailable: Joi.boolean().default(true).optional(),
            }),
        )
        .min(1)
        .required()
        .messages({
            'any.required': 'Danh sách khung giờ là bắt buộc',
            'array.min': 'Phải có ít nhất 1 khung giờ',
        }),
    notes: Joi.string().trim().optional(),
}).custom((value, helpers) => {
    // Validate time slots
    if (value.timeSlots && value.timeSlots.length > 0) {
        for (const slot of value.timeSlots) {
            const startTime = new Date(`2000-01-01T${slot.start}:00`);
            const endTime = new Date(`2000-01-01T${slot.end}:00`);

            if (startTime >= endTime) {
                return helpers.error('any.custom', {
                    message:
                        'Thời gian bắt đầu phải nhỏ hơn thời gian kết thúc',
                });
            }
        }
    }

    // Validate schedule date (không được tạo lịch trong quá khứ)
    if (value.scheduleDate) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (new Date(value.scheduleDate) < today) {
            return helpers.error('any.custom', {
                message: 'Không thể tạo lịch trực trong quá khứ',
            });
        }
    }

    return value;
});

const updateDoctorScheduleSchema = Joi.object({
    department: Joi.string().optional(),
    shiftType: Joi.string()
        .valid('morning', 'afternoon', 'evening', 'night')
        .optional(),
    timeSlots: Joi.array()
        .items(
            Joi.object({
                start: Joi.string()
                    .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
                    .required(),
                end: Joi.string()
                    .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
                    .required(),
                duration: Joi.number().min(15).max(180).default(30).optional(),
                maxPatients: Joi.number().min(1).default(10).optional(),
                isAvailable: Joi.boolean().default(true).optional(),
            }),
        )
        .min(1)
        .optional(),
    notes: Joi.string().trim().optional(),
    status: Joi.string()
        .valid('scheduled', 'active', 'completed', 'cancelled')
        .optional(),
});

// Controllers
export const createDoctorSchedule = async (req, res) => {
    try {
        // Validate request body
        const { error, value } = createDoctorScheduleSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: error.details.map((detail) => detail.message),
            });
        }

        // Check if doctor exists and is active
        const doctor = await User.findById(value.doctor);
        if (!doctor || !doctor.isActive || doctor.role !== 'doctor') {
            return res.status(404).json({
                success: false,
                message: 'Bác sĩ không tồn tại hoặc không hoạt động',
            });
        }

        // Check if schedule already exists for this doctor on this date
        const existingSchedule = await DoctorSchedule.findOne({
            doctor: value.doctor,
            scheduleDate: value.scheduleDate,
            shiftType: value.shiftType,
            isActive: true,
        });

        if (existingSchedule) {
            return res.status(400).json({
                success: false,
                message: 'Bác sĩ đã có lịch trực trong ca này',
            });
        }

        // Create new doctor schedule
        const doctorSchedule = new DoctorSchedule({
            ...value,
            createdBy: req.user.userId,
        });

        await doctorSchedule.save();

        // Populate doctor info
        await doctorSchedule.populate(
            'doctor',
            'fullName email phone doctorInfo',
        );

        res.status(201).json({
            success: true,
            message: 'Tạo lịch trực thành công',
            data: doctorSchedule,
        });
    } catch (error) {
        console.error('Lỗi tạo lịch trực:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message,
        });
    }
};

export const getDoctorSchedules = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            doctor,
            department,
            scheduleDate,
            shiftType,
            status,
        } = req.query;

        // Build filter
        const filter = { isActive: true };

        if (doctor) filter.doctor = doctor;
        if (department) filter.department = department;
        if (scheduleDate) {
            const date = new Date(scheduleDate);
            filter.scheduleDate = {
                $gte: new Date(
                    date.getFullYear(),
                    date.getMonth(),
                    date.getDate(),
                ),
                $lt: new Date(
                    date.getFullYear(),
                    date.getMonth(),
                    date.getDate() + 1,
                ),
            };
        }
        if (shiftType) filter.shiftType = shiftType;
        if (status) filter.status = status;

        // Get schedules with pagination
        const schedules = await DoctorSchedule.find(filter)
            .populate('doctor', 'fullName email phone doctorInfo')
            .populate('createdBy', 'fullName username')
            .sort({ scheduleDate: 1, 'timeSlots.start': 1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await DoctorSchedule.countDocuments(filter);

        res.status(200).json({
            success: true,
            data: {
                schedules,
                pagination: {
                    current: page,
                    pages: Math.ceil(total / limit),
                    total,
                },
            },
        });
    } catch (error) {
        console.error('Lỗi lấy danh sách lịch trực:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message,
        });
    }
};

export const getDoctorScheduleById = async (req, res) => {
    try {
        const { id } = req.params;

        const schedule = await DoctorSchedule.findOne({
            _id: id,
            isActive: true,
        })
            .populate('doctor', 'fullName email phone doctorInfo')
            .populate('createdBy', 'fullName username');

        if (!schedule) {
            return res.status(404).json({
                success: false,
                message: 'Lịch trực không tồn tại',
            });
        }

        res.status(200).json({
            success: true,
            data: schedule,
        });
    } catch (error) {
        console.error('Lỗi lấy lịch trực:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message,
        });
    }
};

export const updateDoctorSchedule = async (req, res) => {
    try {
        const { id } = req.params;

        // Validate request body
        const { error, value } = updateDoctorScheduleSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: error.details.map((detail) => detail.message),
            });
        }

        // Find and update schedule
        const schedule = await DoctorSchedule.findOneAndUpdate(
            { _id: id, isActive: true },
            value,
            { new: true, runValidators: true },
        )
            .populate('doctor', 'fullName email phone doctorInfo')
            .populate('createdBy', 'fullName username');

        if (!schedule) {
            return res.status(404).json({
                success: false,
                message: 'Lịch trực không tồn tại',
            });
        }

        res.status(200).json({
            success: true,
            message: 'Cập nhật lịch trực thành công',
            data: schedule,
        });
    } catch (error) {
        console.error('Lỗi cập nhật lịch trực:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message,
        });
    }
};

export const deleteDoctorSchedule = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if schedule has appointments
        const appointments = await Appointment.find({
            doctorSchedule: id,
            status: {
                $in: ['scheduled', 'confirmed', 'checked_in', 'in_progress'],
            },
        });

        if (appointments.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Không thể xóa lịch trực đã có lịch hẹn',
            });
        }

        // Soft delete
        const schedule = await DoctorSchedule.findOneAndUpdate(
            { _id: id, isActive: true },
            { isActive: false },
            { new: true },
        );

        if (!schedule) {
            return res.status(404).json({
                success: false,
                message: 'Lịch trực không tồn tại',
            });
        }

        res.status(200).json({
            success: true,
            message: 'Xóa lịch trực thành công',
        });
    } catch (error) {
        console.error('Lỗi xóa lịch trực:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message,
        });
    }
};

export const getDoctorCalendar = async (req, res) => {
    try {
        const { doctor, month, year } = req.query;

        if (!month || !year) {
            return res.status(400).json({
                success: false,
                message: 'Tháng và năm là bắt buộc',
            });
        }

        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0);

        const filter = {
            isActive: true,
            scheduleDate: {
                $gte: startDate,
                $lte: endDate,
            },
        };

        if (doctor) filter.doctor = doctor;

        const schedules = await DoctorSchedule.find(filter)
            .populate('doctor', 'fullName email phone doctorInfo')
            .sort({ scheduleDate: 1, 'timeSlots.start': 1 });

        res.status(200).json({
            success: true,
            data: schedules,
        });
    } catch (error) {
        console.error('Lỗi lấy lịch bác sĩ:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message,
        });
    }
};
