import Joi from 'joi';
import Examination from '../../models/examinationModel.js';
import Patient from '../../models/patientModel.js';
import User from '../../models/userModel.js';
import Appointment from '../../models/appointmentModel.js';

// Validation schemas
const createExaminationSchema = Joi.object({
    patient: Joi.string().required().messages({
        'any.required': 'Mã bệnh nhân là bắt buộc',
    }),
    appointment: Joi.string().optional(), // Liên kết với appointment nếu có
    reasonForVisit: Joi.string().required().messages({
        'any.required': 'Lý do khám là bắt buộc',
    }),
    symptoms: Joi.string().optional(),
    diagnosis: Joi.string().required().messages({
        'any.required': 'Mô tả chẩn đoán là bắt buộc',
    }),
    treatment: Joi.string().trim().optional(),
    followUpDate: Joi.date().optional(),
    followUpInstructions: Joi.string().trim().optional(),
    notes: Joi.string().trim().optional(),
});

const updateExaminationSchema = Joi.object({
    reasonForVisit: Joi.string().optional(),
    symptoms: Joi.string().optional().allow(''),
    diagnosis: Joi.string().optional(),
    treatment: Joi.string().trim().optional(),
    followUpDate: Joi.date().optional(),
    followUpInstructions: Joi.string().trim().optional(),
    notes: Joi.string().trim().optional(),
});

// Tạo phiếu khám mới
export const createExamination = async (req, res) => {
    try {
        // Validate request body
        const { error, value } = createExaminationSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                message: 'Định dạng không hợp lệ',
                errors: error.details.map((detail) => detail.message),
            });
        }

        // Kiểm tra bệnh nhân có tồn tại không
        const patient = await Patient.findOne({
            _id: value.patient,
            isActive: true,
        });

        if (!patient) {
            return res.status(404).json({
                success: false,
                message: 'Bệnh nhân không tồn tại',
            });
        }

        // Kiểm tra appointment nếu có
        let appointment = null;
        if (value.appointment) {
            appointment = await Appointment.findOne({
                _id: value.appointment,
                status: { $in: ['checked_in', 'scheduled', 'confirmed'] },
            });

            if (!appointment) {
                return res.status(404).json({
                    success: false,
                    message: 'Lịch khám không tồn tại hoặc không hợp lệ',
                });
            }
        }

        // Tạo phiếu khám mới
        const examination = new Examination({
            ...value,
            doctor: req.user.userId,
            examinationDate: new Date(),
            status: 'in_progress',
        });

        await examination.save();

        // Nếu có appointment, cập nhật appointment với examination
        if (appointment) {
            await Appointment.findByIdAndUpdate(appointment._id, {
                examination: examination._id,
                status: 'in_progress',
                checkInTime: appointment.checkInTime || new Date(),
            });
        }

        // Populate thông tin bệnh nhân và bác sĩ
        await examination.populate([
            {
                path: 'patient',
                select: 'patientCode fullName dateOfBirth gender phone',
            },
            { path: 'doctor', select: 'username fullName' },
            {
                path: 'appointment',
                select: 'appointmentCode appointmentDate timeSlot',
            },
        ]);

        // Cập nhật ngày khám cuối cùng của bệnh nhân
        await Patient.findByIdAndUpdate(patient._id, {
            lastVisitDate: new Date(),
        });

        res.status(201).json({
            success: true,
            message: 'Tạo phiếu khám thành công',
            data: {
                examination,
            },
        });
    } catch (error) {
        console.error('Lỗi tạo phiếu khám:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message,
        });
    }
};

// Cập nhật phiếu khám
export const updateExamination = async (req, res) => {
    try {
        const { id } = req.params;

        // Validate request body
        const { error, value } = updateExaminationSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                message: 'Định dạng không hợp lệ',
                errors: error.details.map((detail) => detail.message),
            });
        }

        // Tìm phiếu khám
        const examination = await Examination.findOne({
            _id: id,
            status: { $in: ['in_progress'] }, // Chỉ cập nhật được khi đang khám
        });

        if (!examination) {
            return res.status(404).json({
                success: false,
                message: 'Phiếu khám không tồn tại hoặc không thể cập nhật',
            });
        }

        // Cập nhật phiếu khám
        const updatedExamination = await Examination.findByIdAndUpdate(
            examination._id,
            value,
            { new: true, runValidators: true },
        ).populate([
            {
                path: 'patient',
                select: 'patientCode fullName dateOfBirth gender phone',
            },
            { path: 'doctor', select: 'username fullName' },
            {
                path: 'appointment',
                select: 'appointmentCode appointmentDate timeSlot',
            },
        ]);

        res.status(200).json({
            success: true,
            message: 'Cập nhật phiếu khám thành công',
            data: {
                examination: updatedExamination,
            },
        });
    } catch (error) {
        console.error('Lỗi cập nhật phiếu khám:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message,
        });
    }
};

// Lấy chi tiết phiếu khám
export const getExaminationById = async (req, res) => {
    try {
        const { id } = req.params;

        const examination = await Examination.findOne({
            _id: id,
        }).populate([
            {
                path: 'patient',
                select: 'patientCode fullName dateOfBirth gender phone address medicalHistory',
            },
            { path: 'doctor', select: 'username fullName' },
            {
                path: 'appointment',
                select: 'appointmentCode appointmentDate timeSlot reason',
            },
        ]);

        if (!examination) {
            return res.status(404).json({
                success: false,
                message: 'Phiếu khám không tồn tại',
            });
        }

        res.status(200).json({
            success: true,
            message: 'Lấy thông tin phiếu khám thành công',
            data: {
                examination,
            },
        });
    } catch (error) {
        console.error('Lỗi lấy thông tin phiếu khám:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message,
        });
    }
};

// Hoàn thành phiếu khám
export const completeExamination = async (req, res) => {
    try {
        const { id } = req.params;

        const examination = await Examination.findOne({
            _id: id,
            status: 'in_progress',
        });

        if (!examination) {
            return res.status(404).json({
                success: false,
                message: 'Phiếu khám không tồn tại hoặc không thể hoàn thành',
            });
        }

        // Kiểm tra có chẩn đoán chưa
        if (!examination.diagnosis) {
            return res.status(400).json({
                success: false,
                message:
                    'Vui lòng thêm chẩn đoán trước khi hoàn thành phiếu khám',
            });
        }

        // Cập nhật trạng thái hoàn thành
        const completedExamination = await Examination.findByIdAndUpdate(
            examination._id,
            {
                status: 'completed',
                completedAt: new Date(),
                completedBy: req.user.userId,
            },
            { new: true },
        ).populate([
            {
                path: 'patient',
                select: 'patientCode fullName dateOfBirth gender phone',
            },
            { path: 'doctor', select: 'username fullName' },
            {
                path: 'appointment',
                select: 'appointmentCode appointmentDate timeSlot',
            },
        ]);

        // Cập nhật appointment nếu có
        if (examination.appointment) {
            await Appointment.findByIdAndUpdate(examination.appointment, {
                status: 'completed',
                checkOutTime: new Date(),
            });
        }

        res.status(200).json({
            success: true,
            message: 'Hoàn thành phiếu khám thành công',
            data: {
                examination: completedExamination,
            },
        });
    } catch (error) {
        console.error('Lỗi hoàn thành phiếu khám:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message,
        });
    }
};

// Lấy lịch sử khám của bệnh nhân
export const getPatientExaminationHistory = async (req, res) => {
    try {
        const { patientId } = req.params;
        const { page = 1, limit = 10 } = req.query;

        // Kiểm tra bệnh nhân có tồn tại không
        const patient = await Patient.findOne({
            _id: patientId,
            isActive: true,
        });

        if (!patient) {
            return res.status(404).json({
                success: false,
                message: 'Bệnh nhân không tồn tại',
            });
        }

        // Tính toán phân trang
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        // Lấy lịch sử khám
        const examinations = await Examination.find({ patient: patientId })
            .populate([
                { path: 'doctor', select: 'username fullName' },
                {
                    path: 'appointment',
                    select: 'appointmentCode appointmentDate timeSlot',
                },
            ])
            .select('-__v')
            .sort({ examinationDate: -1 })
            .skip(skip)
            .limit(limitNum);

        // Đếm tổng số
        const total = await Examination.countDocuments({ patient: patientId });

        // Tính toán thông tin phân trang
        const totalPages = Math.ceil(total / limitNum);
        const hasNextPage = pageNum < totalPages;
        const hasPrevPage = pageNum > 1;

        res.status(200).json({
            success: true,
            message: 'Lấy lịch sử khám của bệnh nhân thành công',
            data: {
                patient: {
                    _id: patient._id,
                    patientCode: patient.patientCode,
                    fullName: patient.fullName,
                    phone: patient.phone,
                    dateOfBirth: patient.dateOfBirth,
                    gender: patient.gender,
                },
                examinations,
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
        console.error('Lỗi lấy lịch sử khám:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message,
        });
    }
};

// Lấy danh sách phiếu khám
export const getExaminations = async (req, res) => {
    try {
        const {
            patient,
            doctor,
            status,
            examinationDateFrom,
            examinationDateTo,
            page = 1,
            limit = 10,
            sortBy = 'examinationDate',
            sortOrder = 'desc',
        } = req.query;

        // Xây dựng truy vấn lọc
        let query = {};

        if (patient) {
            query.patient = patient;
        }
        if (doctor) {
            query.doctor = doctor;
        }
        if (status) {
            query.status = status;
        }

        // Lọc theo ngày khám
        if (examinationDateFrom || examinationDateTo) {
            const dateQuery = {};
            if (examinationDateFrom) {
                dateQuery.$gte = new Date(examinationDateFrom);
            }
            if (examinationDateTo) {
                const toDate = new Date(examinationDateTo);
                toDate.setHours(23, 59, 59, 999);
                dateQuery.$lte = toDate;
            }
            query.examinationDate = dateQuery;
        }

        // Tính toán phân trang
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        // Xây dựng đối tượng sắp xếp
        const sortObj = {};
        sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1;

        // Thực hiện truy vấn
        const examinations = await Examination.find(query)
            .populate([
                {
                    path: 'patient',
                    select: 'patientCode fullName phone',
                },
                { path: 'doctor', select: 'username fullName' },
                {
                    path: 'appointment',
                    select: 'appointmentCode appointmentDate',
                },
            ])
            .select('-__v')
            .sort(sortObj)
            .skip(skip)
            .limit(limitNum);

        // Đếm tổng số
        const total = await Examination.countDocuments(query);

        // Tính toán thông tin phân trang
        const totalPages = Math.ceil(total / limitNum);
        const hasNextPage = pageNum < totalPages;
        const hasPrevPage = pageNum > 1;

        res.status(200).json({
            success: true,
            message: 'Lấy danh sách phiếu khám thành công',
            data: {
                examinations,
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
        console.error('Lỗi lấy danh sách phiếu khám:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message,
        });
    }
};
