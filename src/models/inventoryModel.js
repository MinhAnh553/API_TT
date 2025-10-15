import mongoose from 'mongoose';

const inventorySchema = new mongoose.Schema(
    {
        medicine: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Medicine',
            required: true,
        },
        batchNumber: {
            type: String,
            required: [true, 'Batch number is required'],
            trim: true,
        },
        expiryDate: {
            type: Date,
            required: [true, 'Expiry date is required'],
        },
        quantity: {
            type: Number,
            required: [true, 'Quantity is required'],
            min: 0,
        },
        unitPrice: {
            type: Number,
            required: [true, 'Unit price is required'],
            min: 0,
        },
        totalValue: {
            type: Number,
            min: 0,
        },
        supplier: {
            name: { type: String, required: true, trim: true },
            contact: { type: String, trim: true },
            address: { type: String, trim: true },
        },
        location: {
            warehouse: { type: String, default: 'main', trim: true },
            shelf: { type: String, trim: true },
            position: { type: String, trim: true },
        },
        minimumStock: {
            type: Number,
            default: 10,
            min: 0,
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

// Calculate total value before saving
inventorySchema.pre('save', function (next) {
    this.totalValue = this.quantity * this.unitPrice;
    next();
});

// Index for better performance
inventorySchema.index({ medicine: 1, batchNumber: 1 });
inventorySchema.index({ expiryDate: 1 });
inventorySchema.index({ quantity: 1 });

const Inventory = mongoose.model('Inventory', inventorySchema);

export default Inventory;
