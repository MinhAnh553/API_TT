import Joi from 'joi';
import Patient from '../../models/patientModel.js';

// Validation schemas for kiosk
const kioskRegisterSchema = Joi.object({
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
    address: Joi.object({
        street: Joi.string().trim().optional(),
        ward: Joi.string().trim().optional(),
        district: Joi.string().trim().optional(),
        city: Joi.string().trim().optional(),
        province: Joi.string().trim().optional(),
    }).optional(),
});

const kioskUpdateSchema = Joi.object({
    phone: Joi.string()
        .pattern(/^[0-9+\-\s()]+$/)
        .optional()
        .messages({
            'string.pattern.base': 'Please enter a valid phone number',
        }),
    address: Joi.object({
        street: Joi.string().trim().optional().allow(''),
        ward: Joi.string().trim().optional().allow(''),
        district: Joi.string().trim().optional().allow(''),
        city: Joi.string().trim().optional().allow(''),
        province: Joi.string().trim().optional().allow(''),
    }).optional(),
});

const patientLookupSchema = Joi.object({
    identifier: Joi.string().required().messages({
        'any.required': 'Patient identifier is required',
    }),
});

// Patient check-in for appointment
export const patientCheckIn = async (req, res) => {
    try {
        const { error, value } = patientLookupSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: error.details.map((detail) => detail.message),
            });
        }

        const { identifier } = value;

        // Find patient by patient code or phone number
        const patient = await Patient.findOne({
            $or: [
                { patientCode: identifier.toUpperCase() },
                { phone: identifier },
                { qrCode: identifier },
            ],
            isActive: true,
        });

        if (!patient) {
            return res.status(404).json({
                success: false,
                message:
                    'Patient not found. Please check your information or register as a new patient.',
            });
        }

        // Check if patient has appointments today
        const Appointment = (await import('../../models/appointmentModel.js'))
            .default;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const todayAppointments = await Appointment.find({
            patient: patient._id,
            appointmentDate: {
                $gte: today,
                $lt: tomorrow,
            },
            status: { $in: ['scheduled', 'confirmed'] },
        }).populate('doctor', 'username fullName');

        res.status(200).json({
            success: true,
            message: 'Patient found successfully',
            data: {
                patient: {
                    _id: patient._id,
                    patientCode: patient.patientCode,
                    fullName: patient.fullName,
                    dateOfBirth: patient.dateOfBirth,
                    gender: patient.gender,
                    phone: patient.phone,
                    qrCode: patient.qrCode,
                },
                todayAppointments,
                checkInNumber:
                    todayAppointments.length > 0
                        ? todayAppointments.length
                        : null,
            },
        });
    } catch (error) {
        console.error('Patient check-in error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message,
        });
    }
};

// Register new patient from kiosk
export const kioskRegisterPatient = async (req, res) => {
    try {
        const { error, value } = kioskRegisterSchema.validate(req.body);
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
                message:
                    'Phone number already exists. Please use the check-in function instead.',
                data: {
                    existingPatient: {
                        patientCode: existingPatient.patientCode,
                        fullName: existingPatient.fullName,
                    },
                },
            });
        }

        // Create new patient
        const patient = new Patient({
            ...value,
            source: 'kiosk',
        });

        await patient.save();

        res.status(201).json({
            success: true,
            message: 'Patient registered successfully',
            data: {
                patient: {
                    _id: patient._id,
                    patientCode: patient.patientCode,
                    fullName: patient.fullName,
                    dateOfBirth: patient.dateOfBirth,
                    gender: patient.gender,
                    phone: patient.phone,
                    qrCode: patient.qrCode,
                },
                registrationNumber: Date.now().toString().slice(-6), // Simple queue number
            },
        });
    } catch (error) {
        console.error('Kiosk register patient error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message,
        });
    }
};

// Update patient basic info from kiosk
export const kioskUpdatePatient = async (req, res) => {
    try {
        const { patientId } = req.params;

        const { error, value } = kioskUpdateSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: error.details.map((detail) => detail.message),
            });
        }

        const patient = await Patient.findOne({
            $or: [{ _id: patientId }, { patientCode: patientId.toUpperCase() }],
            isActive: true,
        });

        if (!patient) {
            return res.status(404).json({
                success: false,
                message: 'Patient not found',
            });
        }

        // Update patient
        const updatedPatient = await Patient.findByIdAndUpdate(
            patient._id,
            value,
            { new: true, runValidators: true },
        );

        res.status(200).json({
            success: true,
            message: 'Patient information updated successfully',
            data: {
                patient: {
                    _id: updatedPatient._id,
                    patientCode: updatedPatient.patientCode,
                    fullName: updatedPatient.fullName,
                    phone: updatedPatient.phone,
                    address: updatedPatient.address,
                },
            },
        });
    } catch (error) {
        console.error('Kiosk update patient error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message,
        });
    }
};

// Get patient visit history (limited for kiosk)
export const getPatientVisitHistory = async (req, res) => {
    try {
        const { patientId } = req.params;
        const { phone } = req.body; // For OTP verification

        const patient = await Patient.findOne({
            $or: [{ _id: patientId }, { patientCode: patientId.toUpperCase() }],
            isActive: true,
        });

        if (!patient) {
            return res.status(404).json({
                success: false,
                message: 'Patient not found',
            });
        }

        // Verify phone number (simple verification for kiosk)
        if (phone && phone !== patient.phone) {
            return res.status(401).json({
                success: false,
                message: 'Phone number verification failed',
            });
        }

        const Examination = (await import('../../models/examinationModel.js'))
            .default;

        // Get last 5 examinations
        const recentExaminations = await Examination.find({
            patient: patient._id,
        })
            .populate('doctor', 'username fullName')
            .sort({ examinationDate: -1 })
            .limit(5)
            .select(
                'examinationDate examinationCode diagnosis.primary reasonForVisit status',
            );

        res.status(200).json({
            success: true,
            message: 'Visit history retrieved successfully',
            data: {
                patient: {
                    patientCode: patient.patientCode,
                    fullName: patient.fullName,
                },
                recentExaminations,
                totalVisits: await Examination.countDocuments({
                    patient: patient._id,
                }),
            },
        });
    } catch (error) {
        console.error('Get patient visit history error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message,
        });
    }
};

// Get patient prescription history
export const getPatientPrescriptionHistory = async (req, res) => {
    try {
        const { patientId } = req.params;
        const { phone } = req.body;

        const patient = await Patient.findOne({
            $or: [{ _id: patientId }, { patientCode: patientId.toUpperCase() }],
            isActive: true,
        });

        if (!patient) {
            return res.status(404).json({
                success: false,
                message: 'Patient not found',
            });
        }

        // Verify phone number
        if (phone && phone !== patient.phone) {
            return res.status(401).json({
                success: false,
                message: 'Phone number verification failed',
            });
        }

        const Examination = (await import('../../models/examinationModel.js'))
            .default;

        // Get recent prescriptions
        const recentPrescriptions = await Examination.find({
            patient: patient._id,
            'prescriptions.0': { $exists: true },
        })
            .populate('doctor', 'username fullName')
            .populate(
                'prescriptions.medicine',
                'name activeIngredient strength dosageForm',
            )
            .sort({ examinationDate: -1 })
            .limit(3)
            .select('examinationDate examinationCode prescriptions');

        res.status(200).json({
            success: true,
            message: 'Prescription history retrieved successfully',
            data: {
                patient: {
                    patientCode: patient.patientCode,
                    fullName: patient.fullName,
                },
                recentPrescriptions,
            },
        });
    } catch (error) {
        console.error('Get patient prescription history error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message,
        });
    }
};
