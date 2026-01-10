import express from 'express';
import {
    getSuppliers,
    createSupplier,
    updateSupplier,
    deleteSupplier,
    addSupplierPayment,
    updateSupplierPayment,
    deleteSupplierPayment,
} from '../controllers/supplierController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.route('/').get(protect, getSuppliers).post(protect, createSupplier);
router
    .route('/:id')
    .put(protect, updateSupplier)
    .delete(protect, deleteSupplier);
router.route('/:id/payment').post(protect, addSupplierPayment);
router
    .route('/:id/payment/:paymentId')
    .put(protect, updateSupplierPayment)
    .delete(protect, deleteSupplierPayment);

export default router;
