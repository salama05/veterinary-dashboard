import mongoose, { Schema, Document } from 'mongoose';

export interface ITreatment extends Document {
    date: Date;
    treatmentName: string;
    quantity: number;
    price: number;
    total: number;
    customer: mongoose.Types.ObjectId;
    paid: number;
    rest: number;
}

const TreatmentSchema: Schema = new Schema({
    date: { type: Date, default: Date.now },
    treatmentName: { type: String, required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true },
    total: { type: Number, required: true },
    customer: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
    paid: { type: Number, default: 0 },
    rest: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.model<ITreatment>('Treatment', TreatmentSchema);
