import { Request, Response } from 'express';
import Supplier from '../models/Supplier';

export const getSuppliers = async (req: Request, res: Response) => {
    try {
        const suppliers = await Supplier.find({});
        res.json(suppliers);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

export const createSupplier = async (req: Request, res: Response) => {
    try {
        const supplier = new Supplier(req.body);
        const createdSupplier = await supplier.save();
        res.status(201).json(createdSupplier);
    } catch (error) {
        res.status(400).json({ message: 'Invalid supplier data' });
    }
};

export const updateSupplier = async (req: Request, res: Response) => {
    try {
        const supplier = await Supplier.findById(req.params.id);
        if (supplier) {
            Object.assign(supplier, req.body);
            const updatedSupplier = await supplier.save();
            res.json(updatedSupplier);
        } else {
            res.status(404).json({ message: 'Supplier not found' });
        }
    } catch (error) {
        res.status(400).json({ message: 'Invalid supplier data' });
    }
};

export const deleteSupplier = async (req: Request, res: Response) => {
    try {
        const supplier = await Supplier.findById(req.params.id);
        if (supplier) {
            await supplier.deleteOne();
            res.json({ message: 'Supplier removed' });
        } else {
            res.status(404).json({ message: 'Supplier not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

export const addSupplierPayment = async (req: Request, res: Response) => {
    try {
        const { amount, notes, date } = req.body;
        const supplier = await Supplier.findById(req.params.id);

        if (supplier) {
            const paymentAmount = Number(amount);
            supplier.payments.push({ amount: paymentAmount, notes, date: date || new Date() });
            supplier.totalPaid += paymentAmount;
            supplier.totalRest -= paymentAmount;

            await supplier.save();
            res.json(supplier);
        } else {
            res.status(404).json({ message: 'Supplier not found' });
        }
    } catch (error) {
        res.status(400).json({ message: 'Invalid payment data' });
    }
};

export const updateSupplierPayment = async (req: Request, res: Response) => {
    try {
        const { amount, notes, date } = req.body;
        const { id, paymentId } = req.params;
        const supplier = await Supplier.findById(id);

        if (supplier) {
            const paymentIndex = supplier.payments.findIndex(p => (p as any)._id.toString() === paymentId);
            if (paymentIndex === -1) {
                return res.status(404).json({ message: 'Payment not found' });
            }

            const oldAmount = supplier.payments[paymentIndex].amount;
            const newAmount = Number(amount);

            // Update payment
            supplier.payments[paymentIndex].amount = newAmount;
            supplier.payments[paymentIndex].notes = notes;
            supplier.payments[paymentIndex].date = date || supplier.payments[paymentIndex].date;

            // Update balance
            supplier.totalPaid = supplier.totalPaid - oldAmount + newAmount;
            supplier.totalRest = supplier.totalPurchases - supplier.totalPaid;

            await supplier.save();
            res.json(supplier);
        } else {
            res.status(404).json({ message: 'Supplier not found' });
        }
    } catch (error) {
        res.status(400).json({ message: 'Invalid payment data' });
    }
};

export const deleteSupplierPayment = async (req: Request, res: Response) => {
    try {
        const { id, paymentId } = req.params;
        const supplier = await Supplier.findById(id);

        if (supplier) {
            const paymentIndex = supplier.payments.findIndex(p => (p as any)._id.toString() === paymentId);
            if (paymentIndex === -1) {
                return res.status(404).json({ message: 'Payment not found' });
            }

            const amountToRemove = supplier.payments[paymentIndex].amount;

            // Remove payment
            supplier.payments.splice(paymentIndex, 1);

            // Update balance
            supplier.totalPaid -= amountToRemove;
            supplier.totalRest = supplier.totalPurchases - supplier.totalPaid;

            await supplier.save();
            res.json(supplier);
        } else {
            res.status(404).json({ message: 'Supplier not found' });
        }
    } catch (error) {
        res.status(400).json({ message: 'Error deleting payment' });
    }
};
