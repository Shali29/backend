import express from 'express';
import {
  getAllDrivers,
  getDriverById,
  createDriver,
  updateDriver,
  deleteDriver,
  requestOtpLogin,
  validateOtpLogin,
  updateDriverLocation  // import new function
} from '../controllers/DriverController.js';

const router = express.Router();

router.get('/AllDrivers', getAllDrivers);
router.get('/DriverById/:id', getDriverById);
router.post('/create', createDriver);
router.put('/updateDriver/:id', updateDriver);
router.delete('/deleteDriver/:id', deleteDriver);

router.post('/requestOtpLogin', requestOtpLogin);
router.post('/validateOtpLogin', validateOtpLogin);

// New endpoint for location updates
router.post('/update-location', updateDriverLocation);

export default router;
