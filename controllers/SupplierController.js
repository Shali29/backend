import db from '../config/db.js'; // Adjust the path as necessary
import bcrypt from 'bcryptjs';
// or: const bcrypt = require('bcryptjs');

import jwt from 'jsonwebtoken';

// Helper function to generate JWT token
const generateToken = (supplier) => {
  return jwt.sign(
    { id: supplier.S_RegisterID, username: supplier.Username },
    process.env.JWT_SECRET,
    { expiresIn: '1d' }
  );
};

// Supplier Model Methods - These are now internal functions in the controller file
const getAll = async () => {
  try {
    await db.poolConnect;
    const result = await db.pool.request().query(`
      SELECT S_RegisterID, S_FullName, S_Address, S_ContactNo, Email FROM Supplier
    `);
    return result.recordset;
  } catch (error) {
    throw error;
  }
};


const getById = async (id) => {
  try {
    await db.poolConnect;
    const request = db.pool.request();
    request.input('id', db.sql.VarChar, id);

    const result = await request.query(`
      SELECT S_RegisterID, S_FullName, S_Address, S_ContactNo, Email, AccountNumber, BankName, Branch 
      FROM Supplier 
      WHERE S_RegisterID = @id
    `);

    return result.recordset.length === 0 ? null : result.recordset[0];
  } catch (error) {
    throw error;
  }
};


const create = async (supplierData) => {
  try {
    await db.poolConnect; // ensure pool is connected
    const hashedPassword = await bcrypt.hash(supplierData.password, 10);
    const request = db.pool.request();

    // Bind input parameters
    request.input('S_RegisterID', db.sql.VarChar, supplierData.S_RegisterID);
    request.input('S_FullName', db.sql.NVarChar, supplierData.S_FullName);
    request.input('S_Address', db.sql.NVarChar, supplierData.S_Address);
    request.input('S_ContactNo', db.sql.VarChar, supplierData.S_ContactNo);
    request.input('AccountNumber', db.sql.VarChar, supplierData.AccountNumber);
    request.input('BankName', db.sql.VarChar, supplierData.BankName);
    request.input('Branch', db.sql.VarChar, supplierData.Branch);
    request.input('Email', db.sql.VarChar, supplierData.Email);
    request.input('Username', db.sql.VarChar, supplierData.Username);
    request.input('hash_Password', db.sql.VarChar, hashedPassword);

    const result = await request.query(`
      INSERT INTO Supplier (
        S_RegisterID, S_FullName, S_Address, S_ContactNo, 
        AccountNumber, BankName, Branch, Email, Username, hash_Password
      ) VALUES (
        @S_RegisterID, @S_FullName, @S_Address, @S_ContactNo,
        @AccountNumber, @BankName, @Branch, @Email, @Username, @hash_Password
      )
    `);

    return result;
  } catch (error) {
    throw error;
  }
};


const update = async (id, supplierData) => {
  try {
    await db.poolConnect;
    const request = db.pool.request();

    request.input('S_FullName', db.sql.NVarChar, supplierData.S_FullName);
    request.input('S_Address', db.sql.NVarChar, supplierData.S_Address);
    request.input('S_ContactNo', db.sql.VarChar, supplierData.S_ContactNo);
    request.input('AccountNumber', db.sql.VarChar, supplierData.AccountNumber);
    request.input('BankName', db.sql.VarChar, supplierData.BankName);
    request.input('Branch', db.sql.VarChar, supplierData.Branch);
    request.input('Email', db.sql.VarChar, supplierData.Email);
    request.input('S_RegisterID', db.sql.VarChar, id);

    const result = await request.query(`
      UPDATE Supplier SET 
        S_FullName = @S_FullName, 
        S_Address = @S_Address, 
        S_ContactNo = @S_ContactNo, 
        AccountNumber = @AccountNumber, 
        BankName = @BankName, 
        Branch = @Branch, 
        Email = @Email 
      WHERE S_RegisterID = @S_RegisterID
    `);

    return result;
  } catch (error) {
    throw error;
  }
};


const deleteSupplierById = async (id) => {
  try {
    await db.poolConnect;
    const request = db.pool.request();
    request.input('id', db.sql.VarChar, id);

    const result = await request.query(`
      DELETE FROM Supplier WHERE S_RegisterID = @id
    `);

    return result;
  } catch (error) {
    throw error;
  }
};


const authenticate = async (username, password) => {
  try {
    await db.poolConnect;
    const request = db.pool.request();
    request.input('username', db.sql.VarChar, username);

    const result = await request.query(`
      SELECT S_RegisterID, Username, hash_Password 
      FROM Supplier 
      WHERE Username = @username
    `);

    const records = result.recordset;
    if (records.length === 0) return null;

    const supplier = records[0];
    const match = await bcrypt.compare(password, supplier.hash_Password);

    if (match) {
      delete supplier.hash_Password;
      return supplier;
    }
    return null;
  } catch (error) {
    throw error;
  }
};


// Controller functions - These are exported and used by routes
export const getAllSuppliers = async (req, res) => {
  try {
    const suppliers = await getAll();
    res.status(200).json(suppliers);
  } catch (error) {
    console.error('Error getting suppliers:', error);
    res.status(500).json({ message: 'Error fetching suppliers', error: error.message });
  }
};

export const getSupplierById = async (req, res) => {
  try {
    const supplier = await getById(req.params.id);
    if (!supplier) {
      return res.status(404).json({ message: 'Supplier not found' });
    }
    res.status(200).json(supplier);
  } catch (error) {
    console.error('Error getting supplier:', error);
    res.status(500).json({ message: 'Error fetching supplier', error: error.message });
  }
};

export const createSupplier = async (req, res) => {
  try {
    // Validate required fields
    const requiredFields = ['S_RegisterID', 'S_FullName', 'S_Address', 'S_ContactNo', 'AccountNumber', 'BankName', 'Branch', 'Email', 'Username', 'password'];
    for (const field of requiredFields) {
      if (!req.body[field]) {
        return res.status(400).json({ message: `${field} is required` });
      }
    }
    
    await create(req.body);
    res.status(201).json({ message: 'Supplier created successfully' });
  } catch (error) {
    console.error('Error creating supplier:', error);
    res.status(500).json({ message: 'Error creating supplier', error: error.message });
  }
};

export const updateSupplier = async (req, res) => {
  try {
    const supplier = await getById(req.params.id);
    if (!supplier) {
      return res.status(404).json({ message: 'Supplier not found' });
    }
    
    await update(req.params.id, req.body);
    res.status(200).json({ message: 'Supplier updated successfully' });
  } catch (error) {
    console.error('Error updating supplier:', error);
    res.status(500).json({ message: 'Error updating supplier', error: error.message });
  }
};

export const deleteSupplier = async (req, res) => {
  try {
    const supplier = await getById(req.params.id);
    if (!supplier) {
      return res.status(404).json({ message: 'Supplier not found' });
    }
    
    await deleteSupplierById(req.params.id);
    res.status(200).json({ message: 'Supplier deleted successfully' });
  } catch (error) {
    console.error('Error deleting supplier:', error);
    res.status(500).json({ message: 'Error deleting supplier', error: error.message });
  }
};

export const loginSupplier = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }
    
    const supplier = await authenticate(username, password);
    
    if (!supplier) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }
    
    // Generate JWT token
    const token = generateToken(supplier);
    
    res.status(200).json({
      message: 'Login successful',
      supplier: {
        id: supplier.S_RegisterID,
        username: supplier.Username
      },
      token
    });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ message: 'Error during login', error: error.message });
  }
};