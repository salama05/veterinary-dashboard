import { Request, Response } from 'express';
import Purchase from '../models/Purchase';
import Product from '../models/Product';
import Supplier from '../models/Supplier';

export const getPurchases = async (req: Request, res: Response) => {
    try {
        const purchases = await Purchase.find({})
            .populate('product', 'name')
            .populate('supplier', 'name');
        res.json(purchases);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

export const createPurchase = async (req: Request, res: Response) => {
    try {
        const { product, quantity, price, supplier, expiryDate, date } = req.body;
        const qty = Number(quantity);
        const cost = Number(price);
        const total = qty * cost;

        const purchase = new Purchase({
            product,
            quantity: qty,
            price: cost,
            total,
            supplier,
            expiryDate,
            date: date || new Date(),
        });

        const savedPurchase = await purchase.save();

        // Update Product Stock
        const productDoc = await Product.findById(product);
        if (productDoc) {
            productDoc.quantity += qty;
            // Update price if needed? Or just keep latest. 
            // User requirement says product has "Price". This might be selling price. 
            // Purchase price is cost. 
            // I will NOT update product selling price automatically unless asked.
            if (expiryDate) productDoc.expiryDate = expiryDate;
            await productDoc.save();
        }

        // Update Supplier Balance
        const supplierDoc = await Supplier.findById(supplier);
        if (supplierDoc) {
            supplierDoc.totalPurchases += total;
            supplierDoc.totalRest += total; // Assuming credit purchase initially
            await supplierDoc.save();
        }

        res.status(201).json(savedPurchase);
    } catch (error) {
        res.status(400).json({ message: 'Invalid purchase data' });
    }
};

export const deletePurchase = async (req: Request, res: Response) => {
    try {
        const purchase = await Purchase.findById(req.params.id);
        if (!purchase) {
            return res.status(404).json({ message: 'Purchase not found' });
        }

        // Revert Product Stock
        const product = await Product.findById(purchase.product);
        if (product) {
            product.quantity -= purchase.quantity;
            await product.save();
        }

        // Revert Supplier Balance
        const supplier = await Supplier.findById(purchase.supplier);
        if (supplier) {
            supplier.totalPurchases -= purchase.total;
            // Assuming we also revert the debt (Rest)
            supplier.totalRest -= purchase.total;
            await supplier.save();
        }

        await purchase.deleteOne();
        res.json({ message: 'Purchase removed' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

export const updatePurchase = async (req: Request, res: Response) => {
    try {
        const purchase = await Purchase.findById(req.params.id);
        if (!purchase) {
            return res.status(404).json({ message: 'Purchase not found' });
        }

        const { product: productId, quantity, price, supplier: supplierId, expiryDate, date } = req.body;
        const newQty = Number(quantity);
        const newCost = Number(price);
        const newTotal = newQty * newCost;

        // 1. Revert Old Effects
        const oldProduct = await Product.findById(purchase.product);
        if (oldProduct) {
            oldProduct.quantity -= purchase.quantity;
            await oldProduct.save();
        }

        const oldSupplier = await Supplier.findById(purchase.supplier);
        if (oldSupplier) {
            oldSupplier.totalPurchases -= purchase.total;
            oldSupplier.totalRest -= purchase.total;
            await oldSupplier.save();
        }

        // 2. Apply New Effects
        const newProduct = await Product.findById(productId);
        if (newProduct) {
            newProduct.quantity += newQty;
            if (expiryDate) newProduct.expiryDate = expiryDate;
            await newProduct.save();
        }

        const newSupplier = await Supplier.findById(supplierId);
        if (newSupplier) {
            newSupplier.totalPurchases += newTotal;
            newSupplier.totalRest += newTotal;
            await newSupplier.save();
        }

        // 3. Update Purchase Record
        purchase.product = productId;
        purchase.quantity = newQty;
        purchase.price = newCost;
        purchase.total = newTotal;
        purchase.supplier = supplierId;
        purchase.expiryDate = expiryDate;
        if (date) purchase.date = date;

        const updatedPurchase = await purchase.save();
        res.json(updatedPurchase);
    } catch (error) {
        res.status(400).json({ message: 'Invalid purchase data' });
    }
};
