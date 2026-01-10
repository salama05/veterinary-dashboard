import express from 'express';
import {
    getCustomers,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    addCustomerPayment,
    updateCustomerPayment,
    deleteCustomerPayment,
} from '../controllers/customerController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.route('/').get(protect, getCustomers).post(protect, createCustomer);
router
    .route('/:id')
    .put(protect, updateCustomer)
    .delete(protect, deleteCustomer);
router.route('/:id/payment').post(protect, addCustomerPayment);
router
    .route('/:id/payment/:paymentId')
    .put(protect, updateCustomerPayment)
    .delete(protect, deleteCustomerPayment);

export default router;
