import express from 'express';
import {
  getAllDrivers,
  getDriverById,
  createDriver,
  updateDriver,
  deleteDriver,
  requestOtpLogin,  // Added this import
  validateOtpLogin  // Added this import
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

// POST Request OTP for driver login
router.post('/requestOtpLogin', requestOtpLogin);  // Add this route

// POST Validate OTP for driver login
router.post('/validateOtpLogin', validateOtpLogin);  // Add this route

export default router;
