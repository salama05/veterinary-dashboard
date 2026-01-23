import mongoose, { Schema, Document } from 'mongoose';

export interface IProduct extends Document {
    name: string;
    quantity: number;
    expiryDate?: Date;
    minLimit: number;
    price: number;
    clinicId: string;
}

const ProductSchema: Schema = new Schema({
    name: { type: String, required: true },
    quantity: { type: Number, default: 0 },
    expiryDate: { type: Date },
    minLimit: { type: Number, default: 5 },
    price: { type: Number, required: true },
    clinicId: { type: String, required: true },
}, { timestamps: true });

export default mongoose.model<IProduct>('Product', ProductSchema);
