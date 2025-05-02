// SupplierPaymentRoute.js

import express from 'express';
import {
  getAllPayments,
  getPaymentsBySupplier,
  getPaymentById,
  createPayment,
  updatePayment,
  deletePayment,
  updatePaymentStatus,
  calculatePayment,
  getPaymentStatistics
} from '../controllers/SupplierPaymentController.js';

const router = express.Router();

// Get all supplier payments
router.get('/all', getAllPayments);

// Get payments for a specific supplier
router.get('/supplier/:supplierId', getPaymentsBySupplier);

// Get a single payment by ID
router.get('/:id', getPaymentById);

// Create a new supplier payment
router.post('/create', createPayment);

// Update a supplier payment
router.put('/update/:id', updatePayment);

// Delete a supplier payment
router.delete('/delete/:id', deletePayment);

// Update status of a supplier payment
router.put('/updateStatus/:id', updatePaymentStatus);

// Calculate payment data for a supplier
router.get('/calculate/:supplierId', calculatePayment);

// Get supplier payment statistics
router.get('/statistics', getPaymentStatistics);

export default router;
