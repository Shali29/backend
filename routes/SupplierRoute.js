// SupplierRoute.js

import express from 'express';
import {
  getAllSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  loginSupplier
} from '../controllers/SupplierController.js';

const router = express.Router();

// Get all suppliers
router.get('/all', getAllSuppliers);

// Get a supplier by ID
router.get('/:id', getSupplierById);

// Create a new supplier
router.post('/create', createSupplier);

// Update an existing supplier
router.put('/update', updateSupplier);

// Delete a supplier
router.delete('/delete/:id', deleteSupplier);

// Supplier login (authentication)
router.post('/login', loginSupplier);

export default router;
