import mongoose from 'mongoose';

const supplierSchema = new mongoose.Schema(
    {
        supplierCode: {
            type: String,
            required: true,
            unique: true,
            uppercase: true,
        },
        name: {
            type: String,
            required: [true, 'Supplier name is required'],
            trim: true,
            maxlength: [200, 'Supplier name cannot exceed 200 characters'],
        },
        contactPerson: {
            type: String,
            trim: true,
        },
        phone: {
            type: String,
            required: [true, 'Phone number is required'],
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
        taxCode: {
            type: String,
            unique: true,
            sparse: true,
            trim: true,
        },
        bankAccount: {
            accountNumber: { type: String, trim: true },
            bankName: { type: String, trim: true },
            accountHolder: { type: String, trim: true },
        },
        paymentTerms: {
            type: String,
            enum: ['cash', '30_days', '60_days', '90_days'],
            default: '30_days',
        },
        creditLimit: {
            type: Number,
            min: 0,
            default: 0,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        notes: {
            type: String,
            trim: true,
        },
    },
    {
        timestamps: true,
    },
);

// Generate supplier code before saving
supplierSchema.pre('save', async function (next) {
    if (this.isNew) {
        try {
            const count = await mongoose.model('Supplier').countDocuments();
            this.supplierCode = `NCC${String(count + 1).padStart(6, '0')}`;
        } catch (error) {
            next(error);
        }
    }
    next();
});

// Index for better search performance
supplierSchema.index({ supplierCode: 1 });
supplierSchema.index({ name: 'text', contactPerson: 'text' });
supplierSchema.index({ isActive: 1 });

const Supplier = mongoose.model('Supplier', supplierSchema);

export default Supplier;
