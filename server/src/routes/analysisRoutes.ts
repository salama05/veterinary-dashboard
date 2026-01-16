import express from 'express';
import { getAnalysis } from '../controllers/analysisController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.get('/', protect, getAnalysis);

export default router;
