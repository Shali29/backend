import db from '../config/db.js';
import bcrypt from 'bcrypt';
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
    const [results] = await db.query('SELECT S_RegisterID, S_FullName, S_Address, S_ContactNo, Email FROM Supplier');
    return results;
  } catch (error) {
    throw error;
  }
};

const getById = async (id) => {
  try {
    const [results] = await db.query('SELECT S_RegisterID, S_FullName, S_Address, S_ContactNo, Email, AccountNumber, BankName, Branch FROM Supplier WHERE S_RegisterID = ?', [id]);
    return results.length === 0 ? null : results[0];
  } catch (error) {
    throw error;
  }
};

const create = async (supplierData) => {
  try {
    // Hash password
    const hashedPassword = await bcrypt.hash(supplierData.password, 10);
    
    const query = `
      INSERT INTO Supplier (
        S_RegisterID, S_FullName, S_Address, S_ContactNo, 
        AccountNumber, BankName, Branch, Email, Username, hash_Password
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const [result] = await db.query(
      query,
      [
        supplierData.S_RegisterID,
        supplierData.S_FullName,
        supplierData.S_Address,
        supplierData.S_ContactNo,
        supplierData.AccountNumber,
        supplierData.BankName,
        supplierData.Branch,
        supplierData.Email,
        supplierData.Username,
        hashedPassword
      ]
    );
    
    return result;
  } catch (error) {
    throw error;
  }
};

const update = async (id, supplierData) => {
  try {
    const query = `
      UPDATE Supplier SET 
        S_FullName = ?, 
        S_Address = ?, 
        S_ContactNo = ?, 
        AccountNumber = ?, 
        BankName = ?, 
        Branch = ?, 
        Email = ? 
      WHERE S_RegisterID = ?
    `;
    
    const [result] = await db.query(
      query,
      [
        supplierData.S_FullName,
        supplierData.S_Address,
        supplierData.S_ContactNo,
        supplierData.AccountNumber,
        supplierData.BankName,
        supplierData.Branch,
        supplierData.Email,
        id
      ]
    );
    
    return result;
  } catch (error) {
    throw error;
  }
};

const deleteSupplierById = async (id) => {
  try {
    const [result] = await db.query('DELETE FROM Supplier WHERE S_RegisterID = ?', [id]);
    return result;
  } catch (error) {
    throw error;
  }
};

const authenticate = async (username, password) => {
  try {
    const [results] = await db.query('SELECT S_RegisterID, Username, hash_Password FROM Supplier WHERE Username = ?', [username]);
    if (results.length === 0) return null;
    
    const supplier = results[0];
    const match = await bcrypt.compare(password, supplier.hash_Password);
    
    if (match) {
      // Don't return the password hash
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