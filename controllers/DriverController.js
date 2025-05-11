import db from '../config/db.js';

// Driver Model Methods - Internal functions
const getAll = async () => {
  try {
    await db.poolConnect; // Ensure pool is connected
    const result = await db.pool.request().query('SELECT * FROM Driver');
    return result.recordset; // Return the rows as a recordset
  } catch (error) {
    throw error;
  }
};

const getById = async (id) => {
  try {
    await db.poolConnect;
    const request = db.pool.request();
    request.input('id', db.sql.VarChar, id);
    
    const result = await request.query('SELECT * FROM Driver WHERE D_RegisterID = @id');
    return result.recordset.length > 0 ? result.recordset[0] : null;
  } catch (error) {
    throw error;
  }
};

const create = async (driverData) => {
  try {
    await db.poolConnect;
    const request = db.pool.request();

    request.input('D_RegisterID', db.sql.VarChar, driverData.D_RegisterID);
    request.input('D_FullName', db.sql.NVarChar, driverData.D_FullName);
    request.input('D_ContactNumber', db.sql.VarChar, driverData.D_ContactNumber);
    request.input('Email', db.sql.VarChar, driverData.Email);
    request.input('VehicalNumber', db.sql.VarChar, driverData.VehicalNumber);
    request.input('Route', db.sql.NVarChar, driverData.Route);
    request.input('Serial_Code', db.sql.VarChar, driverData.Serial_Code);

    const result = await request.query(`
      INSERT INTO Driver (
        D_RegisterID, D_FullName, D_ContactNumber, Email, VehicalNumber, Route, Serial_Code
      ) VALUES (
        @D_RegisterID, @D_FullName, @D_ContactNumber, @Email, @VehicalNumber, @Route, @Serial_Code
      )
    `);

    return result;
  } catch (error) {
    throw error;
  }
};

const update = async (id, driverData) => {
  try {
    await db.poolConnect;
    const request = db.pool.request();

    request.input('D_FullName', db.sql.NVarChar, driverData.D_FullName);
    request.input('D_ContactNumber', db.sql.VarChar, driverData.D_ContactNumber);
    request.input('Email', db.sql.VarChar, driverData.Email);
    request.input('VehicalNumber', db.sql.VarChar, driverData.VehicalNumber);
    request.input('Route', db.sql.NVarChar, driverData.Route);
    request.input('Serial_Code', db.sql.VarChar, driverData.Serial_Code);
    request.input('D_RegisterID', db.sql.VarChar, id);

    const result = await request.query(`
      UPDATE Driver SET 
        D_FullName = @D_FullName, 
        D_ContactNumber = @D_ContactNumber, 
        Email = @Email, 
        VehicalNumber = @VehicalNumber, 
        Route = @Route, 
        Serial_Code = @Serial_Code
      WHERE D_RegisterID = @D_RegisterID
    `);

    return result;
  } catch (error) {
    throw error;
  }
};

const deleteDriverById = async (id) => {
  try {
    await db.poolConnect;
    const request = db.pool.request();
    request.input('id', db.sql.VarChar, id);

    const result = await request.query('DELETE FROM Driver WHERE D_RegisterID = @id');
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
