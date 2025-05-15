import express from 'express';
import { getNotificationsBySupplier, markNotificationRead } from '../controllers/NotificationController.js';

const router = express.Router();

router.get('/:supplierId', getNotificationsBySupplier);
router.put('/read/:id', markNotificationRead);

export default router;
