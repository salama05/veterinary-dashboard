import { Request, Response } from 'express';
import Treatment from '../models/Treatment';
import Customer from '../models/Customer';

export const getTreatments = async (req: Request, res: Response) => {
    try {
        const treatments = await Treatment.find({ clinicId: (req as any).user.clinicId }).populate('customer', 'name');
        res.json(treatments);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

export const createTreatment = async (req: Request, res: Response) => {
    try {
        const { treatmentName, quantity, price, customer, paid, date } = req.body;
        const qty = Number(quantity);
        const cost = Number(price);
        const total = qty * cost;
        const paidAmount = Number(paid || 0);
        const rest = total - paidAmount;

        const treatment = new Treatment({
            treatmentName,
            quantity: qty,
            price: cost,
            total,
            customer,
            paid: paidAmount,
            rest,
            date: date || new Date(),
            clinicId: (req as any).user.clinicId,
        });

        const savedTreatment = await treatment.save();

        // Update Customer Balance (Treatment is also a debt increase)
        const customerDoc = await Customer.findOne({ _id: customer, clinicId: (req as any).user.clinicId });
        if (customerDoc) {
            // Assuming Treatment counts towards Total Sales or we might want a separate "Total Treatments" field?
            // For simplicity/requirement "Customer: Total Sales", I'll add to Total Sales value.
            customerDoc.totalSales += total;
            customerDoc.totalPaid += paidAmount;
            customerDoc.totalRest += rest;
            await customerDoc.save();
        }

        res.status(201).json(savedTreatment);
    } catch (error) {
        res.status(400).json({ message: 'Invalid treatment data' });
    }
};

export const updateTreatment = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { treatmentName, quantity, price, customer, paid, date } = req.body;

        const oldTreatment = await Treatment.findOne({ _id: id, clinicId: (req as any).user.clinicId });
        if (!oldTreatment) {
            return res.status(404).json({ message: 'Treatment not found' });
        }

        const qty = Number(quantity);
        const cost = Number(price);
        const total = qty * cost;
        const paidAmount = Number(paid || 0);
        const rest = total - paidAmount;

        // Revert old customer balance
        if (oldTreatment.customer) {
            const oldCustomer = await Customer.findOne({ _id: oldTreatment.customer, clinicId: (req as any).user.clinicId });
            if (oldCustomer) {
                oldCustomer.totalSales -= oldTreatment.total;
                oldCustomer.totalPaid -= oldTreatment.paid;
                oldCustomer.totalRest -= oldTreatment.rest;
                await oldCustomer.save();
            }
        }

        // Update treatment
        oldTreatment.treatmentName = treatmentName;
        oldTreatment.quantity = qty;
        oldTreatment.price = cost;
        oldTreatment.total = total;
        oldTreatment.customer = customer;
        oldTreatment.paid = paidAmount;
        oldTreatment.rest = rest;
        oldTreatment.date = date || oldTreatment.date;

        const updatedTreatment = await oldTreatment.save();

        // Update new customer balance
        const newCustomer = await Customer.findOne({ _id: customer, clinicId: (req as any).user.clinicId });
        if (newCustomer) {
            newCustomer.totalSales += total;
            newCustomer.totalPaid += paidAmount;
            newCustomer.totalRest += rest;
            await newCustomer.save();
        }

        res.json(updatedTreatment);
    } catch (error) {
        res.status(400).json({ message: 'Invalid treatment data' });
    }
};

export const deleteTreatment = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const treatment = await Treatment.findOne({ _id: id, clinicId: (req as any).user.clinicId });
        if (!treatment) {
            return res.status(404).json({ message: 'Treatment not found' });
        }

        // Revert customer balance
        if (treatment.customer) {
            const customer = await Customer.findOne({ _id: treatment.customer, clinicId: (req as any).user.clinicId });
            if (customer) {
                customer.totalSales -= treatment.total;
                customer.totalPaid -= treatment.paid;
                customer.totalRest -= treatment.rest;
                await customer.save();
            }
        }

        await Treatment.findOneAndDelete({ _id: id, clinicId: (req as any).user.clinicId });
        res.json({ message: 'Treatment deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

