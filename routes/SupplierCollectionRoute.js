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

// ✅ STATIC ROUTES FIRST (always match exact paths first)
router.get('/all', getAllCollections);
router.get('/supplier/:supplierId', getCollectionsBySupplier);
router.get('/statistics', getCollectionStatistics);

// ✅ THEN DYNAMIC ROUTES (that use path params like :id)
router.get('/:id', getCollectionById);

// ✅ POST/PUT/DELETE
router.post('/create', createCollection);
router.put('/update', updateCollection);
router.delete('/delete/:id', deleteCollection);

export default router;
