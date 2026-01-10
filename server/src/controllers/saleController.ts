import { Request, Response } from 'express';
import Sale from '../models/Sale';
import Product from '../models/Product';
import Customer from '../models/Customer';

export const getSales = async (req: Request, res: Response) => {
    try {
        const sales = await Sale.find({})
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
        const productDoc = await Product.findById(product);
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
        });

        const savedSale = await sale.save();

        // Update Stock
        productDoc.quantity -= qty;
        await productDoc.save();

        // Update Customer Balance
        const customerDoc = await Customer.findById(customer);
        if (customerDoc) {
            customerDoc.totalSales += total;
            customerDoc.totalPaid += paidAmount;
            customerDoc.totalRest += rest;
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

        const oldSale = await Sale.findById(id);
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
            const oldProduct = await Product.findById(oldSale.product);
            if (oldProduct) {
                oldProduct.quantity += oldSale.quantity; // Add back old quantity
                await oldProduct.save();
            }
        }

        // Revert old customer balance
        if (oldSale.customer) {
            const oldCustomer = await Customer.findById(oldSale.customer);
            if (oldCustomer) {
                oldCustomer.totalSales -= oldSale.total;
                oldCustomer.totalPaid -= oldSale.paid;
                oldCustomer.totalRest -= oldSale.rest;
                await oldCustomer.save();
            }
        }

        // Check new product stock
        const newProduct = await Product.findById(product);
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
        const newCustomer = await Customer.findById(customer);
        if (newCustomer) {
            newCustomer.totalSales += total;
            newCustomer.totalPaid += paidAmount;
            newCustomer.totalRest += rest;
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

        const sale = await Sale.findById(id);
        if (!sale) {
            return res.status(404).json({ message: 'Sale not found' });
        }

        // Revert product stock
        if (sale.product) {
            const product = await Product.findById(sale.product);
            if (product) {
                product.quantity += sale.quantity; // Add back quantity
                await product.save();
            }
        }

        // Revert customer balance
        if (sale.customer) {
            const customer = await Customer.findById(sale.customer);
            if (customer) {
                customer.totalSales -= sale.total;
                customer.totalPaid -= sale.paid;
                customer.totalRest -= sale.rest;
                await customer.save();
            }
        }

        await Sale.findByIdAndDelete(id);
        res.json({ message: 'Sale deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

