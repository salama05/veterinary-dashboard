import { Request, Response } from 'express';
import Product from '../models/Product';
import Sale from '../models/Sale';
import Purchase from '../models/Purchase';
import Appointment from '../models/Appointment';

export const getDashboardStats = async (req: Request, res: Response) => {
    try {
        // 1. General Stats
        const totalProducts = await Product.countDocuments({ clinicId: (req as any).user.clinicId });

        // Aggregating Sales
        const salesAgg = await Sale.aggregate([
            { $match: { clinicId: (req as any).user.clinicId } },
            { $group: { _id: null, totalSales: { $sum: "$total" } } }
        ]);
        const totalSalesValue = salesAgg[0]?.totalSales || 0;

        // Aggregating Purchases
        const purchasesAgg = await Purchase.aggregate([
            { $match: { clinicId: (req as any).user.clinicId } },
            { $group: { _id: null, totalPurchases: { $sum: "$total" } } }
        ]);
        const totalPurchasesValue = purchasesAgg[0]?.totalPurchases || 0;

        // 2. Warnings
        const lowStockProducts = await Product.find({ clinicId: (req as any).user.clinicId, $expr: { $lte: ["$quantity", "$minLimit"] } }).limit(10);

        const today = new Date();
        const expiryWarningDate = new Date();
        expiryWarningDate.setDate(today.getDate() + 30); // Warn if expires in 30 days

        const expiringProducts = await Product.find({
            clinicId: (req as any).user.clinicId,
            expiryDate: { $lte: expiryWarningDate, $gte: today }
        }).limit(10);

        // 3. Upcoming Appointments
        const upcomingAppointments = await Appointment.find({
            date: { $gte: today },
            status: { $in: ['Scheduled', 'Confirmed'] },
            clinicId: (req as any).user.clinicId
        })
            .sort({ date: 1 })
            .limit(5)
            .populate('customer', 'name');

        // 4. Last Operations
        const lastSales = await Sale.find({ clinicId: (req as any).user.clinicId }).sort({ date: -1 }).limit(5).populate('product', 'name').populate('customer', 'name');
        const lastPurchases = await Purchase.find({ clinicId: (req as any).user.clinicId }).sort({ date: -1 }).limit(5).populate('product', 'name').populate('supplier', 'name');

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
            appointments: upcomingAppointments,
            recent: {
                sales: lastSales,
                purchases: lastPurchases
            }
        });
    } catch (error) {
        console.error('Dashboard Stats Error:', error);
        console.error('User Context:', (req as any).user);
        res.status(500).json({ message: 'Server Error' });
    }
};
