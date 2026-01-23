import { Request, Response } from 'express';
import Customer from '../models/Customer';

export const getCustomers = async (req: Request, res: Response) => {
    try {
        const clinicId = (req as any).user.clinicId;
        let customers = await Customer.find({ clinicId });

        // Ensure "زبون عادي" exists
        const regularCustomerName = 'زبون عادي';
        let regularCustomer = customers.find(c => c.name === regularCustomerName);

        if (!regularCustomer) {
            regularCustomer = new Customer({
                name: regularCustomerName,
                address: 'إفتراضي',
                phone: '',
                clinicId
            });
            await regularCustomer.save();
            customers = await Customer.find({ clinicId }); // Refresh list
        }

        res.json(customers);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

export const createCustomer = async (req: Request, res: Response) => {
    try {
        // Since name must be unique, we should check uniqueness within the clinic if we want per-clinic unique names.
        // Assuming schema has unique: true on name globally, that might be a problem if different clinics want "Same Name".
        // We might need to change the schema unique index to compound { name, clinicId }.
        // For now, let's just create.
        const customer = new Customer({ ...req.body, clinicId: (req as any).user.clinicId });
        const createdCustomer = await customer.save();
        res.status(201).json(createdCustomer);
    } catch (error: any) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'الاسم موجود مسبقاً' });
        }
        res.status(400).json({ message: 'Invalid customer data' });
    }
};

export const updateCustomer = async (req: Request, res: Response) => {
    try {
        const customer = await Customer.findOne({ _id: req.params.id, clinicId: (req as any).user.clinicId });
        if (customer) {
            if (customer.name === 'زبون عادي' && req.body.name !== 'زبون عادي') {
                return res.status(400).json({ message: 'لا يمكن تغيير اسم الزبون العادي' });
            }
            Object.assign(customer, req.body);
            const updatedCustomer = await customer.save();
            res.json(updatedCustomer);
        } else {
            res.status(404).json({ message: 'Customer not found' });
        }
    } catch (error) {
        res.status(400).json({ message: 'Invalid customer data' });
    }
};

export const deleteCustomer = async (req: Request, res: Response) => {
    try {
        const customer = await Customer.findOne({ _id: req.params.id, clinicId: (req as any).user.clinicId });
        if (customer) {
            if (customer.name === 'زبون عادي') {
                return res.status(400).json({ message: 'لا يمكن حذف الزبون العادي' });
            }
            await customer.deleteOne();
            res.json({ message: 'Customer removed' });
        } else {
            res.status(404).json({ message: 'Customer not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

export const addCustomerPayment = async (req: Request, res: Response) => {
    try {
        const { amount, notes, date } = req.body;
        const customer = await Customer.findOne({ _id: req.params.id, clinicId: (req as any).user.clinicId });

        if (customer) {
            const paymentAmount = Number(amount);
            customer.payments.push({ amount: paymentAmount, notes, date: date || new Date() });

            // Safe increment and recalculate balance (Sales + Treatments) - Paid
            customer.totalPaid = (customer.totalPaid || 0) + paymentAmount;
            customer.totalRest = ((customer.totalSales || 0) + (customer.totalTreatments || 0)) - customer.totalPaid;

            await customer.save();
            res.json(customer);
        } else {
            res.status(404).json({ message: 'Customer not found' });
        }
    } catch (error) {
        res.status(400).json({ message: 'Invalid payment data' });
    }
};

export const updateCustomerPayment = async (req: Request, res: Response) => {
    try {
        const { amount, notes, date } = req.body;
        const { id, paymentId } = req.params;
        const customer = await Customer.findOne({ _id: id, clinicId: (req as any).user.clinicId });

        if (customer) {
            const paymentIndex = customer.payments.findIndex(p => (p as any)._id.toString() === paymentId);
            if (paymentIndex === -1) {
                return res.status(404).json({ message: 'Payment not found' });
            }

            const oldAmount = customer.payments[paymentIndex].amount;
            const newAmount = Number(amount);

            // Update payment
            customer.payments[paymentIndex].amount = newAmount;
            customer.payments[paymentIndex].notes = notes;
            customer.payments[paymentIndex].date = date || customer.payments[paymentIndex].date;

            // Update balance
            customer.totalPaid = customer.totalPaid - oldAmount + newAmount;
            customer.totalRest = customer.totalSales - customer.totalPaid;

            await customer.save();
            res.json(customer);
        } else {
            res.status(404).json({ message: 'Customer not found' });
        }
    } catch (error) {
        res.status(400).json({ message: 'Invalid payment data' });
    }
};

export const deleteCustomerPayment = async (req: Request, res: Response) => {
    try {
        const { id, paymentId } = req.params;
        const customer = await Customer.findOne({ _id: id, clinicId: (req as any).user.clinicId });

        if (customer) {
            const paymentIndex = customer.payments.findIndex(p => (p as any)._id.toString() === paymentId);
            if (paymentIndex === -1) {
                return res.status(404).json({ message: 'Payment not found' });
            }

            const amountToRemove = customer.payments[paymentIndex].amount;

            // Remove payment
            customer.payments.splice(paymentIndex, 1);

            // Update balance safely (Sales + Treatments) - Paid
            customer.totalPaid = Math.max(0, (customer.totalPaid || 0) - amountToRemove);
            customer.totalRest = ((customer.totalSales || 0) + (customer.totalTreatments || 0)) - customer.totalPaid;

            await customer.save();
            res.json(customer);
        } else {
            res.status(404).json({ message: 'Customer not found' });
        }
    } catch (error) {
        res.status(400).json({ message: 'Error deleting payment' });
    }
};
