import Joi from 'joi';
import Examination from '../../models/examinationModel.js';
import Patient from '../../models/patientModel.js';
import User from '../../models/userModel.js';

// Validation schemas
const createExaminationSchema = Joi.object({
    patient: Joi.string().required().messages({
        'any.required': 'Mã bệnh nhân là bắt buộc',
    }),
    reasonForVisit: Joi.string().required().messages({
        'any.required': 'Lý do khám là bắt buộc',
    }),
    symptoms: Joi.string().optional(),
    diagnosis: Joi.string().required().messages({
        'any.required': 'Mô tả chẩn đoán là bắt buộc',
    }),
    treatment: Joi.optional(),
    notes: Joi.string().trim().optional(),
});

const updateExaminationSchema = Joi.object({
    reasonForVisit: Joi.string().optional(),
    symptoms: Joi.string().optional().allow(''),
    diagnosis: Joi.string().optional(),
    treatment: Joi.optional(),
    notes: Joi.string().trim().optional(),
    status: Joi.string()
        .valid('in_progress', 'completed', 'cancelled')
        .optional(),
});

// Tạo hồ sơ bệnh án ban đầu cho bệnh nhân
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

        // Tạo hồ sơ khám bệnh mới
        const examination = new Examination({
            ...value,
            examinationCode: `${patient.patientCode}-${
                new Date().toISOString().split('T')[0]
            }`,
            doctor: req.user.userId,
            examinationDate: new Date(),
            status: 'in_progress',
        });

        await examination.save();

        // Populate thông tin bệnh nhân và bác sĩ
        await examination.populate([
            {
                path: 'patient',
                select: 'patientCode fullName dateOfBirth gender phone',
            },
            { path: 'doctor', select: 'username fullName' },
        ]);

        // Cập nhật ngày khám cuối cùng của bệnh nhân
        await Patient.findByIdAndUpdate(patient._id, {
            lastVisitDate: new Date(),
        });

        res.status(201).json({
            success: true,
            message: 'Tạo hồ sơ bệnh án thành công',
            data: {
                examination,
            },
        });
    } catch (error) {
        console.error('Lỗi tạo hồ sơ bệnh án:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message,
        });
    }
};

// Cập nhật hồ sơ bệnh án
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

        // Tìm hồ sơ khám bệnh
        const examination = await Examination.findOne({
            _id: id,
            doctor: req.user.userId, // Chỉ bác sĩ tạo mới có thể cập nhật
        });

        if (!examination) {
            return res.status(404).json({
                success: false,
                message:
                    'Hồ sơ khám bệnh không tồn tại hoặc bạn không có quyền cập nhật',
            });
        }

        // Cập nhật hồ sơ
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
        ]);

        res.status(200).json({
            success: true,
            message: 'Cập nhật hồ sơ bệnh án thành công',
            data: {
                examination: updatedExamination,
            },
        });
    } catch (error) {
        console.error('Lỗi cập nhật hồ sơ bệnh án:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message,
        });
    }
};

// Xem chi tiết hồ sơ bệnh án
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
        ]);

        if (!examination) {
            return res.status(404).json({
                success: false,
                message: 'Hồ sơ khám bệnh không tồn tại',
            });
        }

        res.status(200).json({
            success: true,
            message: 'Lấy thông tin hồ sơ khám bệnh thành công',
            data: {
                examination,
            },
        });
    } catch (error) {
        console.error('Lỗi lấy thông tin hồ sơ khám bệnh:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message,
        });
    }
};

// Xem lịch sử các lần khám của bệnh nhân
export const getPatientExaminationHistory = async (req, res) => {
    try {
        const { patientId } = req.params;
        const {
            page = 1,
            limit = 10,
            sortBy = 'examinationDate',
            sortOrder = 'desc',
        } = req.query;

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

        // Xây dựng đối tượng sắp xếp
        const sortObj = {};
        sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1;

        // Lấy lịch sử khám bệnh
        const examinations = await Examination.find({
            patient: patientId,
        })
            .populate([
                {
                    path: 'patient',
                    select: 'patientCode fullName dateOfBirth gender phone',
                },
                { path: 'doctor', select: 'username fullName' },
            ])
            .select('-__v')
            .sort(sortObj)
            .skip(skip)
            .limit(limitNum);

        // Đếm tổng số
        const total = await Examination.countDocuments({
            patient: patientId,
        });

        // Tính toán thông tin phân trang
        const totalPages = Math.ceil(total / limitNum);
        const hasNextPage = pageNum < totalPages;
        const hasPrevPage = pageNum > 1;

        res.status(200).json({
            success: true,
            message: 'Lấy lịch sử khám bệnh thành công',
            data: {
                patient: {
                    _id: patient._id,
                    patientCode: patient.patientCode,
                    fullName: patient.fullName,
                    dateOfBirth: patient.dateOfBirth,
                    gender: patient.gender,
                    phone: patient.phone,
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
                statistics: {
                    totalExaminations: total,
                    lastVisitDate: patient.lastVisitDate,
                    firstVisitDate:
                        examinations.length > 0
                            ? examinations[examinations.length - 1]
                                  .examinationDate
                            : null,
                },
            },
        });
    } catch (error) {
        console.error('Lỗi lấy lịch sử khám bệnh:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message,
        });
    }
};

// Lấy danh sách hồ sơ khám bệnh với bộ lọc
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
                    select: 'patientCode fullName dateOfBirth gender phone',
                },
                { path: 'doctor', select: 'username fullName' },
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
            message: 'Lấy danh sách hồ sơ khám bệnh thành công',
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
        console.error('Lỗi lấy danh sách hồ sơ khám bệnh:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message,
        });
    }
};

// Hoàn thành hồ sơ khám bệnh
export const completeExamination = async (req, res) => {
    try {
        const { id } = req.params;

        const examination = await Examination.findOne({
            _id: id,
            doctor: req.user.userId,
            status: 'in_progress',
        });

        if (!examination) {
            return res.status(404).json({
                success: false,
                message: 'Hồ sơ khám bệnh không tồn tại hoặc đã hoàn thành',
            });
        }

        // Kiểm tra các thông tin bắt buộc để hoàn thành
        if (!examination.diagnosis) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng thêm chẩn đoán trước khi hoàn thành hồ sơ',
            });
        }

        // Cập nhật trạng thái hoàn thành
        const completedExamination = await Examination.findByIdAndUpdate(
            examination._id,
            { status: 'completed' },
            { new: true },
        ).populate([
            {
                path: 'patient',
                select: 'patientCode fullName dateOfBirth gender phone',
            },
            { path: 'doctor', select: 'username fullName' },
        ]);

        res.status(200).json({
            success: true,
            message: 'Hoàn thành hồ sơ khám bệnh thành công',
            data: {
                examination: completedExamination,
            },
        });
    } catch (error) {
        console.error('Lỗi hoàn thành hồ sơ khám bệnh:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message,
        });
    }
};

// Hủy hồ sơ khám bệnh
export const cancelExamination = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        const examination = await Examination.findOne({
            _id: id,
            doctor: req.user.userId,
            status: 'in_progress',
        });

        if (!examination) {
            return res.status(404).json({
                success: false,
                message: 'Hồ sơ khám bệnh không tồn tại hoặc không thể hủy',
            });
        }

        // Cập nhật trạng thái hủy
        const cancelledExamination = await Examination.findByIdAndUpdate(
            examination._id,
            {
                status: 'cancelled',
                notes: reason
                    ? `${examination.notes || ''}\nLý do hủy: ${reason}`.trim()
                    : examination.notes,
            },
            { new: true },
        ).populate([
            {
                path: 'patient',
                select: 'patientCode fullName dateOfBirth gender phone',
            },
            { path: 'doctor', select: 'username fullName' },
        ]);

        res.status(200).json({
            success: true,
            message: 'Hủy hồ sơ khám bệnh thành công',
            data: {
                examination: cancelledExamination,
            },
        });
    } catch (error) {
        console.error('Lỗi hủy hồ sơ khám bệnh:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message,
        });
    }
};
