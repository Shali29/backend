// SupplierAdvanceRoute.js

import express from 'express';
import {
  getAllAdvances,
  getAdvancesBySupplier,
  getAdvanceById,
  createAdvance,
  updateAdvance,
  deleteAdvance,
  updateAdvanceStatus,
  getAdvanceStatistics
} from '../controllers/SupplierAdvanceController.js';

const router = express.Router();

// Get all supplier advances
router.get('/all', getAllAdvances);

// Get all advances for a specific supplier
router.get('/supplier/:supplierId', getAdvancesBySupplier);

// Get a single advance by ID
router.get('/:id', getAdvanceById);

// Create a new supplier advance
router.post('/create', createAdvance);

// Update an existing advance
router.put('/update/:id', updateAdvance);

// Delete an advance
router.delete('/delete/:id', deleteAdvance);

// Update only the status of an advance
router.put('/updateStatus/:id', updateAdvanceStatus);

// Get statistics about advances
router.get('/statistics', getAdvanceStatistics);

export default router;
