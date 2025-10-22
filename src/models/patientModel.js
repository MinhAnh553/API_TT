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
            required: [true, 'Họ tên là bắt buộc'],
            trim: true,
            maxlength: [100, 'Họ tên không được vượt quá 100 ký tự'],
        },
        dateOfBirth: {
            type: Date,
            required: [true, 'Ngày sinh là bắt buộc'],
        },
        gender: {
            type: String,
            enum: ['male', 'female', 'other'],
            required: [true, 'Giới tính là bắt buộc'],
        },
        phone: {
            type: String,
            required: [true, 'Số điện thoại là bắt buộc'],
            unique: true,
            trim: true,
            match: [/^[0-9+\-\s()]+$/, 'Vui lòng nhập số điện thoại hợp lệ'],
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
            sparse: true,
            trim: true,
        },
        insuranceNumber: {
            type: String,
            trim: true,
            sparse: true,
        },
        // Thông tin y tế đơn giản (thay vì object phức tạp)
        allergies: {
            type: String,
            trim: true,
            default: '',
        },
        chronicDiseases: {
            type: String,
            trim: true,
            default: '',
        },
        currentMedications: {
            type: String,
            trim: true,
            default: '',
        },
        medicalNotes: {
            type: String,
            trim: true,
            default: '',
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
