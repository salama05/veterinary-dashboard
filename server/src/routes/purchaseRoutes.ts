import express from 'express';
import { getPurchases, createPurchase, deletePurchase, updatePurchase } from '../controllers/purchaseController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.route('/').get(protect, getPurchases).post(protect, createPurchase);
router.route('/:id').delete(protect, deletePurchase).put(protect, updatePurchase);

export default router;
