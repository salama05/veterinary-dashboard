import mongoose, { Schema, Document } from 'mongoose';

export interface IConsumedProduct extends Document {
    date: Date;
    product: mongoose.Types.ObjectId;
    productName: string;
    quantity: number;
    notes?: string;
}

const ConsumedProductSchema: Schema = new Schema({
    date: { type: Date, default: Date.now },
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    productName: { type: String, required: true },
    quantity: { type: Number, required: true },
    notes: { type: String },
}, { timestamps: true });

export default mongoose.model<IConsumedProduct>('ConsumedProduct', ConsumedProductSchema);
