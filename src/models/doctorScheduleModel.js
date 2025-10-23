import mongoose from 'mongoose';

const doctorScheduleSchema = new mongoose.Schema(
    {
        doctor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Bác sĩ là bắt buộc'],
        },
        department: {
            type: String,
            required: [true, 'Khoa/phòng là bắt buộc'],
            trim: true,
        },
        scheduleDate: {
            type: Date,
            required: [true, 'Ngày trực là bắt buộc'],
        },
        shiftType: {
            type: String,
            enum: ['morning', 'afternoon', 'evening', 'night'],
            required: [true, 'Loại ca trực là bắt buộc'],
        },
        timeSlots: [
            {
                start: {
                    type: String,
                    required: true,
                    match: [
                        /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
                        'Định dạng thời gian không hợp lệ (HH:mm)',
                    ],
                },
                end: {
                    type: String,
                    required: true,
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
                maxPatients: {
                    type: Number,
                    min: 1,
                    default: 10,
                },
                isAvailable: {
                    type: Boolean,
                    default: true,
                },
            },
        ],
        status: {
            type: String,
            enum: ['scheduled', 'active', 'completed', 'cancelled'],
            default: 'scheduled',
        },
        notes: {
            type: String,
            trim: true,
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    },
);

// Pre-save hook để validate time slots
doctorScheduleSchema.pre('save', function (next) {
    if (this.timeSlots && this.timeSlots.length > 0) {
        for (const slot of this.timeSlots) {
            const startTime = new Date(`2000-01-01T${slot.start}:00`);
            const endTime = new Date(`2000-01-01T${slot.end}:00`);

            if (startTime >= endTime) {
                return next(
                    new Error(
                        'Thời gian bắt đầu phải nhỏ hơn thời gian kết thúc',
                    ),
                );
            }
        }
    }
    next();
});

// Index để tối ưu truy vấn
doctorScheduleSchema.index({ doctor: 1, scheduleDate: 1 });
doctorScheduleSchema.index({ department: 1 });
doctorScheduleSchema.index({ scheduleDate: 1, shiftType: 1 });
doctorScheduleSchema.index({ status: 1 });
doctorScheduleSchema.index({ isActive: 1 });

// Virtual để tính số slot còn trống
doctorScheduleSchema.virtual('availableSlots').get(function () {
    return this.timeSlots.filter((slot) => slot.isAvailable).length;
});

// Virtual để tính tổng số slot
doctorScheduleSchema.virtual('totalSlots').get(function () {
    return this.timeSlots.length;
});

const DoctorSchedule = mongoose.model('DoctorSchedule', doctorScheduleSchema);

export default DoctorSchedule;
