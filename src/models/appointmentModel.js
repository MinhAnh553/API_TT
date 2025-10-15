import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema(
    {
        appointmentCode: {
            type: String,
            required: true,
            unique: true,
            uppercase: true,
        },
        patient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Patient',
            required: true,
        },
        doctor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        appointmentDate: {
            type: Date,
            required: [true, 'Appointment date is required'],
        },
        timeSlot: {
            start: { type: String, required: true }, // Format: "HH:mm"
            end: { type: String, required: true }, // Format: "HH:mm"
            duration: { type: Number, default: 30 }, // minutes
        },
        reason: {
            type: String,
            required: [true, 'Reason for appointment is required'],
            trim: true,
        },
        status: {
            type: String,
            enum: [
                'scheduled',
                'confirmed',
                'checked_in',
                'in_progress',
                'completed',
                'cancelled',
                'no_show',
            ],
            default: 'scheduled',
        },
        priority: {
            type: String,
            enum: ['low', 'normal', 'high', 'urgent'],
            default: 'normal',
        },
        type: {
            type: String,
            enum: ['consultation', 'follow_up', 'emergency', 'routine_checkup'],
            default: 'consultation',
        },
        notes: {
            type: String,
            trim: true,
        },
        reminders: {
            smsSent: { type: Boolean, default: false },
            emailSent: { type: Boolean, default: false },
            lastReminderSent: { type: Date },
            reminderCount: { type: Number, default: 0 },
        },
        checkInTime: {
            type: Date,
        },
        checkOutTime: {
            type: Date,
        },
        examination: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Examination',
        },
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
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        source: {
            type: String,
            enum: ['reception', 'kiosk', 'online', 'mobile', 'phone'],
            default: 'reception',
        },
    },
    {
        timestamps: true,
    },
);

// Generate appointment code before saving
appointmentSchema.pre('save', async function (next) {
    if (this.isNew) {
        try {
            const today = new Date();
            const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
            const count = await mongoose.model('Appointment').countDocuments({
                appointmentDate: {
                    $gte: new Date(today.setHours(0, 0, 0, 0)),
                    $lt: new Date(today.setHours(23, 59, 59, 999)),
                },
            });
            this.appointmentCode = `LH${dateStr}${String(count + 1).padStart(
                3,
                '0',
            )}`;
        } catch (error) {
            next(error);
        }
    }
    next();
});

// Virtual for appointment duration
appointmentSchema.virtual('duration').get(function () {
    if (this.checkInTime && this.checkOutTime) {
        return Math.round((this.checkOutTime - this.checkInTime) / (1000 * 60)); // minutes
    }
    return this.timeSlot.duration;
});

// Index for better performance
appointmentSchema.index({ appointmentCode: 1 });
appointmentSchema.index({ patient: 1, appointmentDate: -1 });
appointmentSchema.index({ doctor: 1, appointmentDate: -1 });
appointmentSchema.index({ appointmentDate: 1, timeSlot: 1 });
appointmentSchema.index({ status: 1 });

const Appointment = mongoose.model('Appointment', appointmentSchema);

export default Appointment;
