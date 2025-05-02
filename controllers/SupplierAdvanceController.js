import db from '../config/db.js';

// Model functions
class SupplierAdvance {
  // Fetch all supplier advances with supplier name
  static async getAll() {
    try {
      const [results] = await db.query(`
        SELECT sa.*, s.S_FullName 
        FROM Supplier_Advance sa
        JOIN Supplier s ON sa.S_RegisterID = s.S_RegisterID
        ORDER BY sa.Date DESC
      `);
      return results;
    } catch (error) {
      throw error;
    }
  }

  // Fetch a supplier advance by its ID
  static async getById(id) {
    try {
      const [results] = await db.query(`
        SELECT sa.*, s.S_FullName 
        FROM Supplier_Advance sa
        JOIN Supplier s ON sa.S_RegisterID = s.S_RegisterID
        WHERE sa.AdvanceID = ?
      `, [id]);
      
      return results.length === 0 ? null : results[0];
    } catch (error) {
      throw error;
    }
  }

  // Fetch all advances for a specific supplier
  static async getBySupplierId(supplierId) {
    try {
      const [results] = await db.query(`
        SELECT * FROM Supplier_Advance 
        WHERE S_RegisterID = ?
        ORDER BY Date DESC
      `, [supplierId]);
      return results;
    } catch (error) {
      throw error;
    }
  }

  // Create a new supplier advance
  static async create(advanceData) {
    try {
      const query = `
        INSERT INTO Supplier_Advance (
          S_RegisterID, Advance_Amount, Date, Status
        ) VALUES (?, ?, CURDATE(), ?)
      `;
      
      const [result] = await db.query(query, [
        advanceData.S_RegisterID,
        advanceData.Advance_Amount,
        advanceData.Status || 'Pending'
      ]);

      return result;
    } catch (error) {
      throw error;
    }
  }

  // Update the status of a supplier advance
  static async updateStatus(id, status) {
    try {
      const [result] = await db.query(
        'UPDATE Supplier_Advance SET Status = ? WHERE AdvanceID = ?',
        [status, id]
      );
      return result;
    } catch (error) {
      throw error;
    }
  }

  // Update an existing supplier advance
  static async update(id, advanceData) {
    try {
      const query = `
        UPDATE Supplier_Advance SET 
          S_RegisterID = ?, 
          Advance_Amount = ?, 
          Date = ?, 
          Status = ?
        WHERE AdvanceID = ?
      `;
      
      const [result] = await db.query(query, [
        advanceData.S_RegisterID,
        advanceData.Advance_Amount,
        advanceData.Date || new Date().toISOString().split('T')[0],
        advanceData.Status,
        id
      ]);

      return result;
    } catch (error) {
      throw error;
    }
  }

  // Delete a supplier advance by its ID
  static async delete(id) {
    try {
      const [result] = await db.query('DELETE FROM Supplier_Advance WHERE AdvanceID = ?', [id]);
      return result;
    } catch (error) {
      throw error;
    }
  }

  // Get statistics (placeholder for the function mentioned in controller)
  static async getStatistics() {
    try {
      // Implementation depends on what statistics are needed
      const [pendingAdvances] = await db.query(
        'SELECT COUNT(*) as count, SUM(Advance_Amount) as total FROM Supplier_Advance WHERE Status = "Pending"'
      );
      
      const [transferedAdvances] = await db.query(
        'SELECT COUNT(*) as count, SUM(Advance_Amount) as total FROM Supplier_Advance WHERE Status = "Transfered"'
      );
      
      return {
        pending: pendingAdvances[0],
        transfered: transferedAdvances[0]
      };
    } catch (error) {
      throw error;
    }
  }
}

// Controller functions
// Get all supplier advances
export const getAllAdvances = async (req, res) => {
  try {
    const advances = await SupplierAdvance.getAll();
    res.status(200).json(advances);
  } catch (error) {
    console.error('Error fetching supplier advances:', error);
    res.status(500).json({ message: 'Error fetching supplier advances', error: error.message });
  }
};

// Get supplier advances by supplier ID
export const getAdvancesBySupplier = async (req, res) => {
  try {
    const advances = await SupplierAdvance.getBySupplierId(req.params.supplierId);
    if (advances.length === 0) {
      return res.status(404).json({ message: 'No advances found for this supplier' });
    }
    res.status(200).json(advances);
  } catch (error) {
    console.error('Error fetching supplier advances:', error);
    res.status(500).json({ message: 'Error fetching supplier advances', error: error.message });
  }
};

// Get a single advance by ID
export const getAdvanceById = async (req, res) => {
  try {
    const advance = await SupplierAdvance.getById(req.params.id);
    if (!advance) {
      return res.status(404).json({ message: 'Advance not found' });
    }
    res.status(200).json(advance);
  } catch (error) {
    console.error('Error fetching advance:', error);
    res.status(500).json({ message: 'Error fetching advance', error: error.message });
  }
};

// Create a new advance
export const createAdvance = async (req, res) => {
  try {
    const { amount, advanceDate, notes, S_RegisterID } = req.body;

    // Validate required fields
    if (!amount || !S_RegisterID) {
      return res.status(400).json({ message: 'Amount and supplier ID are required' });
    }

    // Handle date - either use provided date or current date
    const dateToUse = advanceDate ? new Date(advanceDate) : new Date();
    
    // If you need MySQL formatted date
    const mysqlDate = dateToUse.toISOString().slice(0, 19).replace('T', ' ');

    const [result] = await db.query(
      `INSERT INTO Supplier_Advances 
       (S_RegisterID, Amount, AdvanceDate, Notes) 
       VALUES (?, ?, ?, ?)`,
      [S_RegisterID, amount, mysqlDate, notes || null]
    );

    res.status(201).json({ 
      message: 'Advance created successfully',
      advanceId: result.insertId
    });
  } catch (error) {
    console.error('Error creating advance:', error);
    res.status(500).json({ 
      message: 'Error creating advance',
      error: error.message 
    });
  }
};

// Update an advance
export const updateAdvance = async (req, res) => {
  try {
    const advance = await SupplierAdvance.getById(req.params.id);
    if (!advance) {
      return res.status(404).json({ message: 'Advance not found' });
    }

    const updatedAdvance = await SupplierAdvance.update(req.params.id, req.body);
    res.status(200).json(updatedAdvance);
  } catch (error) {
    console.error('Error updating advance:', error);
    res.status(500).json({ message: 'Error updating advance', error: error.message });
  }
};

// Delete an advance
export const deleteAdvance = async (req, res) => {
  try {
    const advance = await SupplierAdvance.getById(req.params.id);
    if (!advance) {
      return res.status(404).json({ message: 'Advance not found' });
    }

    await SupplierAdvance.delete(req.params.id);
    res.status(200).json({ message: 'Advance deleted successfully' });
  } catch (error) {
    console.error('Error deleting advance:', error);
    res.status(500).json({ message: 'Error deleting advance', error: error.message });
  }
};

// Update advance status
export const updateAdvanceStatus = async (req, res) => {
  try {
    const { Status } = req.body;
    if (!Status || !['Pending', 'Transfered'].includes(Status)) {
      return res.status(400).json({ message: 'Valid status (Pending or Transfered) is required' });
    }

    const advance = await SupplierAdvance.getById(req.params.id);
    if (!advance) {
      return res.status(404).json({ message: 'Advance not found' });
    }

    const updatedAdvance = await SupplierAdvance.updateStatus(req.params.id, Status);
    res.status(200).json(updatedAdvance);
  } catch (error) {
    console.error('Error updating advance status:', error);
    res.status(500).json({ message: 'Error updating advance status', error: error.message });
  }
};

// Get advance statistics
export const getAdvanceStatistics = async (req, res) => {
  try {
    const stats = await SupplierAdvance.getStatistics();
    res.status(200).json(stats);
  } catch (error) {
    console.error('Error fetching advance statistics:', error);
    res.status(500).json({ message: 'Error fetching advance statistics', error: error.message });
  }
};