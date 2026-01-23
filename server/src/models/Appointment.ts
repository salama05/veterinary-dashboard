import mongoose, { Schema, Document } from 'mongoose';

export interface IAppointment extends Document {
    customer: mongoose.Types.ObjectId;
    date: Date;
    endTime: Date;
    serviceType: string;
    status: 'Scheduled' | 'Confirmed' | 'Cancelled' | 'Completed';
    notes?: string;
    clinicId: string;
}

const AppointmentSchema: Schema = new Schema({
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
    date: { type: Date, required: true },
    endTime: { type: Date, required: true },
    serviceType: { type: String, required: true },
    status: {
        type: String,
        enum: ['Scheduled', 'Confirmed', 'Cancelled', 'Completed'],
        default: 'Scheduled'
    },
    notes: { type: String },
    clinicId: { type: String, required: true }
}, { timestamps: true });

export default mongoose.model<IAppointment>('Appointment', AppointmentSchema);
