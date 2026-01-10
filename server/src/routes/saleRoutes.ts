import express from 'express';
import { getSales, createSale, updateSale, deleteSale } from '../controllers/saleController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.route('/').get(protect, getSales).post(protect, createSale);
router.route('/:id').put(protect, updateSale).delete(protect, deleteSale);

export default router;
