import express from 'express';
import { getConsumedProducts, createConsumedProduct, updateConsumedProduct, deleteConsumedProduct } from '../controllers/consumedProductController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

// Add debug log to verify mount
router.use((req, res, next) => {
    console.log(`ConsumedProduct Router: ${req.method} ${req.url}`);
    next();
});

router.get('/', protect, getConsumedProducts);
router.post('/', protect, createConsumedProduct);

router.put('/:id', protect, updateConsumedProduct);
router.delete('/:id', protect, deleteConsumedProduct);

export default router;
