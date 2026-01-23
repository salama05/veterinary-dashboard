import { Request, Response } from 'express';
import Appointment from '../models/Appointment';

// Get all appointments (optionally filtered by date range)
export const getAppointments = async (req: Request, res: Response) => {
    try {
        const { start, end } = req.query;
        let query: any = { clinicId: (req as any).user.clinicId };

        if (start && end) {
            query.date = {
                $gte: new Date(start as string),
                $lte: new Date(end as string)
            };
        }

        const appointments = await Appointment.find(query)
            .populate('customer', 'name phone')
            .sort({ date: 1 });

        res.json(appointments);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching appointments' });
    }
};

// Create a new appointment
export const createAppointment = async (req: Request, res: Response) => {
    try {
        const { customer, date, endTime, serviceType, status, notes } = req.body;

        const newAppointment = await Appointment.create({
            customer,
            date,
            endTime,
            serviceType,
            status,
            notes,
            clinicId: (req as any).user.clinicId
        });

        const populatedAppointment = await newAppointment.populate('customer', 'name phone');
        res.status(201).json(populatedAppointment);
    } catch (error) {
        res.status(400).json({ message: 'Error creating appointment', error });
    }
};

// Update an appointment
export const updateAppointment = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const updatedAppointment = await Appointment.findOneAndUpdate(
            { _id: id, clinicId: (req as any).user.clinicId },
            req.body,
            { new: true }
        )
            .populate('customer', 'name phone');

        if (!updatedAppointment) {
            return res.status(404).json({ message: 'Appointment not found' });
        }
        res.json(updatedAppointment);
    } catch (error) {
        res.status(400).json({ message: 'Error updating appointment' });
    }
};

// Delete an appointment
export const deleteAppointment = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const deletedAppointment = await Appointment.findOneAndDelete({ _id: id, clinicId: (req as any).user.clinicId });

        if (!deletedAppointment) {
            return res.status(404).json({ message: 'Appointment not found' });
        }
        res.json({ message: 'Appointment deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting appointment' });
    }
};
