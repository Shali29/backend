import db from '../config/db.js';


// Driver Model Methods - Internal functions
const getAll = async () => {
  try {
    const [rows] = await db.query('SELECT * FROM Driver');
    return rows;
  } catch (error) {
    throw error;
  }
};

const getById = async (id) => {
  try {
    const [rows] = await db.query('SELECT * FROM Driver WHERE D_RegisterID = ?', [id]);
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    throw error;
  }
};

const create = async (driverData) => {
  try {
    const query = `
      INSERT INTO Driver (
        D_RegisterID, D_FullName, D_ContactNumber, Email, VehicalNumber, Route, Serial_Code
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await db.query(query, [
      driverData.D_RegisterID,
      driverData.D_FullName,
      driverData.D_ContactNumber,
      driverData.Email,
      driverData.VehicalNumber,
      driverData.Route,
      driverData.Serial_Code,
    ]);
    return result;
  } catch (error) {
    throw error;
  }
};

const update = async (id, driverData) => {
  try {
    const query = `
      UPDATE Driver SET 
        D_FullName = ?, 
        D_ContactNumber = ?, 
        Email = ?, 
        VehicalNumber = ?, 
        Route = ?, 
        Serial_Code = ?
      WHERE D_RegisterID = ?
    `;
    const [result] = await db.query(query, [
      driverData.D_FullName,
      driverData.D_ContactNumber,
      driverData.Email,
      driverData.VehicalNumber,
      driverData.Route,
      driverData.Serial_Code,
      id,
    ]);
    return result;
  } catch (error) {
    throw error;
  }
};

const deleteDriverById = async (id) => {
  try {
    const [result] = await db.query('DELETE FROM Driver WHERE D_RegisterID = ?', [id]);
    return result;
  } catch (error) {
    throw error;
  }
};

// Controller functions - Exported for routes
export const getAllDrivers = async (req, res) => {
  try {
    const drivers = await getAll();
    res.status(200).json(drivers);
  } catch (error) {
    console.error('Error getting drivers:', error);
    res.status(500).json({ message: 'Error fetching drivers', error: error.message });
  }
};

export const getDriverById = async (req, res) => {
  try {
    const driver = await getById(req.params.id);
    if (!driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }
    res.status(200).json(driver);
  } catch (error) {
    console.error('Error getting driver:', error);
    res.status(500).json({ message: 'Error fetching driver', error: error.message });
  }
};

export const createDriver = async (req, res) => {
  try {
    const requiredFields = ['D_RegisterID', 'D_FullName', 'D_ContactNumber', 'Email', 'VehicalNumber', 'Route'];
    for (const field of requiredFields) {
      if (!req.body[field]) {
        return res.status(400).json({ message: `${field} is required` });
      }
    }

    await create(req.body);
    res.status(201).json({ message: 'Driver created successfully' });
  } catch (error) {
    console.error('Error creating driver:', error);
    res.status(500).json({ message: 'Error creating driver', error: error.message });
  }
};

export const updateDriver = async (req, res) => {
  try {
    const driver = await getById(req.params.id);
    if (!driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }

    await update(req.params.id, req.body);
    res.status(200).json({ message: 'Driver updated successfully' });
  } catch (error) {
    console.error('Error updating driver:', error);
    res.status(500).json({ message: 'Error updating driver', error: error.message });
  }
};

export const deleteDriver = async (req, res) => {
  try {
    const driver = await getById(req.params.id);
    if (!driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }

    await deleteDriverById(req.params.id);
    res.status(200).json({ message: 'Driver deleted successfully' });
  } catch (error) {
    console.error('Error deleting driver:', error);
    res.status(500).json({ message: 'Error deleting driver', error: error.message });
  }
};