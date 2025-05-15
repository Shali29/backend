import express from 'express';
import {
  getNotificationsBySupplier,
  markSupplierNotificationRead,
  getNotificationsByDriver,
  markDriverNotificationRead,
} from '../controllers/NotificationController.js';

const router = express.Router();

// Supplier routes
router.get('/supplier/:supplierId', getNotificationsBySupplier);
router.put('/supplier/read/:id', markSupplierNotificationRead);

// Driver routes
router.get('/driver/:driverId', getNotificationsByDriver);
router.put('/driver/read/:id', markDriverNotificationRead);

export default router;
