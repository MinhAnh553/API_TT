import Joi from 'joi';
import Patient from '../../models/patientModel.js';
import User from '../../models/userModel.js';

// Validation schemas
const createPatientSchema = Joi.object({
    fullName: Joi.string().max(100).required().messages({
        'string.max': 'Full name cannot exceed 100 characters',
        'any.required': 'Full name is required',
    }),
    dateOfBirth: Joi.date().required().messages({
        'any.required': 'Date of birth is required',
    }),
    gender: Joi.string().valid('male', 'female', 'other').required().messages({
        'any.only': 'Gender must be male, female, or other',
        'any.required': 'Gender is required',
    }),
    phone: Joi.string()
        .pattern(/^[0-9+\-\s()]+$/)
        .required()
        .messages({
            'string.pattern.base': 'Please enter a valid phone number',
            'any.required': 'Phone number is required',
        }),
    email: Joi.string().email().optional().messages({
        'string.email': 'Please enter a valid email',
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
    emergencyContact: Joi.object({
        name: Joi.string().trim().optional(),
        phone: Joi.string().trim().optional(),
        relationship: Joi.string().trim().optional(),
    }).optional(),
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
        .optional()
        .messages({
            'string.pattern.base': 'Please enter a valid phone number',
        }),
    email: Joi.string().email().optional().allow('').messages({
        'string.email': 'Please enter a valid email',
    }),
    address: Joi.object({
        street: Joi.string().trim().optional().allow(''),
        ward: Joi.string().trim().optional().allow(''),
        district: Joi.string().trim().optional().allow(''),
        city: Joi.string().trim().optional().allow(''),
        province: Joi.string().trim().optional().allow(''),
    }).optional(),
    idNumber: Joi.string().trim().optional().allow(''),
    insuranceNumber: Joi.string().trim().optional().allow(''),
    emergencyContact: Joi.object({
        name: Joi.string().trim().optional().allow(''),
        phone: Joi.string().trim().optional().allow(''),
        relationship: Joi.string().trim().optional().allow(''),
    }).optional(),
    medicalHistory: Joi.object({
        allergies: Joi.array().items(Joi.string().trim()).optional(),
        chronicDiseases: Joi.array().items(Joi.string().trim()).optional(),
        currentMedications: Joi.array().items(Joi.string().trim()).optional(),
        notes: Joi.string().trim().optional().allow(''),
    }).optional(),
});

// Create new patient
export const createPatient = async (req, res) => {
    try {
        // Validate request body
        const { error, value } = createPatientSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
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
                message: 'Phone number already exists',
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
                    message: 'ID number already exists',
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
            message: 'Patient created successfully',
            data: {
                patient,
            },
        });
    } catch (error) {
        console.error('Create patient error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message,
        });
    }
};

// Get all patients with pagination and search
export const getPatients = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            search,
            gender,
            ageMin,
            ageMax,
            sortBy = 'createdAt',
            sortOrder = 'desc',
        } = req.query;

        // Build query
        let query = { isActive: true };

        // Search functionality
        if (search) {
            query.$or = [
                { fullName: { $regex: search, $options: 'i' } },
                { patientCode: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } },
                { idNumber: { $regex: search, $options: 'i' } },
                { insuranceNumber: { $regex: search, $options: 'i' } },
            ];
        }

        // Gender filter
        if (gender) {
            query.gender = gender;
        }

        // Age filters
        if (ageMin || ageMax) {
            const today = new Date();
            if (ageMax) {
                const minBirthDate = new Date(
                    today.getFullYear() - ageMax - 1,
                    today.getMonth(),
                    today.getDate(),
                );
                query.dateOfBirth = { $gte: minBirthDate };
            }
            if (ageMin) {
                const maxBirthDate = new Date(
                    today.getFullYear() - ageMin,
                    today.getMonth(),
                    today.getDate(),
                );
                query.dateOfBirth = {
                    ...query.dateOfBirth,
                    $lte: maxBirthDate,
                };
            }
        }

        // Sort options
        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

        // Execute query with pagination
        const patients = await Patient.find(query)
            .populate('registeredBy', 'username fullName')
            .sort(sortOptions)
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Patient.countDocuments(query);

        res.status(200).json({
            success: true,
            data: {
                patients,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / limit),
                    totalPatients: total,
                    hasNextPage: page < Math.ceil(total / limit),
                    hasPrevPage: page > 1,
                },
            },
        });
    } catch (error) {
        console.error('Get patients error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message,
        });
    }
};

// Get patient by ID
export const getPatientById = async (req, res) => {
    try {
        const { id } = req.params;

        const patient = await Patient.findOne({
            $or: [{ _id: id }, { patientCode: id.toUpperCase() }],
            isActive: true,
        }).populate('registeredBy', 'username fullName');

        if (!patient) {
            return res.status(404).json({
                success: false,
                message: 'Patient not found',
            });
        }

        res.status(200).json({
            success: true,
            data: {
                patient,
            },
        });
    } catch (error) {
        console.error('Get patient by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
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
                message: 'Validation error',
                errors: error.details.map((detail) => detail.message),
            });
        }

        // Find patient
        const patient = await Patient.findOne({
            $or: [{ _id: id }, { patientCode: id.toUpperCase() }],
            isActive: true,
        });

        if (!patient) {
            return res.status(404).json({
                success: false,
                message: 'Patient not found',
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
                    message: 'Phone number already exists',
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
                    message: 'ID number already exists',
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
            message: 'Patient updated successfully',
            data: {
                patient: updatedPatient,
            },
        });
    } catch (error) {
        console.error('Update patient error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message,
        });
    }
};

// Soft delete patient
export const deletePatient = async (req, res) => {
    try {
        const { id } = req.params;

        const patient = await Patient.findOne({
            $or: [{ _id: id }, { patientCode: id.toUpperCase() }],
            isActive: true,
        });

        if (!patient) {
            return res.status(404).json({
                success: false,
                message: 'Patient not found',
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
                message: 'Cannot delete patient with existing medical records',
            });
        }

        // Soft delete
        await Patient.findByIdAndUpdate(patient._id, { isActive: false });

        res.status(200).json({
            success: true,
            message: 'Patient deleted successfully',
        });
    } catch (error) {
        console.error('Delete patient error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
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
            $or: [{ _id: id }, { patientCode: id.toUpperCase() }],
            isActive: true,
        });

        if (!patient) {
            return res.status(404).json({
                success: false,
                message: 'Patient not found',
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
        console.error('Get patient medical history error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message,
        });
    }
};
