import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema(
    {
        appointmentCode: {
            type: String,
            unique: true,
        },
        // Thông tin bệnh nhân (có thể chưa có trong hệ thống)
        fullName: {
            type: String,
            required: [true, 'Họ tên là bắt buộc'],
            trim: true,
        },
        phone: {
            type: String,
            required: [true, 'Số điện thoại là bắt buộc'],
            trim: true,
        },
        // Liên kết với patient nếu đã có trong hệ thống
        patient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Patient',
            default: null,
        },
        // Thông tin lịch khám đơn giản
        appointmentDate: {
            type: Date,
            required: [true, 'Ngày đặt lịch là bắt buộc'],
        },
        timeSlot: {
            start: {
                type: String,
                required: [true, 'Thời gian bắt đầu là bắt buộc'],
                match: [
                    /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
                    'Định dạng thời gian không hợp lệ (HH:mm)',
                ],
            },
            end: {
                type: String,
                required: [true, 'Thời gian kết thúc là bắt buộc'],
                match: [
                    /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
                    'Định dạng thời gian không hợp lệ (HH:mm)',
                ],
            },
            duration: {
                type: Number,
                min: 15,
                max: 180,
                default: 30,
            },
        },
        status: {
            type: String,
            enum: [
                'scheduled', // Đã đặt lịch
                'confirmed', // Đã xác nhận
                'checked_in', // Đã đến khám
                'in_progress', // Đang khám
                'completed', // Hoàn thành
                'cancelled', // Đã hủy
                'no_show', // Không đến khám
                'rescheduled', // Đã đổi lịch
            ],
            default: 'scheduled',
        },
        // Thông tin check-in/check-out
        checkInTime: {
            type: Date,
        },
        checkOutTime: {
            type: Date,
        },
        // Thông tin bác sĩ và chuyên khoa
        doctor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },
        department: {
            type: String,
            trim: true,
        },
        reasonForVisit: {
            type: String,
            trim: true,
        },
        // Liên kết với examination khi bác sĩ tạo phiếu khám
        examination: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Examination',
            default: null,
        },
        // Liên kết với doctor schedule
        doctorSchedule: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'DoctorSchedule',
            default: null,
        },
        // Thông tin hủy lịch
        cancellationReason: {
            type: String,
            trim: true,
        },
        cancelledBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        cancelledAt: {
            type: Date,
        },
        // Thông tin tạo lịch
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null, // null nếu bệnh nhân tự đặt
        },
        source: {
            type: String,
            enum: ['online', 'phone', 'walk_in', 'admin'],
            default: 'online',
        },
    },
    {
        timestamps: true,
    },
);

// Pre-save hook để tạo mã lịch khám
appointmentSchema.pre('save', async function (next) {
    if (this.isNew && !this.appointmentCode) {
        const today = new Date();
        const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');

        // Tìm số thứ tự của ngày hôm nay
        const count = await mongoose.model('Appointment').countDocuments({
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
        this.appointmentCode = `LH${dateStr}${sequence}`;
    }
    next();
});

// Virtual để tính thời gian khám
appointmentSchema.virtual('duration').get(function () {
    if (this.checkInTime && this.checkOutTime) {
        return Math.round((this.checkOutTime - this.checkInTime) / (1000 * 60)); // phút
    }
    return this.timeSlot.duration;
});

// Index để tối ưu truy vấn
appointmentSchema.index({ appointmentDate: 1, 'timeSlot.start': 1 });
appointmentSchema.index({ phone: 1 });
appointmentSchema.index({ status: 1 });
appointmentSchema.index({ patient: 1 });
appointmentSchema.index({ doctor: 1 });
appointmentSchema.index({ department: 1 });
appointmentSchema.index({ doctorSchedule: 1 });

const Appointment = mongoose.model('Appointment', appointmentSchema);

export default Appointment;
