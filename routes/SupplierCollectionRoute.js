// SupplierCollectionRoute.js

import express from 'express';
import {
  getAllCollections,
  getCollectionById,
  getCollectionsBySupplier,
  createCollection,
  updateCollection,
  deleteCollection,
  getCollectionStatistics
} from '../controllers/SupplierCollectionController.js';

const router = express.Router();

// Get all supplier collections (with supplier name)
router.get('/all', getAllCollections);

// Get a supplier collection by its ID
router.get('/:id', getCollectionById);

// Get all collections for a specific supplier
router.get('/supplier/:supplierId', getCollectionsBySupplier);

// Create a new supplier collection
router.post('/create', createCollection);

// Update an existing supplier collection
router.put('/update', updateCollection);

// Delete a supplier collection by its ID
router.delete('/delete/:id', deleteCollection);

// Get collection statistics (total, sum, average, daily, etc.)
router.get('/statistics', getCollectionStatistics);

export default router;
