import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const userSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: [true, 'Username is required'],
            unique: true,
            trim: true,
            minlength: [3, 'Username must be at least 3 characters long'],
            maxlength: [30, 'Username cannot exceed 30 characters'],
        },
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            lowercase: true,
            trim: true,
            match: [
                /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
                'Please enter a valid email',
            ],
        },
        password: {
            type: String,
            required: [true, 'Password is required'],
            minlength: [6, 'Password must be at least 6 characters long'],
        },
        fullName: {
            type: String,
            required: [true, 'Full name is required'],
            trim: true,
            maxlength: [100, 'Full name cannot exceed 100 characters'],
        },
        phone: {
            type: String,
            trim: true,
            match: [/^[0-9+\-\s()]+$/, 'Please enter a valid phone number'],
        },
        role: {
            type: String,
            enum: ['user', 'admin', 'doctor', 'receptionist', 'nurse'],
            default: 'user',
        },
        // Thông tin bác sĩ (chỉ áp dụng khi role = 'doctor')
        doctorInfo: {
            licenseNumber: {
                type: String,
                trim: true,
            },
            department: {
                type: String,
                trim: true,
            },
            specialization: {
                type: String,
                trim: true,
            },
            experience: {
                type: Number,
                min: 0,
            },
            education: {
                type: String,
                trim: true,
            },
            bio: {
                type: String,
                trim: true,
            },
            consultationFee: {
                type: Number,
                min: 0,
            },
            isAvailable: {
                type: Boolean,
                default: true,
            },
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        avatar: {
            type: String,
            default: null,
        },
    },
    {
        timestamps: true,
    },
);

// Hash password before saving
userSchema.pre('save', async function (next) {
    // Only hash the password if it has been modified (or is new)
    if (!this.isModified('password')) return next();

    try {
        // Hash password with cost of 12
        const salt = await bcrypt.genSalt(12);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Remove password from JSON output
userSchema.methods.toJSON = function () {
    const userObject = this.toObject();
    delete userObject.password;
    return userObject;
};

// Index để tối ưu truy vấn
userSchema.index({ role: 1 });
userSchema.index({ 'doctorInfo.department': 1 });
userSchema.index({ 'doctorInfo.specialization': 1 });
userSchema.index({ 'doctorInfo.isAvailable': 1 });

// Virtual để kiểm tra có phải bác sĩ không
userSchema.virtual('isDoctor').get(function () {
    return this.role === 'doctor';
});

// Virtual để lấy thông tin bác sĩ
userSchema.virtual('doctorProfile').get(function () {
    if (this.role === 'doctor') {
        return {
            licenseNumber: this.doctorInfo?.licenseNumber,
            department: this.doctorInfo?.department,
            specialization: this.doctorInfo?.specialization,
            experience: this.doctorInfo?.experience,
            education: this.doctorInfo?.education,
            bio: this.doctorInfo?.bio,
            consultationFee: this.doctorInfo?.consultationFee,
            isAvailable: this.doctorInfo?.isAvailable,
        };
    }
    return null;
});

const User = mongoose.model('User', userSchema);

export default User;
