// TeaPacketFertilizerRoute.js

import express from 'express';
import {
  getAllOrders,
  getOrderById,
  getOrdersBySupplier,
  createOrder,
  updateOrderStatus,
  updateOrder,
  deleteOrder,
  createBulkOrders
} from '../controllers/TeaPacketFertilizerController.js';

const router = express.Router();

// Get all tea packet/fertilizer orders
router.get('/all', getAllOrders);

// Get an order by its ID
router.get('/:id', getOrderById);

// Get all orders for a specific supplier
router.get('/supplier/:supplierId', getOrdersBySupplier);

// Create a new order
router.post('/create', createOrder);

// Update the status of an order
router.put('/updateStatus/:id', updateOrderStatus);

// Update an order
router.put('/update/:id', updateOrder);

// Delete an order
router.delete('/delete/:id', deleteOrder);

router.post('/createBulk', createBulkOrders);


export default router;
