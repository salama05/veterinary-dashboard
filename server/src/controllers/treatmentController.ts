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
        // Update Customer Balance (Treatment increment)
        const customerDoc = await Customer.findOne({ _id: customer, clinicId: (req as any).user.clinicId });
        if (customerDoc) {
            customerDoc.totalTreatments = (customerDoc.totalTreatments || 0) + total;
            customerDoc.totalPaid = (customerDoc.totalPaid || 0) + paidAmount;
            // Balance = (Sales + Treatments) - Payments
            customerDoc.totalRest = ((customerDoc.totalSales || 0) + customerDoc.totalTreatments) - customerDoc.totalPaid;
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
                oldCustomer.totalTreatments = Math.max(0, (oldCustomer.totalTreatments || 0) - oldTreatment.total);
                oldCustomer.totalPaid = Math.max(0, (oldCustomer.totalPaid || 0) - oldTreatment.paid);
                oldCustomer.totalRest = ((oldCustomer.totalSales || 0) + oldCustomer.totalTreatments) - oldCustomer.totalPaid;
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
            newCustomer.totalTreatments = (newCustomer.totalTreatments || 0) + total;
            newCustomer.totalPaid = (newCustomer.totalPaid || 0) + paidAmount;
            newCustomer.totalRest = ((newCustomer.totalSales || 0) + newCustomer.totalTreatments) - newCustomer.totalPaid;
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
                customer.totalTreatments = Math.max(0, (customer.totalTreatments || 0) - treatment.total);
                customer.totalPaid = Math.max(0, (customer.totalPaid || 0) - treatment.paid);
                customer.totalRest = ((customer.totalSales || 0) + customer.totalTreatments) - customer.totalPaid;
                await customer.save();
            }
        }

        await Treatment.findOneAndDelete({ _id: id, clinicId: (req as any).user.clinicId });
        res.json({ message: 'Treatment deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

