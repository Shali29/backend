import express from 'express';
import {
  getAllLoans,
  getLoanById,
  getLoansBySupplier,
  createLoan,
  updateLoan,
  deleteLoan,
  getLoanStatistics,
  updateLoanStatus,  // <-- Import new controller method
} from '../controllers/SupplierLoanController.js';

const router = express.Router();

router.get('/all', getAllLoans);
router.get('/:id', getLoanById);
router.get('/supplier/:supplierId', getLoansBySupplier);
router.post('/create', createLoan);
router.put('/update/:id', updateLoan);
router.put('/updateStatus/:id', updateLoanStatus); // <-- New route here
router.delete('/delete/:id', deleteLoan);
router.get('/statistics', getLoanStatistics);

export default router;
