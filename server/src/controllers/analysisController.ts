import { Request, Response } from 'express';
import Sale from '../models/Sale';
import Purchase from '../models/Purchase';
import Treatment from '../models/Treatment';

export const getAnalysis = async (req: Request, res: Response) => {
    try {
        // 1. Monthly Sales & Purchases (Last 6 Months)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
        sixMonthsAgo.setDate(1); // Start of the month
        sixMonthsAgo.setHours(0, 0, 0, 0);

        const salesStats = await Sale.aggregate([
            {
                $match: {
                    date: { $gte: sixMonthsAgo },
                    clinicId: (req as any).user.clinicId
                }
            },
            {
                $group: {
                    _id: {
                        month: { $month: "$date" },
                        year: { $year: "$date" }
                    },
                    totalSales: { $sum: "$total" },
                    count: { $sum: 1 }
                }
            },
            { $sort: { "_id.year": 1, "_id.month": 1 } }
        ]);

        const purchasesStats = await Purchase.aggregate([
            {
                $match: {
                    date: { $gte: sixMonthsAgo },
                    clinicId: (req as any).user.clinicId
                }
            },
            {
                $group: {
                    _id: {
                        month: { $month: "$date" },
                        year: { $year: "$date" }
                    },
                    totalPurchases: { $sum: "$total" },
                    count: { $sum: 1 }
                }
            },
            { $sort: { "_id.year": 1, "_id.month": 1 } }
        ]);

        // Merge Sales and Purchases Stats
        const monthlyStats = [];
        const monthNames = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];

        // Helper to format date key
        const getKey = (year: number, month: number) => `${year}-${month}`;

        const validMonths = new Set();
        // Generate last 6 months keys to ensure continuity even with 0 data
        let currentIterDate = new Date(sixMonthsAgo);
        const now = new Date();
        while (currentIterDate <= now) {
            validMonths.add(getKey(currentIterDate.getFullYear(), currentIterDate.getMonth() + 1));
            currentIterDate.setMonth(currentIterDate.getMonth() + 1);
        }

        // Map data
        const salesMap = new Map();
        salesStats.forEach(s => salesMap.set(getKey(s._id.year, s._id.month), s.totalSales));

        const purchasesMap = new Map();
        purchasesStats.forEach(p => purchasesMap.set(getKey(p._id.year, p._id.month), p.totalPurchases));

        for (const dateKey of validMonths) {
            // @ts-ignore
            const [yearStr, monthStr] = dateKey.split('-');
            const monthIndex = parseInt(monthStr) - 1;

            monthlyStats.push({
                name: `${monthNames[monthIndex]} ${yearStr}`,
                sales: salesMap.get(dateKey) || 0,
                purchases: purchasesMap.get(dateKey) || 0,
                profit: (salesMap.get(dateKey) || 0) - (purchasesMap.get(dateKey) || 0)
            });
        }

        // 2. Top Performing Products (by Revenue) from Sales
        const topProducts = await Sale.aggregate([
            {
                $match: { clinicId: (req as any).user.clinicId }
            },
            {
                $group: {
                    _id: "$product",
                    totalRevenue: { $sum: "$total" },
                    totalQuantity: { $sum: "$quantity" }
                }
            },
            { $lookup: { from: 'products', localField: '_id', foreignField: '_id', as: 'productInfo' } },
            { $unwind: "$productInfo" },
            { $sort: { totalRevenue: -1 } },
            { $limit: 5 },
            {
                $project: {
                    name: "$productInfo.name",
                    value: "$totalRevenue"
                }
            }
        ]);


        // 3. Top Purchased Products
        const topPurchasedProducts = await Purchase.aggregate([
            {
                $match: { clinicId: (req as any).user.clinicId }
            },
            {
                $group: {
                    _id: "$product",
                    totalQuantity: { $sum: "$quantity" },
                    totalSpend: { $sum: "$total" }
                }
            },
            { $lookup: { from: 'products', localField: '_id', foreignField: '_id', as: 'productInfo' } },
            { $unwind: "$productInfo" },
            { $sort: { totalQuantity: -1 } },
            { $limit: 5 },
            {
                $project: {
                    name: "$productInfo.name",
                    value: "$totalQuantity"
                }
            }
        ]);

        // 4. Most Common Treatments (Proxy for Animal Types)
        const topTreatments = await Treatment.aggregate([
            {
                $match: { clinicId: (req as any).user.clinicId }
            },
            {
                $group: {
                    _id: "$treatmentName",
                    count: { $sum: 1 },
                    totalRevenue: { $sum: "$total" }
                }
            },
            { $sort: { count: -1 } },
            { $limit: 5 },
            {
                $project: {
                    name: "$_id",
                    value: "$count"
                }
            }
        ]);

        res.json({
            monthlyStats,
            topProducts, // Top Sold
            topPurchasedProducts,
            topTreatments
        });

    } catch (error) {
        console.error('Error fetching analysis:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
