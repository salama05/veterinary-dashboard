import mongoose, { Schema, Document } from 'mongoose';

export interface ICustomer extends Document {
    name: string;
    address?: string;
    phone?: string;
    totalSales: number;
    totalTreatments: number;
    totalPaid: number;
    totalRest: number;
    payments: {
        date: Date;
        amount: number;
        notes?: string;
    }[];
    clinicId: string;
}

const CustomerSchema: Schema = new Schema({
    name: { type: String, required: true },
    address: { type: String },
    phone: { type: String },
    totalSales: { type: Number, default: 0 },
    totalTreatments: { type: Number, default: 0 },
    totalPaid: { type: Number, default: 0 },
    totalRest: { type: Number, default: 0 },
    payments: [{
        date: { type: Date, default: Date.now },
        amount: { type: Number, required: true },
        notes: { type: String }
    }],
    clinicId: { type: String, required: true },
}, { timestamps: true });

export default mongoose.model<ICustomer>('Customer', CustomerSchema);
