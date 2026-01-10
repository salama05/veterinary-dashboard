import express from 'express';
import { getTreatments, createTreatment, updateTreatment, deleteTreatment } from '../controllers/treatmentController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.route('/').get(protect, getTreatments).post(protect, createTreatment);
router.route('/:id').put(protect, updateTreatment).delete(protect, deleteTreatment);

export default router;
