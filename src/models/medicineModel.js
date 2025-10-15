import mongoose from 'mongoose';

const medicineSchema = new mongoose.Schema(
    {
        medicineCode: {
            type: String,
            required: true,
            unique: true,
            uppercase: true,
        },
        name: {
            type: String,
            required: [true, 'Medicine name is required'],
            trim: true,
            maxlength: [200, 'Medicine name cannot exceed 200 characters'],
        },
        activeIngredient: {
            type: String,
            required: [true, 'Active ingredient is required'],
            trim: true,
        },
        strength: {
            type: String,
            required: [true, 'Strength is required'],
            trim: true, // e.g., "500mg", "10ml"
        },
        dosageForm: {
            type: String,
            required: [true, 'Dosage form is required'],
            enum: [
                'tablet',
                'capsule',
                'syrup',
                'injection',
                'cream',
                'ointment',
                'drops',
                'powder',
                'suppository',
                'patch',
                'other',
            ],
        },
        unit: {
            type: String,
            required: [true, 'Unit is required'],
            enum: [
                'tablet',
                'capsule',
                'ml',
                'mg',
                'g',
                'tube',
                'bottle',
                'box',
            ],
        },
        packageSize: {
            type: String,
            required: true,
            trim: true, // e.g., "10 tablets per box"
        },
        category: {
            type: String,
            required: [true, 'Category is required'],
            enum: [
                'antibiotic',
                'painkiller',
                'vitamin',
                'cardiovascular',
                'respiratory',
                'gastrointestinal',
                'dermatology',
                'ophthalmology',
                'neurology',
                'endocrinology',
                'other',
            ],
        },
        manufacturer: {
            type: String,
            required: [true, 'Manufacturer is required'],
            trim: true,
        },
        country: {
            type: String,
            trim: true,
        },
        indication: {
            type: String,
            trim: true,
        },
        contraindications: {
            type: String,
            trim: true,
        },
        sideEffects: {
            type: String,
            trim: true,
        },
        dosage: {
            type: String,
            trim: true,
        },
        storageConditions: {
            type: String,
            trim: true,
        },
        isPrescriptionRequired: {
            type: Boolean,
            default: true,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        pricePerUnit: {
            type: Number,
            min: 0,
            default: 0,
        },
    },
    {
        timestamps: true,
    },
);

// Generate medicine code before saving
medicineSchema.pre('save', async function (next) {
    if (this.isNew) {
        try {
            const count = await mongoose.model('Medicine').countDocuments();
            this.medicineCode = `TH${String(count + 1).padStart(6, '0')}`;
        } catch (error) {
            next(error);
        }
    }
    next();
});

// Index for better search performance
medicineSchema.index({ medicineCode: 1 });
medicineSchema.index({ name: 'text', activeIngredient: 'text' });
medicineSchema.index({ category: 1 });
medicineSchema.index({ isActive: 1 });

const Medicine = mongoose.model('Medicine', medicineSchema);

export default Medicine;
