import mongoose, { Schema, Document } from 'mongoose';

export interface ISupplier extends Document {
    name: string;
    address?: string;
    phone?: string;
    totalPurchases: number;
    totalPaid: number;
    totalRest: number;
    payments: {
        date: Date;
        amount: number;
        notes?: string;
    }[];
    clinicId: string;
}

const SupplierSchema: Schema = new Schema({
    name: { type: String, required: true, unique: true },
    address: { type: String },
    phone: { type: String },
    totalPurchases: { type: Number, default: 0 },
    totalPaid: { type: Number, default: 0 },
    totalRest: { type: Number, default: 0 },
    payments: [{
        date: { type: Date, default: Date.now },
        amount: { type: Number, required: true },
        notes: { type: String }
    }],
    clinicId: { type: String, required: true },
}, { timestamps: true });

export default mongoose.model<ISupplier>('Supplier', SupplierSchema);
