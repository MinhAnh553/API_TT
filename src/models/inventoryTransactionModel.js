import mongoose from 'mongoose';

const inventoryTransactionSchema = new mongoose.Schema(
    {
        transactionCode: {
            type: String,
            required: true,
            unique: true,
            uppercase: true,
        },
        type: {
            type: String,
            enum: ['import', 'export', 'adjustment', 'return', 'waste'],
            required: true,
        },
        medicine: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Medicine',
            required: true,
        },
        batchNumber: {
            type: String,
            required: true,
            trim: true,
        },
        quantity: {
            type: Number,
            required: true,
        },
        unitPrice: {
            type: Number,
            required: true,
            min: 0,
        },
        totalValue: {
            type: Number,
            required: true,
            min: 0,
        },
        expiryDate: {
            type: Date,
            required: true,
        },
        supplier: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Supplier',
        },
        reason: {
            type: String,
            trim: true,
        },
        referenceDocument: {
            type: String,
            trim: true, // Invoice number, prescription ID, etc.
        },
        performedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        notes: {
            type: String,
            trim: true,
        },
        status: {
            type: String,
            enum: ['pending', 'completed', 'cancelled'],
            default: 'completed',
        },
    },
    {
        timestamps: true,
    },
);

// Generate transaction code before saving
inventoryTransactionSchema.pre('save', async function (next) {
    if (this.isNew) {
        try {
            const today = new Date();
            const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
            const count = await mongoose
                .model('InventoryTransaction')
                .countDocuments({
                    createdAt: {
                        $gte: new Date(today.setHours(0, 0, 0, 0)),
                        $lt: new Date(today.setHours(23, 59, 59, 999)),
                    },
                });

            const typePrefix = {
                import: 'NK',
                export: 'XK',
                adjustment: 'DK',
                return: 'TL',
                waste: 'HH',
            };

            this.transactionCode = `${typePrefix[this.type]}${dateStr}${String(
                count + 1,
            ).padStart(3, '0')}`;
        } catch (error) {
            next(error);
        }
    }
    next();
});

// Calculate total value before saving
inventoryTransactionSchema.pre('save', function (next) {
    this.totalValue = this.quantity * this.unitPrice;
    next();
});

// Index for better performance
inventoryTransactionSchema.index({ transactionCode: 1 });
inventoryTransactionSchema.index({ medicine: 1, createdAt: -1 });
inventoryTransactionSchema.index({ type: 1, createdAt: -1 });
inventoryTransactionSchema.index({ performedBy: 1, createdAt: -1 });

const InventoryTransaction = mongoose.model(
    'InventoryTransaction',
    inventoryTransactionSchema,
);

export default InventoryTransaction;
