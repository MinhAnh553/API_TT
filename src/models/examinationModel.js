import mongoose from 'mongoose';

const examinationSchema = new mongoose.Schema(
    {
        examinationCode: {
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
        examinationDate: {
            type: Date,
            required: true,
            default: Date.now,
        },
        reasonForVisit: {
            type: String,
            required: [true, 'Reason for visit is required'],
            trim: true,
        },
        symptoms: {
            type: String,
            trim: true,
        },
        diagnosis: {
            type: String,
            required: [true, 'Diagnosis is required'],
            trim: true,
        },
        treatment: {
            instructions: { type: String, trim: true },
            followUpDate: { type: Date },
            followUpInstructions: { type: String, trim: true },
        },
        prescriptions: [
            {
                medicine: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Medicine',
                    required: true,
                },
                quantity: {
                    type: Number,
                    required: true,
                    min: 1,
                },
                dosage: {
                    morning: { type: Number, default: 0 },
                    afternoon: { type: Number, default: 0 },
                    evening: { type: Number, default: 0 },
                    night: { type: Number, default: 0 },
                },
                duration: {
                    type: Number,
                    required: true,
                    min: 1,
                }, // days
                instructions: { type: String, trim: true },
                isDispensed: { type: Boolean, default: false },
                dispensedAt: { type: Date },
                dispensedBy: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'User',
                },
            },
        ],
        labOrders: [
            {
                testName: { type: String, required: true, trim: true },
                testCode: { type: String, trim: true },
                instructions: { type: String, trim: true },
                status: {
                    type: String,
                    enum: ['ordered', 'in_progress', 'completed', 'cancelled'],
                    default: 'ordered',
                },
                orderedAt: { type: Date, default: Date.now },
                completedAt: { type: Date },
                results: { type: String, trim: true },
            },
        ],
        status: {
            type: String,
            enum: ['in_progress', 'completed', 'cancelled'],
            default: 'in_progress',
        },
        notes: {
            type: String,
            trim: true,
        },
        totalCost: {
            type: Number,
            min: 0,
            default: 0,
        },
        paymentStatus: {
            type: String,
            enum: ['pending', 'paid', 'partial', 'waived'],
            default: 'pending',
        },
    },
    {
        timestamps: true,
    },
);

// Generate examination code before saving
examinationSchema.pre('save', async function (next) {
    if (this.isNew) {
        try {
            const today = new Date();
            const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
            const count = await mongoose.model('Examination').countDocuments({
                examinationDate: {
                    $gte: new Date(today.setHours(0, 0, 0, 0)),
                    $lt: new Date(today.setHours(23, 59, 59, 999)),
                },
            });
            this.examinationCode = `PK${dateStr}${String(count + 1).padStart(
                3,
                '0',
            )}`;
        } catch (error) {
            next(error);
        }
    }
    next();
});

// Calculate total cost
examinationSchema.pre('save', function (next) {
    if (this.prescriptions && this.prescriptions.length > 0) {
        // This would be calculated based on medicine prices
        // For now, we'll set a placeholder
        this.totalCost = this.prescriptions.length * 10000; // Placeholder calculation
    }
    next();
});

// Index for better performance
examinationSchema.index({ examinationCode: 1 });
examinationSchema.index({ patient: 1, examinationDate: -1 });
examinationSchema.index({ doctor: 1, examinationDate: -1 });
examinationSchema.index({ examinationDate: -1 });

const Examination = mongoose.model('Examination', examinationSchema);

export default Examination;
