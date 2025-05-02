import db from '../config/db.js';

// Get all collections with supplier names
export const getAllCollections = async (req, res) => {
  try {
    const [collections] = await db.query(`
      SELECT sc.*, s.S_FullName 
      FROM Supplier_Collection sc
      JOIN Supplier s ON sc.S_RegisterID = s.S_RegisterID
      ORDER BY sc.DateTime DESC
    `);
    res.status(200).json(collections);
  } catch (error) {
    console.error('Error getting collections:', error);
    res.status(500).json({ message: 'Error fetching collections', error: error.message });
  }
};

// Get a single collection by ID
export const getCollectionById = async (req, res) => {
  try {
    const [results] = await db.query(`
      SELECT sc.*, s.S_FullName 
      FROM Supplier_Collection sc
      JOIN Supplier s ON sc.S_RegisterID = s.S_RegisterID
      WHERE sc.Collection_ID = ?
    `, [req.params.id]);

    if (results.length === 0) {
      return res.status(404).json({ message: 'Collection not found' });
    }
    res.status(200).json(results[0]);
  } catch (error) {
    console.error('Error getting collection:', error);
    res.status(500).json({ message: 'Error fetching collection', error: error.message });
  }
};

// Get all collections for a specific supplier
export const getCollectionsBySupplier = async (req, res) => {
  try {
    const [collections] = await db.query(`
      SELECT * FROM Supplier_Collection 
      WHERE S_RegisterID = ?
      ORDER BY DateTime DESC
    `, [req.params.supplierId]);
    res.status(200).json(collections);
  } catch (error) {
    console.error('Error getting supplier collections:', error);
    res.status(500).json({ message: 'Error fetching supplier collections', error: error.message });
  }
};

// Create a new collection
export const createCollection = async (req, res) => {
  try {
    // Destructure required fields from request body
    const {
      S_RegisterID,
      Current_Rate,
      TeaBagWeight_kg,
      Water_kg,
      Bag_kg
    } = req.body;

    // Validate required fields
    if (!S_RegisterID || !Current_Rate || !TeaBagWeight_kg || !Water_kg || !Bag_kg) {
      return res.status(400).json({ 
        message: 'All fields (S_RegisterID, Current_Rate, TeaBagWeight_kg, Water_kg, Bag_kg) are required' 
      });
    }

    // Calculate derived fields
    const BalanceWeight_kg = parseFloat(TeaBagWeight_kg) - parseFloat(Water_kg) - parseFloat(Bag_kg);
    const TotalWeight = BalanceWeight_kg;

    // Insert into database (DateTime will use DEFAULT CURRENT_TIMESTAMP)
    const [result] = await db.query(
      `INSERT INTO Supplier_Collection (
        S_RegisterID,
        Current_Rate,
        TeaBagWeight_kg,
        Water_kg,
        Bag_kg,
        BalanceWeight_kg,
        TotalWeight
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        S_RegisterID,
        Current_Rate,
        TeaBagWeight_kg,
        Water_kg,
        Bag_kg,
        BalanceWeight_kg,
        TotalWeight
      ]
    );

    res.status(201).json({
      message: 'Collection created successfully',
      collectionId: result.insertId,
      balanceWeight: BalanceWeight_kg
    });

  } catch (error) {
    console.error('Error creating collection:', error);
    
    // Handle specific database errors
    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({ 
        message: 'Invalid Supplier ID (S_RegisterID does not exist)' 
      });
    }

    res.status(500).json({ 
      message: 'Error creating collection',
      error: error.message 
    });
  }
};

// Delete a collection
export const deleteCollection = async (req, res) => {
  try {
    // First check if collection exists
    const [checkResults] = await db.query(
      'SELECT * FROM Supplier_Collection WHERE Collection_ID = ?',
      [req.params.id]
    );
    
    if (checkResults.length === 0) {
      return res.status(404).json({ message: 'Collection not found' });
    }

    // Delete collection
    await db.query(
      'DELETE FROM Supplier_Collection WHERE Collection_ID = ?',
      [req.params.id]
    );

    res.status(200).json({ message: 'Collection deleted successfully' });
  } catch (error) {
    console.error('Error deleting collection:', error);
    res.status(500).json({ message: 'Error deleting collection', error: error.message });
  }
};

// Get collection statistics
export const getCollectionStatistics = async (req, res) => {
  try {
    // Get total collections count
    const [countResult] = await db.query('SELECT COUNT(*) as totalCollections FROM Supplier_Collection');
    
    // Get total tea weight collected
    const [weightResult] = await db.query('SELECT SUM(BalanceWeight_kg) as totalTeaWeight FROM Supplier_Collection');
    
    // Get average rate
    const [rateResult] = await db.query('SELECT AVG(Current_Rate) as averageRate FROM Supplier_Collection');
    
    // Get collections by date (last 30 days)
    const [dailyCollections] = await db.query(`
      SELECT DATE(DateTime) as date, SUM(BalanceWeight_kg) as totalWeight
      FROM Supplier_Collection
      WHERE DateTime >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
      GROUP BY DATE(DateTime)
      ORDER BY date ASC
    `);

    res.status(200).json({
      totalCollections: countResult[0].totalCollections,
      totalTeaWeight: weightResult[0].totalTeaWeight || 0,
      averageRate: rateResult[0].averageRate || 0,
      dailyCollections: dailyCollections
    });
  } catch (error) {
    console.error('Error getting collection statistics:', error);
    res.status(500).json({ message: 'Error fetching collection statistics', error: error.message });
  }
};