import express from 'express';
import {
  getAllDrivers,
  getDriverById,
  createDriver,
  updateDriver,
  deleteDriver,
  loginDriver,
  verifyOTP,
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

// POST login driver and send OTP
router.post('/login', loginDriver);

// POST verify OTP
router.post('/verify-otp', verifyOTP);

export default router;
