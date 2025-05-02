// SupplierLoanRoute.js

import express from 'express';
import {
  getAllLoans,
  getLoanById,
  getLoansBySupplier,
  createLoan,
  updateLoan,
  deleteLoan,
  getLoanStatistics
} from '../controllers/SupplierLoanController.js';

const router = express.Router();

// Get all supplier loans
router.get('/all', getAllLoans);

// Get a single loan by its ID
router.get('/:id', getLoanById);

// Get all loans for a specific supplier
router.get('/supplier/:supplierId', getLoansBySupplier);

// Create a new supplier loan
router.post('/create', createLoan);

// Update an existing supplier loan
router.put('/update/:id', updateLoan);

// Delete a supplier loan
router.delete('/delete/:id', deleteLoan);

// Get supplier loan statistics
router.get('/statistics', getLoanStatistics);

export default router;
