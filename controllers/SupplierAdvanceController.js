import db from '../config/db.js';

class SupplierAdvance {
  // Fetch all supplier advances with supplier name
  static async getAll() {
    try {
      const result = await db.pool.request().query(`
        SELECT sa.*, s.S_FullName 
        FROM Supplier_Advance sa
        JOIN Supplier s ON sa.S_RegisterID = s.S_RegisterID
        ORDER BY sa.Date DESC
      `);
      return result.recordset;
    } catch (error) {
      throw error;
    }
  }

  // Fetch a supplier advance by its ID
  static async getById(id) {
    try {
      const result = await db.pool.request()
        .input('AdvanceID', id)
        .query(`
          SELECT sa.*, s.S_FullName 
          FROM Supplier_Advance sa
          JOIN Supplier s ON sa.S_RegisterID = s.S_RegisterID
          WHERE sa.AdvanceID = @AdvanceID
        `);
      return result.recordset.length === 0 ? null : result.recordset[0];
    } catch (error) {
      throw error;
    }
  }

  // Fetch all advances for a specific supplier
  static async getBySupplierId(supplierId) {
    try {
      const result = await db.pool.request()
        .input('S_RegisterID', supplierId)
        .query(`
          SELECT * FROM Supplier_Advance 
          WHERE S_RegisterID = @S_RegisterID
          ORDER BY Date DESC
        `);
      return result.recordset;
    } catch (error) {
      throw error;
    }
  }

  // Create a new supplier advance
  static async create(advanceData) {
    try {
      const now = new Date();
      const sqlDate = now.toISOString().slice(0, 19).replace('T', ' ');

      const result = await db.pool.request()
        .input('S_RegisterID', advanceData.S_RegisterID)
        .input('Advance_Amount', advanceData.Advance_Amount)
        .input('Date', sqlDate)
        .input('Status', advanceData.Status || 'Pending')
        .query(`
          INSERT INTO Supplier_Advance (
            S_RegisterID, Advance_Amount, Date, Status
          ) VALUES (@S_RegisterID, @Advance_Amount, @Date, @Status);
          SELECT SCOPE_IDENTITY() AS AdvanceID;
        `);

      return result.recordset[0]; // inserted record id
    } catch (error) {
      throw error;
    }
  }

  // Update the status of a supplier advance
  static async updateStatus(id, status) {
    try {
      const result = await db.pool.request()
        .input('Status', status)
        .input('AdvanceID', id)
        .query('UPDATE Supplier_Advance SET Status = @Status WHERE AdvanceID = @AdvanceID');
      return result.rowsAffected;
    } catch (error) {
      throw error;
    }
  }

  // Update an existing supplier advance
  static async update(id, advanceData) {
    try {
      const dateToUse = advanceData.Date || new Date().toISOString().slice(0, 19).replace('T', ' ');

      const result = await db.pool.request()
        .input('S_RegisterID', advanceData.S_RegisterID)
        .input('Advance_Amount', advanceData.Advance_Amount)
        .input('Date', dateToUse)
        .input('Status', advanceData.Status)
        .input('AdvanceID', id)
        .query(`
          UPDATE Supplier_Advance SET 
            S_RegisterID = @S_RegisterID, 
            Advance_Amount = @Advance_Amount, 
            Date = @Date, 
            Status = @Status
          WHERE AdvanceID = @AdvanceID
        `);

      return result.rowsAffected;
    } catch (error) {
      throw error;
    }
  }

  // Delete a supplier advance by its ID
  static async delete(id) {
    try {
      const result = await db.pool.request()
        .input('AdvanceID', id)
        .query('DELETE FROM Supplier_Advance WHERE AdvanceID = @AdvanceID');
      return result.rowsAffected;
    } catch (error) {
      throw error;
    }
  }

  // Get statistics (counts and sums for pending and transferred advances)
  static async getStatistics() {
    try {
      const pendingResult = await db.pool.request().query(`
        SELECT COUNT(*) AS count, ISNULL(SUM(Advance_Amount), 0) AS total 
        FROM Supplier_Advance WHERE Status = 'Pending'
      `);

      const transferedResult = await db.pool.request().query(`
        SELECT COUNT(*) AS count, ISNULL(SUM(Advance_Amount), 0) AS total 
        FROM Supplier_Advance WHERE Status = 'Transfered'
      `);

      return {
        pending: pendingResult.recordset[0],
        transfered: transferedResult.recordset[0],
      };
    } catch (error) {
      throw error;
    }
  }
}

// Controller functions

export const getAllAdvances = async (req, res) => {
  try {
    const advances = await SupplierAdvance.getAll();
    res.status(200).json(advances);
  } catch (error) {
    console.error('Error fetching supplier advances:', error);
    res.status(500).json({ message: 'Error fetching supplier advances', error: error.message });
  }
};

export const getAdvancesBySupplier = async (req, res) => {
  try {
    const advances = await SupplierAdvance.getBySupplierId(req.params.supplierId);
    if (!advances || advances.length === 0) {
      return res.status(404).json({ message: 'No advances found for this supplier' });
    }
    res.status(200).json(advances);
  } catch (error) {
    console.error('Error fetching supplier advances:', error);
    res.status(500).json({ message: 'Error fetching supplier advances', error: error.message });
  }
};

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

export const createAdvance = async (req, res) => {
  try {
    const { Advance_Amount, S_RegisterID, Status } = req.body;

    if (!Advance_Amount || !S_RegisterID) {
      return res.status(400).json({ message: 'Advance amount and supplier ID are required' });
    }

    const result = await SupplierAdvance.create({
      Advance_Amount,
      S_RegisterID,
      Status: Status || 'Pending',
    });

    res.status(201).json({ message: 'Advance created successfully', advanceId: result.AdvanceID });
  } catch (error) {
    console.error('Error creating advance:', error);
    res.status(500).json({ message: 'Error creating advance', error: error.message });
  }
};

export const updateAdvance = async (req, res) => {
  try {
    const advance = await SupplierAdvance.getById(req.params.id);
    if (!advance) {
      return res.status(404).json({ message: 'Advance not found' });
    }

    const updated = await SupplierAdvance.update(req.params.id, req.body);
    res.status(200).json(updated);
  } catch (error) {
    console.error('Error updating advance:', error);
    res.status(500).json({ message: 'Error updating advance', error: error.message });
  }
};

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

    const updated = await SupplierAdvance.updateStatus(req.params.id, Status);
    res.status(200).json(updated);
  } catch (error) {
    console.error('Error updating advance status:', error);
    res.status(500).json({ message: 'Error updating advance status', error: error.message });
  }
};

export const getAdvanceStatistics = async (req, res) => {
  try {
    const stats = await SupplierAdvance.getStatistics();
    res.status(200).json(stats);
  } catch (error) {
    console.error('Error fetching advance statistics:', error);
    res.status(500).json({ message: 'Error fetching advance statistics', error: error.message });
  }
};
