import mongoose, { Schema, Document } from 'mongoose';

export interface IPurchase extends Document {
    date: Date;
    product: mongoose.Types.ObjectId;
    quantity: number;
    price: number;
    total: number;
    supplier: mongoose.Types.ObjectId;
    expiryDate?: Date;
    clinicId: string;
}

const PurchaseSchema: Schema = new Schema({
    date: { type: Date, default: Date.now },
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true },
    total: { type: Number, required: true },
    supplier: { type: Schema.Types.ObjectId, ref: 'Supplier', required: true },
    expiryDate: { type: Date },
    clinicId: { type: String, required: true },
}, { timestamps: true });

export default mongoose.model<IPurchase>('Purchase', PurchaseSchema);
