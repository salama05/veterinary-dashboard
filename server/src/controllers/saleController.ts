import { Request, Response } from 'express';
import Sale from '../models/Sale';
import Product from '../models/Product';
import Customer from '../models/Customer';

export const getSales = async (req: Request, res: Response) => {
    try {
        const sales = await Sale.find({ clinicId: (req as any).user.clinicId })
            .populate('product', 'name')
            .populate('customer', 'name');
        res.json(sales);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

export const createSale = async (req: Request, res: Response) => {
    try {
        const { product, quantity, price, customer, paid, date } = req.body;
        const qty = Number(quantity);
        const salePrice = Number(price);
        const total = qty * salePrice;
        const paidAmount = Number(paid || 0);
        const rest = total - paidAmount;

        // Check Stock
        const productDoc = await Product.findOne({ _id: product, clinicId: (req as any).user.clinicId });
        if (!productDoc) {
            return res.status(404).json({ message: 'Product not found' });
        }
        if (productDoc.quantity < qty) {
            return res.status(400).json({ message: 'Insufficient stock' });
        }

        const sale = new Sale({
            product,
            quantity: qty,
            price: salePrice,
            total,
            customer,
            paid: paidAmount,
            rest,
            date: date || new Date(),
            clinicId: (req as any).user.clinicId,
        });

        const savedSale = await sale.save();

        // Update Stock
        productDoc.quantity -= qty;
        await productDoc.save();

        // Update Customer Balance
        const customerDoc = await Customer.findOne({ _id: customer, clinicId: (req as any).user.clinicId });
        if (customerDoc) {
            customerDoc.totalSales = (customerDoc.totalSales || 0) + total;
            customerDoc.totalPaid = (customerDoc.totalPaid || 0) + paidAmount;
            customerDoc.totalRest = customerDoc.totalSales - customerDoc.totalPaid;
            await customerDoc.save();
        }

        res.status(201).json(savedSale);
    } catch (error) {
        res.status(400).json({ message: 'Invalid sale data' });
    }
};

export const updateSale = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { product, quantity, price, customer, paid, date } = req.body;

        const oldSale = await Sale.findOne({ _id: id, clinicId: (req as any).user.clinicId });
        if (!oldSale) {
            return res.status(404).json({ message: 'Sale not found' });
        }

        const qty = Number(quantity);
        const salePrice = Number(price);
        const total = qty * salePrice;
        const paidAmount = Number(paid || 0);
        const rest = total - paidAmount;

        // Revert old product stock
        if (oldSale.product) {
            const oldProduct = await Product.findOne({ _id: oldSale.product, clinicId: (req as any).user.clinicId });
            if (oldProduct) {
                oldProduct.quantity += oldSale.quantity; // Add back old quantity
                await oldProduct.save();
            }
        }

        // Revert old customer balance
        if (oldSale.customer) {
            const oldCustomer = await Customer.findOne({ _id: oldSale.customer, clinicId: (req as any).user.clinicId });
            if (oldCustomer) {
                oldCustomer.totalSales = Math.max(0, (oldCustomer.totalSales || 0) - oldSale.total);
                oldCustomer.totalPaid = Math.max(0, (oldCustomer.totalPaid || 0) - oldSale.paid);
                oldCustomer.totalRest = oldCustomer.totalSales - oldCustomer.totalPaid;
                await oldCustomer.save();
            }
        }

        // Check new product stock
        const newProduct = await Product.findOne({ _id: product, clinicId: (req as any).user.clinicId });
        if (!newProduct) {
            return res.status(404).json({ message: 'Product not found' });
        }
        if (newProduct.quantity < qty) {
            return res.status(400).json({ message: 'Insufficient stock' });
        }

        // Update sale
        oldSale.product = product;
        oldSale.quantity = qty;
        oldSale.price = salePrice;
        oldSale.total = total;
        oldSale.customer = customer;
        oldSale.paid = paidAmount;
        oldSale.rest = rest;
        oldSale.date = date || oldSale.date;

        const updatedSale = await oldSale.save();

        // Update new product stock
        newProduct.quantity -= qty;
        await newProduct.save();

        // Update new customer balance
        const newCustomer = await Customer.findOne({ _id: customer, clinicId: (req as any).user.clinicId });
        if (newCustomer) {
            newCustomer.totalSales = (newCustomer.totalSales || 0) + total;
            newCustomer.totalPaid = (newCustomer.totalPaid || 0) + paidAmount;
            newCustomer.totalRest = newCustomer.totalSales - newCustomer.totalPaid;
            await newCustomer.save();
        }

        res.json(updatedSale);
    } catch (error) {
        res.status(400).json({ message: 'Invalid sale data' });
    }
};

export const deleteSale = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const sale = await Sale.findOne({ _id: id, clinicId: (req as any).user.clinicId });
        if (!sale) {
            return res.status(404).json({ message: 'Sale not found' });
        }

        // Revert product stock
        if (sale.product) {
            const product = await Product.findOne({ _id: sale.product, clinicId: (req as any).user.clinicId });
            if (product) {
                product.quantity += sale.quantity; // Add back quantity
                await product.save();
            }
        }

        // Revert customer balance
        if (sale.customer) {
            const customer = await Customer.findOne({ _id: sale.customer, clinicId: (req as any).user.clinicId });
            if (customer) {
                customer.totalSales = Math.max(0, (customer.totalSales || 0) - sale.total);
                customer.totalPaid = Math.max(0, (customer.totalPaid || 0) - sale.paid);
                customer.totalRest = customer.totalSales - customer.totalPaid;
                await customer.save();
            }
        }

        await Sale.findOneAndDelete({ _id: id, clinicId: (req as any).user.clinicId });
        res.json({ message: 'Sale deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

