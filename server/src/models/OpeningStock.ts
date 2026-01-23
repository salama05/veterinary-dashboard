import mongoose, { Schema, Document } from 'mongoose';

export interface IOpeningStock extends Document {
    openingDate: Date;
    product: mongoose.Types.ObjectId;
    productName: string; // Name of the selected product
    quantity: number;
    expiryDate?: Date;
    source: string;
    price?: number;
    clinicId: string;
}

const OpeningStockSchema: Schema = new Schema({
    openingDate: { type: Date, required: true },
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    productName: { type: String, required: true },
    quantity: { type: Number, required: true },
    expiryDate: { type: Date },
    source: { type: String, required: true },
    price: { type: Number },
    clinicId: { type: String, required: true },
}, { timestamps: true });

export default mongoose.model<IOpeningStock>('OpeningStock', OpeningStockSchema);
