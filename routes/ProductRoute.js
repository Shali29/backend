// ProductsRoute.js

import express from 'express';
import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  updateProductStock,
  deleteProduct
} from '../controllers/ProductsController.js';

const router = express.Router();

// Get all products
router.get('/all', getAllProducts);

// Get a product by ID
router.get('/:id', getProductById);

// Create a new product
router.post('/create', createProduct);

// Update an existing product
router.put('/update/:id', updateProduct);

// Update product stock (deduct quantity)
router.put('/updateStock/:id', updateProductStock);

// Delete a product
router.delete('/delete/:id', deleteProduct);

export default router;
