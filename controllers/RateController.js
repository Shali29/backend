import db from '../config/db.js';
import sql from 'mssql';

// Get rate by ID
export const getRateById = async (req, res) => {
  try {
    const result = await db.pool.request()
      .input('id', sql.Int, req.params.id)
      .query('SELECT * FROM RateConfig WHERE RateID = @id');

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Rate not found' });
    }

    res.status(200).json(result.recordset[0]);
  } catch (error) {
    console.error('Error fetching rate:', error);
    res.status(500).json({ message: 'Error fetching rate', error: error.message });
  }
};

// Update rate by ID
export const updateRateById = async (req, res) => {
  try {
    const { Rate_Per_Kg, Effective_Date } = req.body;

    const result = await db.pool.request()
      .input('id', sql.Int, req.params.id)
      .input('Rate_Per_Kg', sql.Decimal(10, 2), Rate_Per_Kg)
      .input('Effective_Date', sql.Date, Effective_Date || new Date())
      .query(`
        UPDATE RateConfig
        SET Rate_Per_Kg = @Rate_Per_Kg,
            Effective_Date = @Effective_Date
        WHERE RateID = @id
      `);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ message: 'Rate not found or not updated' });
    }

    res.status(200).json({ message: 'Rate updated successfully' });
  } catch (error) {
    console.error('Error updating rate:', error);
    res.status(500).json({ message: 'Error updating rate', error: error.message });
  }
};
