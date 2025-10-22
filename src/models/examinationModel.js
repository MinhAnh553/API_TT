import mongoose from 'mongoose';

const examinationSchema = new mongoose.Schema(
    {
        examinationCode: {
            type: String,
            unique: true,
            required: true,
        },
        patient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Patient',
            required: [true, 'Mã bệnh nhân là bắt buộc'],
        },
        appointment: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Appointment',
            default: null, // Có thể tạo examination mà không có appointment
        },
        doctor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Bác sĩ khám là bắt buộc'],
        },
        examinationDate: {
            type: Date,
            default: Date.now,
        },
        // Thông tin khám bệnh đơn giản
        reasonForVisit: {
            type: String,
            required: [true, 'Lý do khám là bắt buộc'],
            trim: true,
        },
        symptoms: {
            type: String,
            trim: true,
            default: '',
        },
        diagnosis: {
            type: String,
            required: [true, 'Chẩn đoán là bắt buộc'],
            trim: true,
        },
        treatment: {
            type: String,
            trim: true,
            default: '',
        },
        followUpDate: {
            type: Date,
        },
        followUpInstructions: {
            type: String,
            trim: true,
            default: '',
        },
        notes: {
            type: String,
            trim: true,
            default: '',
        },
        status: {
            type: String,
            enum: ['in_progress', 'completed', 'cancelled'],
            default: 'in_progress',
        },
        completedAt: {
            type: Date,
        },
        completedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
    },
    {
        timestamps: true,
    },
);

// Pre-save hook để tạo mã phiếu khám
examinationSchema.pre('save', async function (next) {
    if (this.isNew && !this.examinationCode) {
        // Lấy thông tin patient để tạo mã
        const patient = await mongoose.model('Patient').findById(this.patient);
        if (patient) {
            const today = new Date();
            const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');

            // Tìm số thứ tự của ngày hôm nay cho patient này
            const count = await mongoose.model('Examination').countDocuments({
                patient: this.patient,
                createdAt: {
                    $gte: new Date(
                        today.getFullYear(),
                        today.getMonth(),
                        today.getDate(),
                    ),
                    $lt: new Date(
                        today.getFullYear(),
                        today.getMonth(),
                        today.getDate() + 1,
                    ),
                },
            });

            const sequence = String(count + 1).padStart(3, '0');
            this.examinationCode = `${patient.patientCode}-${dateStr}${sequence}`;
        }
    }
    next();
});

// Index để tối ưu truy vấn
examinationSchema.index({ patient: 1, examinationDate: -1 });
examinationSchema.index({ doctor: 1 });
examinationSchema.index({ status: 1 });
examinationSchema.index({ appointment: 1 });

const Examination = mongoose.model('Examination', examinationSchema);

export default Examination;
