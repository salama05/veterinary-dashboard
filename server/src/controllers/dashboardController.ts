import { Request, Response } from 'express';
import Product from '../models/Product';
import Sale from '../models/Sale';
import Purchase from '../models/Purchase';

export const getDashboardStats = async (req: Request, res: Response) => {
    try {
        // 1. General Stats
        const totalProducts = await Product.countDocuments();

        // Aggregating Sales
        const salesAgg = await Sale.aggregate([
            { $group: { _id: null, totalSales: { $sum: "$total" } } }
        ]);
        const totalSalesValue = salesAgg[0]?.totalSales || 0;

        // Aggregating Purchases
        const purchasesAgg = await Purchase.aggregate([
            { $group: { _id: null, totalPurchases: { $sum: "$total" } } }
        ]);
        const totalPurchasesValue = purchasesAgg[0]?.totalPurchases || 0;

        // 2. Warnings
        const lowStockProducts = await Product.find({ $expr: { $lte: ["$quantity", "$minLimit"] } }).limit(10);

        const today = new Date();
        const expiryWarningDate = new Date();
        expiryWarningDate.setDate(today.getDate() + 30); // Warn if expires in 30 days

        const expiringProducts = await Product.find({
            expiryDate: { $lte: expiryWarningDate, $gte: today }
        }).limit(10);

        // 3. Last Operations
        const lastSales = await Sale.find().sort({ date: -1 }).limit(5).populate('product', 'name').populate('customer', 'name');
        const lastPurchases = await Purchase.find().sort({ date: -1 }).limit(5).populate('product', 'name').populate('supplier', 'name');

        res.json({
            stats: {
                totalProducts,
                totalSalesValue,
                totalPurchasesValue
            },
            warnings: {
                lowStock: lowStockProducts,
                expiring: expiringProducts
            },
            recent: {
                sales: lastSales,
                purchases: lastPurchases
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};
