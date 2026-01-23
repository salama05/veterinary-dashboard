import { Request, Response } from 'express';
import OpeningStock from '../models/OpeningStock';
import Product from '../models/Product';

export const getOpeningStocks = async (req: Request, res: Response) => {
    try {
        const stocks = await OpeningStock.find({ clinicId: (req as any).user.clinicId }).populate('product', 'name');
        res.json(stocks);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

export const createOpeningStock = async (req: Request, res: Response) => {
    try {
        const { openingDate, product: productId, quantity, expiryDate, source, price } = req.body;

        if (!productId) {
            return res.status(400).json({ message: 'Product is required' });
        }

        const product = await Product.findOne({ _id: productId, clinicId: (req as any).user.clinicId });
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        const openingStock = new OpeningStock({
            openingDate: openingDate || new Date(),
            product: product._id,
            productName: product.name,
            quantity: Number(quantity),
            expiryDate,
            source,
            price: price ? Number(price) : undefined,
            clinicId: (req as any).user.clinicId,
        });

        const savedStock = await openingStock.save();

        // Update main inventory
        product.quantity += Number(quantity);
        if (expiryDate) product.expiryDate = expiryDate;
        // If price was provided and it's 0 or current price is 0, let's update it.
        // Or if the user provided a price in the opening stock, maybe they want to update the selling price?
        // Usually opening stock price is cost. But Product model price seems to be selling price.
        // I will stick to the behavior of purchaseController which doesn't update selling price unless asked.
        await product.save();

        res.status(201).json(savedStock);
    } catch (error) {
        console.error(error);
        res.status(400).json({ message: 'Invalid opening stock data' });
    }
};

export const updateOpeningStock = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { openingDate, product: productId, quantity, expiryDate, source, price } = req.body;
        const newQty = Number(quantity);

        const oldRecord = await OpeningStock.findOne({ _id: id, clinicId: (req as any).user.clinicId });
        if (!oldRecord) {
            return res.status(404).json({ message: 'Opening stock record not found' });
        }

        const oldProductId = oldRecord.product.toString();
        const oldQty = oldRecord.quantity;

        // If product changed
        if (oldProductId !== productId) {
            // Revert old product stock
            const oldProduct = await Product.findOne({ _id: oldProductId, clinicId: (req as any).user.clinicId });
            if (oldProduct) {
                oldProduct.quantity -= oldQty;
                await oldProduct.save();
            }

            // Add to new product stock
            const newProduct = await Product.findOne({ _id: productId, clinicId: (req as any).user.clinicId });
            if (!newProduct) {
                return res.status(422).json({ message: 'New product not found' });
            }
            newProduct.quantity += newQty;
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
            product.quantity += diff;
            await product.save();
        }

        oldRecord.openingDate = openingDate || oldRecord.openingDate;
        oldRecord.quantity = newQty;
        oldRecord.expiryDate = expiryDate;
        oldRecord.source = source;
        oldRecord.price = price ? Number(price) : oldRecord.price;

        const updated = await oldRecord.save();
        res.json(updated);
    } catch (error: any) {
        console.error('Error updating opening stock:', error);
        res.status(400).json({ message: error.message || 'Update failed' });
    }
};

export const deleteOpeningStock = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const record = await OpeningStock.findOne({ _id: id, clinicId: (req as any).user.clinicId });
        if (!record) {
            return res.status(404).json({ message: 'Record not found' });
        }

        const product = await Product.findOne({ _id: record.product, clinicId: (req as any).user.clinicId });
        if (product) {
            product.quantity -= record.quantity;
            await product.save();
        }

        await record.deleteOne();
        res.json({ message: 'Opening stock record deleted and stock reverted' });
    } catch (error: any) {
        console.error('Error deleting opening stock:', error);
        res.status(400).json({ message: error.message || 'Deletion failed' });
    }
};
