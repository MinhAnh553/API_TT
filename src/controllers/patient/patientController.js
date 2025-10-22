import Joi from 'joi';
import Patient from '../../models/patientModel.js';
import User from '../../models/userModel.js';
import Examination from '../../models/examinationModel.js';
import Appointment from '../../models/appointmentModel.js';

// Validation schemas
const createPatientSchema = Joi.object({
    fullName: Joi.string().max(100).required().messages({
        'string.max': 'Họ tên không được vượt quá 100 ký tự',
        'any.required': 'Họ tên là bắt buộc',
    }),
    dateOfBirth: Joi.date().required().messages({
        'any.required': 'Ngày sinh là bắt buộc',
    }),
    gender: Joi.string().valid('male', 'female', 'other').required().messages({
        'any.only': 'Giới tính phải là nam, nữ hoặc khác',
        'any.required': 'Giới tính là bắt buộc',
    }),
    phone: Joi.string()
        .pattern(/^[0-9+\-\s()]+$/)
        .required()
        .messages({
            'string.pattern.base': 'Vui lòng nhập số điện thoại hợp lệ',
            'any.required': 'Số điện thoại là bắt buộc',
        }),
    address: Joi.object({
        street: Joi.string().trim().optional(),
        ward: Joi.string().trim().optional(),
        district: Joi.string().trim().optional(),
        city: Joi.string().trim().optional(),
        province: Joi.string().trim().optional(),
    }).optional(),
    idNumber: Joi.string().trim().optional(),
    insuranceNumber: Joi.string().trim().optional(),
    medicalHistory: Joi.object({
        allergies: Joi.array().items(Joi.string().trim()).optional(),
        chronicDiseases: Joi.array().items(Joi.string().trim()).optional(),
        currentMedications: Joi.array().items(Joi.string().trim()).optional(),
        notes: Joi.string().trim().optional(),
    }).optional(),
});

const updatePatientSchema = Joi.object({
    fullName: Joi.string().max(100).optional(),
    dateOfBirth: Joi.date().optional(),
    gender: Joi.string().valid('male', 'female', 'other').optional(),
    phone: Joi.string()
        .pattern(/^[0-9+\-\s()]+$/)
        .trim()
        .optional()
        .allow(''),
    address: Joi.object({
        street: Joi.string().trim().optional().allow(''),
        ward: Joi.string().trim().optional(),
        district: Joi.string().trim().optional(),
        city: Joi.string().trim().optional(),
        province: Joi.string().trim().optional(),
    }).optional(),
    idNumber: Joi.string().trim().optional().allow(''),
    insuranceNumber: Joi.string().trim().optional().allow(''),
    medicalHistory: Joi.object({
        allergies: Joi.array().items(Joi.string().trim()).optional(),
        chronicDiseases: Joi.array().items(Joi.string().trim()).optional(),
        currentMedications: Joi.array().items(Joi.string().trim()).optional(),
        notes: Joi.string().trim().optional().allow(''),
    }).optional(),
});

// Search parameters validation schema
const searchPatientSchema = Joi.object({
    search: Joi.string().trim().optional(),
    patientCode: Joi.string().trim().optional(),
    fullName: Joi.string().trim().optional(),
    phone: Joi.string().trim().optional(),
    idNumber: Joi.string().trim().optional(),
    insuranceNumber: Joi.string().trim().optional(),
    gender: Joi.string().valid('male', 'female', 'other').optional(),
    minAge: Joi.number().integer().min(0).max(150).optional(),
    maxAge: Joi.number().integer().min(0).max(150).optional(),
    registrationDateFrom: Joi.date().optional(),
    registrationDateTo: Joi.date().optional(),
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).max(100).optional(),
    sortBy: Joi.string()
        .valid('createdAt', 'fullName', 'patientCode', 'dateOfBirth')
        .optional(),
    sortOrder: Joi.string().valid('asc', 'desc').optional(),
}).custom((value, helpers) => {
    // Validate age range
    if (value.minAge && value.maxAge && value.minAge > value.maxAge) {
        return helpers.error('any.custom', {
            message: 'Tuổi tối thiểu không được lớn hơn tuổi tối đa',
        });
    }

    // Validate date range
    if (
        value.registrationDateFrom &&
        value.registrationDateTo &&
        value.registrationDateFrom > value.registrationDateTo
    ) {
        return helpers.error('any.custom', {
            message: 'Ngày bắt đầu không được lớn hơn ngày kết thúc',
        });
    }

    return value;
});

// Create new patient
export const createPatient = async (req, res) => {
    try {
        // Validate request body
        const { error, value } = createPatientSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                message: 'Định dạng không hợp lệ',
                errors: error.details.map((detail) => detail.message),
            });
        }

        // Check if phone number already exists
        const existingPatient = await Patient.findOne({
            phone: value.phone,
            isActive: true,
        });

        if (existingPatient) {
            return res.status(409).json({
                success: false,
                message: 'Số điện thoại đã tồn tại',
            });
        }

        // Check if ID number already exists (if provided)
        if (value.idNumber) {
            const existingIdNumber = await Patient.findOne({
                idNumber: value.idNumber,
                isActive: true,
            });

            if (existingIdNumber) {
                return res.status(409).json({
                    success: false,
                    message: 'CCCD đã tồn tại',
                });
            }
        }

        // Create new patient
        const patient = new Patient({
            ...value,
            registeredBy: req.user?.userId,
        });

        await patient.save();

        res.status(201).json({
            success: true,
            message: 'Bệnh nhân đã được tạo thành công',
            data: {
                patient,
            },
        });
    } catch (error) {
        console.error('Lỗi tạo bệnh nhân:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message,
        });
    }
};

// Update patient
export const updatePatient = async (req, res) => {
    try {
        const { id } = req.params;

        // Validate request body
        const { error, value } = updatePatientSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                message: 'Định dạng không hợp lệ',
                errors: error.details.map((detail) => detail.message),
            });
        }

        // Find patient
        const patient = await Patient.findOne({
            _id: id,
            isActive: true,
        });

        if (!patient) {
            return res.status(404).json({
                success: false,
                message: 'Bệnh nhân không tồn tại',
            });
        }

        // Check if phone number already exists (if being updated)
        if (value.phone && value.phone !== patient.phone) {
            const existingPatient = await Patient.findOne({
                phone: value.phone,
                isActive: true,
                _id: { $ne: patient._id },
            });

            if (existingPatient) {
                return res.status(409).json({
                    success: false,
                    message: 'Số điện thoại đã tồn tại',
                });
            }
        }

        // Check if ID number already exists (if being updated)
        if (value.idNumber && value.idNumber !== patient.idNumber) {
            const existingIdNumber = await Patient.findOne({
                idNumber: value.idNumber,
                isActive: true,
                _id: { $ne: patient._id },
            });

            if (existingIdNumber) {
                return res.status(409).json({
                    success: false,
                    message: 'CCCD đã tồn tại',
                });
            }
        }

        // Update patient
        const updatedPatient = await Patient.findByIdAndUpdate(
            patient._id,
            value,
            { new: true, runValidators: true },
        ).populate('registeredBy', 'username fullName');

        res.status(200).json({
            success: true,
            message: 'Bệnh nhân đã được cập nhật thành công',
            data: {
                patient: updatedPatient,
            },
        });
    } catch (error) {
        console.error('Lỗi cập nhật bệnh nhân:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message,
        });
    }
};

// Soft delete patient
export const deletePatient = async (req, res) => {
    try {
        const { id } = req.params;

        const patient = await Patient.findOne({
            _id: id,
            isActive: true,
        });

        if (!patient) {
            return res.status(404).json({
                success: false,
                message: 'Bệnh nhân không tồn tại',
            });
        }

        // Check if patient has any examinations
        const Examination = (await import('../../models/examinationModel.js'))
            .default;
        const hasExaminations = await Examination.findOne({
            patient: patient._id,
        });

        if (hasExaminations) {
            return res.status(400).json({
                success: false,
                message: 'Không thể xóa bệnh nhân có lịch khám',
            });
        }

        // Soft delete
        await Patient.findByIdAndUpdate(patient._id, { isActive: false });

        res.status(200).json({
            success: true,
            message: 'Bệnh nhân đã được xóa thành công',
        });
    } catch (error) {
        console.error('Lỗi xóa bệnh nhân:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message,
        });
    }
};

// Tìm kiếm & tra cứu
// Theo mã bệnh nhân, họ tên, SĐT, CMND, BHYT.
// Lọc theo tuổi, giới tính, ngày đăng ký.

// Search patients with multiple criteria
export const searchPatients = async (req, res) => {
    try {
        // Validate search parameters
        const { error, value } = searchPatientSchema.validate(req.query);
        if (error) {
            return res.status(400).json({
                success: false,
                message: 'Tham số tìm kiếm không hợp lệ',
                errors: error.details.map((detail) => detail.message),
            });
        }

        const {
            search, // General search term for patientCode, fullName, phone, idNumber, insuranceNumber
            patientCode,
            fullName,
            phone,
            idNumber,
            insuranceNumber,
            gender,
            minAge,
            maxAge,
            registrationDateFrom,
            registrationDateTo,
            page = 1,
            limit = 10,
            sortBy = 'createdAt',
            sortOrder = 'desc',
        } = value;

        // Build search query
        let query = { isActive: true };

        // General search across multiple fields
        if (search) {
            query.$or = [
                { patientCode: { $regex: search, $options: 'i' } },
                { fullName: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } },
                { idNumber: { $regex: search, $options: 'i' } },
                { insuranceNumber: { $regex: search, $options: 'i' } },
            ];
        }

        // Specific field searches
        if (patientCode) {
            query.patientCode = { $regex: patientCode, $options: 'i' };
        }
        if (fullName) {
            query.fullName = { $regex: fullName, $options: 'i' };
        }
        if (phone) {
            query.phone = { $regex: phone, $options: 'i' };
        }
        if (idNumber) {
            query.idNumber = { $regex: idNumber, $options: 'i' };
        }
        if (insuranceNumber) {
            query.insuranceNumber = { $regex: insuranceNumber, $options: 'i' };
        }

        // Gender filter
        if (gender) {
            query.gender = gender;
        }

        // Age range filter
        if (minAge || maxAge) {
            const today = new Date();
            const ageQuery = {};

            if (minAge) {
                const maxBirthDate = new Date(
                    today.getFullYear() - parseInt(minAge),
                    today.getMonth(),
                    today.getDate(),
                );
                ageQuery.$lte = maxBirthDate;
            }

            if (maxAge) {
                const minBirthDate = new Date(
                    today.getFullYear() - parseInt(maxAge) - 1,
                    today.getMonth(),
                    today.getDate(),
                );
                ageQuery.$gte = minBirthDate;
            }

            query.dateOfBirth = ageQuery;
        }

        // Registration date range filter
        if (registrationDateFrom || registrationDateTo) {
            const dateQuery = {};

            if (registrationDateFrom) {
                dateQuery.$gte = new Date(registrationDateFrom);
            }

            if (registrationDateTo) {
                const toDate = new Date(registrationDateTo);
                toDate.setHours(23, 59, 59, 999); // End of day
                dateQuery.$lte = toDate;
            }

            query.createdAt = dateQuery;
        }

        // Calculate pagination
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        // Build sort object
        const sortObj = {};
        sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1;

        // Execute search
        const patients = await Patient.find(query)
            .populate('registeredBy', 'username fullName')
            .select('-__v')
            .sort(sortObj)
            .skip(skip)
            .limit(limitNum);

        // Get total count for pagination
        const total = await Patient.countDocuments(query);

        // Calculate pagination info
        const totalPages = Math.ceil(total / limitNum);
        const hasNextPage = pageNum < totalPages;
        const hasPrevPage = pageNum > 1;

        res.status(200).json({
            success: true,
            message: 'Tìm kiếm bệnh nhân thành công',
            data: {
                patients,
                pagination: {
                    currentPage: pageNum,
                    totalPages,
                    totalItems: total,
                    itemsPerPage: limitNum,
                    hasNextPage,
                    hasPrevPage,
                },
                filters: {
                    search,
                    patientCode,
                    fullName,
                    phone,
                    idNumber,
                    insuranceNumber,
                    gender,
                    minAge,
                    maxAge,
                    registrationDateFrom,
                    registrationDateTo,
                },
            },
        });
    } catch (error) {
        console.error('Lỗi tìm kiếm bệnh nhân:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message,
        });
    }
};

// Get all patients with optional filtering
export const getPatients = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            sortBy = 'createdAt',
            sortOrder = 'desc',
            gender,
            minAge,
            maxAge,
            registrationDateFrom,
            registrationDateTo,
        } = req.query;

        // Build filter query
        let query = { isActive: true };

        // Gender filter
        if (gender) {
            query.gender = gender;
        }

        // Age range filter
        if (minAge || maxAge) {
            const today = new Date();
            const ageQuery = {};

            if (minAge) {
                const maxBirthDate = new Date(
                    today.getFullYear() - parseInt(minAge),
                    today.getMonth(),
                    today.getDate(),
                );
                ageQuery.$lte = maxBirthDate;
            }

            if (maxAge) {
                const minBirthDate = new Date(
                    today.getFullYear() - parseInt(maxAge) - 1,
                    today.getMonth(),
                    today.getDate(),
                );
                ageQuery.$gte = minBirthDate;
            }

            query.dateOfBirth = ageQuery;
        }

        // Registration date range filter
        if (registrationDateFrom || registrationDateTo) {
            const dateQuery = {};

            if (registrationDateFrom) {
                dateQuery.$gte = new Date(registrationDateFrom);
            }

            if (registrationDateTo) {
                const toDate = new Date(registrationDateTo);
                toDate.setHours(23, 59, 59, 999);
                dateQuery.$lte = toDate;
            }

            query.createdAt = dateQuery;
        }

        // Calculate pagination
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        // Build sort object
        const sortObj = {};
        sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1;

        // Execute query
        const patients = await Patient.find(query)
            .populate('registeredBy', 'username fullName')
            .select('-__v')
            .sort(sortObj)
            .skip(skip)
            .limit(limitNum);

        // Get total count
        const total = await Patient.countDocuments(query);

        // Calculate pagination info
        const totalPages = Math.ceil(total / limitNum);
        const hasNextPage = pageNum < totalPages;
        const hasPrevPage = pageNum > 1;

        res.status(200).json({
            success: true,
            message: 'Lấy danh sách bệnh nhân thành công',
            data: {
                patients,
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
        console.error('Lỗi lấy danh sách bệnh nhân:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message,
        });
    }
};

// Get patient by ID
export const getPatientById = async (req, res) => {
    try {
        const { id } = req.params;

        const patient = await Patient.findOne({
            _id: id,
            isActive: true,
        }).populate('registeredBy', 'username fullName');

        if (!patient) {
            return res.status(404).json({
                success: false,
                message: 'Bệnh nhân không tồn tại',
            });
        }

        res.status(200).json({
            success: true,
            message: 'Lấy thông tin bệnh nhân thành công',
            data: {
                patient,
            },
        });
    } catch (error) {
        console.error('Lỗi lấy thông tin bệnh nhân:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message,
        });
    }
};

// Get patient medical history
export const getPatientMedicalHistory = async (req, res) => {
    try {
        const { id } = req.params;
        const { page = 1, limit = 10 } = req.query;

        const patient = await Patient.findOne({
            _id: id,
            isActive: true,
        });

        if (!patient) {
            return res.status(404).json({
                success: false,
                message: 'Bệnh nhân không tồn tại',
            });
        }

        const Examination = (await import('../../models/examinationModel.js'))
            .default;
        const Appointment = (await import('../../models/appointmentModel.js'))
            .default;

        // Get examinations
        const examinations = await Examination.find({ patient: patient._id })
            .populate('doctor', 'username fullName')
            .sort({ examinationDate: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        // Get appointments
        const appointments = await Appointment.find({ patient: patient._id })
            .populate('doctor', 'username fullName')
            .sort({ appointmentDate: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const totalExaminations = await Examination.countDocuments({
            patient: patient._id,
        });
        const totalAppointments = await Appointment.countDocuments({
            patient: patient._id,
        });

        res.status(200).json({
            success: true,
            data: {
                patient: {
                    _id: patient._id,
                    patientCode: patient.patientCode,
                    fullName: patient.fullName,
                    dateOfBirth: patient.dateOfBirth,
                    gender: patient.gender,
                    phone: patient.phone,
                    medicalHistory: patient.medicalHistory,
                },
                examinations,
                appointments,
                statistics: {
                    totalExaminations,
                    totalAppointments,
                    lastVisitDate: patient.lastVisitDate,
                },
            },
        });
    } catch (error) {
        console.error('Lỗi lấy lịch sử khám bệnh nhân:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message,
        });
    }
};
