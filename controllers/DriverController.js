import db from '../config/db.js';
import { generateOTP, sendOTPEmail } from '../helpers/otpHelper.js';

// Get all drivers
export const getAllDrivers = async (req, res) => {
  try {
    const [drivers] = await db.query('SELECT * FROM Driver');
    res.status(200).json(drivers);
  } catch (error) {
    console.error('Error getting drivers:', error);
    res.status(500).json({ message: 'Error fetching drivers', error: error.message });
  }
};

// Get a single driver by ID
export const getDriverById = async (req, res) => {
  try {
    const [results] = await db.query('SELECT * FROM Driver WHERE D_RegisterID = ?', [req.params.id]);
    
    if (results.length === 0) {
      return res.status(404).json({ message: 'Driver not found' });
    }
    res.status(200).json(results[0]);
  } catch (error) {
    console.error('Error getting driver:', error);
    res.status(500).json({ message: 'Error fetching driver', error: error.message });
  }
};

// Create a new driver
export const createDriver = async (req, res) => {
  try {
    const { D_RegisterID, D_FullName, D_ContactNumber, Email, VehicalNumber, Route, Serial_Code } = req.body;

    // Validate required fields
    if (!D_RegisterID || !D_FullName || !D_ContactNumber || !Email || !VehicalNumber || !Route) {
      return res.status(400).json({
        message: 'All fields (D_RegisterID, D_FullName, D_ContactNumber, Email, VehicalNumber, Route) are required',
      });
    }

    // Insert into database
    const [result] = await db.query(
      `INSERT INTO Driver (D_RegisterID, D_FullName, D_ContactNumber, Email, VehicalNumber, Route, Serial_Code) 
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [D_RegisterID, D_FullName, D_ContactNumber, Email, VehicalNumber, Route, Serial_Code]
    );

    res.status(201).json({
      message: 'Driver created successfully',
      driverId: result.insertId,
    });
  } catch (error) {
    console.error('Error creating driver:', error);
    res.status(500).json({ message: 'Error creating driver', error: error.message });
  }
};

// Update a driver
export const updateDriver = async (req, res) => {
  try {
    const { D_FullName, D_ContactNumber, Email, VehicalNumber, Route, Serial_Code } = req.body;

    // Check if the driver exists
    const [driver] = await db.query('SELECT * FROM Driver WHERE D_RegisterID = ?', [req.params.id]);
    if (driver.length === 0) {
      return res.status(404).json({ message: 'Driver not found' });
    }

    // Update driver data
    await db.query(
      `UPDATE Driver SET D_FullName = ?, D_ContactNumber = ?, Email = ?, VehicalNumber = ?, Route = ?, Serial_Code = ? 
      WHERE D_RegisterID = ?`,
      [D_FullName, D_ContactNumber, Email, VehicalNumber, Route, Serial_Code, req.params.id]
    );

    res.status(200).json({ message: 'Driver updated successfully' });
  } catch (error) {
    console.error('Error updating driver:', error);
    res.status(500).json({ message: 'Error updating driver', error: error.message });
  }
};

// Delete a driver
export const deleteDriver = async (req, res) => {
  try {
    // Check if driver exists
    const [driver] = await db.query('SELECT * FROM Driver WHERE D_RegisterID = ?', [req.params.id]);
    if (driver.length === 0) {
      return res.status(404).json({ message: 'Driver not found' });
    }

    // Delete driver
    await db.query('DELETE FROM Driver WHERE D_RegisterID = ?', [req.params.id]);

    res.status(200).json({ message: 'Driver deleted successfully' });
  } catch (error) {
    console.error('Error deleting driver:', error);
    res.status(500).json({ message: 'Error deleting driver', error: error.message });
  }
};

// Driver login (Generate OTP)
export const loginDriver = async (req, res) => {
  try {
    const { D_RegisterID } = req.body;

    // Check if driver exists
    const [driver] = await db.query('SELECT * FROM Driver WHERE D_RegisterID = ?', [D_RegisterID]);
    if (driver.length === 0) {
      return res.status(404).json({ message: 'Driver not found' });
    }

    // Generate OTP
    const otp = generateOTP();

    // Send OTP to driver's email
    await sendOTPEmail(driver[0].Email, otp);

    // Store OTP in session (or use another persistent method)
    req.session.otp = otp;
    req.session.driverId = D_RegisterID;

    res.status(200).json({ message: 'OTP sent to email' });
  } catch (error) {
    console.error('Error during driver login:', error);
    res.status(500).json({ message: 'Error during login', error: error.message });
  }
};

// Verify OTP for driver login
export const verifyOTP = async (req, res) => {
  try {
    const { otpEntered } = req.body;

    // Check if OTP matches
    if (req.session.otp !== otpEntered) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    // Clear OTP from session (security measure)
    req.session.otp = null;

    res.status(200).json({ message: 'Driver logged in successfully' });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({ message: 'Error verifying OTP', error: error.message });
  }
};
