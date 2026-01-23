import mongoose, { Schema, Document } from 'mongoose';

export interface ISale extends Document {
    date: Date;
    product: mongoose.Types.ObjectId;
    quantity: number;
    price: number;
    total: number;
    customer: mongoose.Types.ObjectId;
    paid: number;
    rest: number;
    clinicId: string;
}

const SaleSchema: Schema = new Schema({
    date: { type: Date, default: Date.now },
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true },
    total: { type: Number, required: true },
    customer: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
    paid: { type: Number, default: 0 },
    rest: { type: Number, default: 0 },
    clinicId: { type: String, required: true },
}, { timestamps: true });

export default mongoose.model<ISale>('Sale', SaleSchema);
