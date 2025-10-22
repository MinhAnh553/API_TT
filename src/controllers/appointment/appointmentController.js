import Joi from 'joi';
import Appointment from '../../models/appointmentModel.js';
import Patient from '../../models/patientModel.js';

// Validation schemas
const createAppointmentSchema = Joi.object({
    fullName: Joi.string().required().messages({
        'any.required': 'Họ tên là bắt buộc',
    }),
    phone: Joi.string().required().messages({
        'any.required': 'Số điện thoại là bắt buộc',
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

        // TODO: Kiểm tra xung đột lịch sẽ được thêm sau
        // Tạm thời bỏ qua để tránh lỗi MongoDB

        // Tạo appointment mới
        const appointment = new Appointment({
            ...value,
            patient: patientId,
            source: 'online', // Đặt lịch online
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
