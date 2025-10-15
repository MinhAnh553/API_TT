import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
    {
        type: {
            type: String,
            enum: [
                'appointment_reminder',
                'appointment_confirmation',
                'appointment_cancellation',
                'medicine_expiry',
                'low_stock',
                'system_alert',
                'patient_check_in',
            ],
            required: true,
        },
        recipient: {
            type: {
                type: String,
                enum: ['patient', 'doctor', 'staff', 'admin'],
                required: true,
            },
            patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient' },
            user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            phone: { type: String, trim: true },
            email: { type: String, trim: true },
        },
        title: {
            type: String,
            required: true,
            trim: true,
        },
        message: {
            type: String,
            required: true,
            trim: true,
        },
        channels: [
            {
                type: String,
                enum: ['sms', 'email', 'push', 'in_app'],
                required: true,
            },
        ],
        status: {
            type: String,
            enum: ['pending', 'sent', 'delivered', 'failed', 'cancelled'],
            default: 'pending',
        },
        scheduledAt: {
            type: Date,
            default: Date.now,
        },
        sentAt: {
            type: Date,
        },
        deliveryAttempts: {
            type: Number,
            default: 0,
            max: 3,
        },
        lastAttemptAt: {
            type: Date,
        },
        errorMessage: {
            type: String,
            trim: true,
        },
        relatedEntity: {
            type: String,
            enum: ['appointment', 'examination', 'inventory', 'patient'],
        },
        relatedEntityId: {
            type: mongoose.Schema.Types.ObjectId,
        },
        metadata: {
            type: mongoose.Schema.Types.Mixed,
            default: {},
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

// Index for better performance
notificationSchema.index({ type: 1, status: 1 });
notificationSchema.index({ scheduledAt: 1 });
notificationSchema.index({ 'recipient.user': 1, status: 1 });
notificationSchema.index({ 'recipient.patient': 1, status: 1 });

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;
