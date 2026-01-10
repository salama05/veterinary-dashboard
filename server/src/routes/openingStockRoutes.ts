import express from 'express';
import { getOpeningStocks, createOpeningStock, updateOpeningStock, deleteOpeningStock } from '../controllers/openingStockController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.route('/')
    .get(protect, getOpeningStocks)
    .post(protect, createOpeningStock);

router.route('/:id')
    .put(protect, updateOpeningStock)
    .delete(protect, deleteOpeningStock);

export default router;
