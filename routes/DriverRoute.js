// DriverRoute.js

import express from 'express';
import {
  getAllDrivers,
  getDriverById,
  createDriver,
  updateDriver,
  deleteDriver
} from '../controllers/DriverController.js';

const router = express.Router();

// GET all drivers
router.get('/AllDrivers', getAllDrivers);

// GET driver by ID
router.get('/DriverById/:id', getDriverById);

// POST create new driver
router.post('/create', createDriver);

// PUT update driver
router.put('/updateDriver/:id', updateDriver);

// DELETE driver
router.delete('/deleteDriver/:id', deleteDriver);

export default router;
