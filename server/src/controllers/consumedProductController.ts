import { Request, Response } from 'express';
import ConsumedProduct from '../models/ConsumedProduct';
import Product from '../models/Product';

export const getConsumedProducts = async (req: Request, res: Response) => {
    try {
        const items = await ConsumedProduct.find({ clinicId: (req as any).user.clinicId }).populate('product', 'name').sort({ date: -1 });
        res.json(items);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

export const createConsumedProduct = async (req: Request, res: Response) => {
    try {
        const { date, product: productId, quantity, notes } = req.body;
        console.log('Creating consumed product with payload:', req.body);
        const qty = Number(quantity);

        if (!productId) {
            return res.status(400).json({ message: 'Product is required' });
        }
        if (!qty || qty <= 0) {
            return res.status(400).json({ message: 'Quantity must be greater than 0' });
        }

        const product = await Product.findOne({ _id: productId, clinicId: (req as any).user.clinicId });
        if (!product) {
            console.log(`Product with ID ${productId} not found`);
            return res.status(422).json({ message: 'Product not found in database' });
        }

        if (product.quantity < qty) {
            console.log(`Insufficient stock for product ${product.name}: available ${product.quantity}, requested ${qty}`);
            return res.status(400).json({ message: 'Insufficient stock' });
        }

        const consumed = new ConsumedProduct({
            date: date || new Date(),
            product: product._id,
            productName: product.name,
            quantity: qty,
            notes,
            clinicId: (req as any).user.clinicId,
        });

        const saved = await consumed.save();

        product.quantity -= qty;
        await product.save();

        res.status(201).json(saved);
    } catch (error: any) {
        console.error('Error creating consumed product:', error);
        res.status(400).json({
            message: error.message || 'Invalid consumed product data',
            error: process.env.NODE_ENV === 'development' ? error : undefined
        });
    }
};

export const updateConsumedProduct = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { date, product: productId, quantity, notes } = req.body;
        const newQty = Number(quantity);

        const oldRecord = await ConsumedProduct.findOne({ _id: id, clinicId: (req as any).user.clinicId });
        if (!oldRecord) {
            return res.status(404).json({ message: 'Consumed product record not found' });
        }

        const oldProductId = oldRecord.product.toString();
        const oldQty = oldRecord.quantity;

        // If product changed
        if (oldProductId !== productId) {
            // Revert old product stock
            const oldProduct = await Product.findOne({ _id: oldProductId, clinicId: (req as any).user.clinicId });
            if (oldProduct) {
                oldProduct.quantity += oldQty;
                await oldProduct.save();
            }

            // Deduct from new product stock
            const newProduct = await Product.findOne({ _id: productId, clinicId: (req as any).user.clinicId });
            if (!newProduct) {
                return res.status(422).json({ message: 'New product not found' });
            }
            if (newProduct.quantity < newQty) {
                return res.status(400).json({ message: 'Insufficient stock in new product' });
            }
            newProduct.quantity -= newQty;
            await newProduct.save();

            oldRecord.product = newProduct._id;
            oldRecord.productName = newProduct.name;
        } else {
            // Same product, adjust quantity difference
            const product = await Product.findOne({ _id: oldProductId, clinicId: (req as any).user.clinicId });
            if (!product) {
                return res.status(422).json({ message: 'Product not found' });
            }

            const diff = newQty - oldQty;
            if (product.quantity < diff) {
                return res.status(400).json({ message: 'Insufficient stock' });
            }

            product.quantity -= diff;
            await product.save();
        }

        oldRecord.date = date || oldRecord.date;
        oldRecord.quantity = newQty;
        oldRecord.notes = notes;

        const updated = await oldRecord.save();
        res.json(updated);
    } catch (error: any) {
        console.error('Error updating consumed product:', error);
        res.status(400).json({ message: error.message || 'Update failed' });
    }
};

export const deleteConsumedProduct = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const record = await ConsumedProduct.findOne({ _id: id, clinicId: (req as any).user.clinicId });
        if (!record) {
            return res.status(404).json({ message: 'Record not found' });
        }

        const product = await Product.findOne({ _id: record.product, clinicId: (req as any).user.clinicId });
        if (product) {
            product.quantity += record.quantity;
            await product.save();
        }

        await record.deleteOne();
        res.json({ message: 'Product consumption record deleted and stock reverted' });
    } catch (error: any) {
        console.error('Error deleting consumed product:', error);
        res.status(400).json({ message: error.message || 'Deletion failed' });
    }
};
