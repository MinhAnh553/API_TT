import mongoose from 'mongoose';

const patientSchema = new mongoose.Schema(
    {
        patientCode: {
            type: String,
            unique: true,
            uppercase: true,
        },
        fullName: {
            type: String,
            required: [true, 'Full name is required'],
            trim: true,
            maxlength: [100, 'Full name cannot exceed 100 characters'],
        },
        dateOfBirth: {
            type: Date,
            required: [true, 'Date of birth is required'],
        },
        gender: {
            type: String,
            enum: ['male', 'female', 'other'],
            required: [true, 'Gender is required'],
        },
        phone: {
            type: String,
            required: [true, 'Phone number is required'],
            unique: true,
            trim: true,
            match: [/^[0-9+\-\s()]+$/, 'Please enter a valid phone number'],
        },
        email: {
            type: String,
            trim: true,
            lowercase: true,
            match: [
                /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
                'Please enter a valid email',
            ],
        },
        address: {
            street: { type: String, trim: true },
            ward: { type: String, trim: true },
            district: { type: String, trim: true },
            city: { type: String, trim: true },
            province: { type: String, trim: true },
        },
        idNumber: {
            type: String,
            unique: true,
            sparse: true, // Allow null values but ensure uniqueness when present
            trim: true,
        },
        insuranceNumber: {
            type: String,
            trim: true,
            sparse: true,
        },
        emergencyContact: {
            name: { type: String, trim: true },
            phone: { type: String, trim: true },
            relationship: { type: String, trim: true },
        },
        medicalHistory: {
            allergies: [{ type: String, trim: true }],
            chronicDiseases: [{ type: String, trim: true }],
            currentMedications: [{ type: String, trim: true }],
            notes: { type: String, trim: true },
        },
        qrCode: {
            type: String,
            unique: true,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        registeredBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        lastVisitDate: {
            type: Date,
        },
    },
    {
        timestamps: true,
    },
);

// Generate patient code before saving
patientSchema.pre('save', async function (next) {
    if (this.isNew) {
        try {
            const count = await mongoose.model('Patient').countDocuments();
            this.patientCode = `BN${String(count + 1).padStart(6, '0')}`;

            // Generate QR code (simple implementation)
            this.qrCode = `QR_${this.patientCode}_${Date.now()}`;
        } catch (error) {
            next(error);
        }
    }
    next();
});

// Virtual for age calculation
patientSchema.virtual('age').get(function () {
    if (!this.dateOfBirth) return null;
    const today = new Date();
    const birthDate = new Date(this.dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
        monthDiff < 0 ||
        (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
        age--;
    }

    return age;
});

// Index for better search performance
patientSchema.index({ patientCode: 1 });
patientSchema.index({ fullName: 'text', phone: 'text', idNumber: 'text' });
patientSchema.index({ isActive: 1 });

const Patient = mongoose.model('Patient', patientSchema);

export default Patient;
