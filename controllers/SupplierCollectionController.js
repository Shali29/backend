import db from '../config/db.js'; // assuming db is set up using mssql

// Get all collections with supplier names
export const getAllCollections = async (req, res) => {
  try {
    await db.poolConnect;
    const result = await db.pool.request().query(`
      SELECT sc.*, s.S_FullName 
      FROM Supplier_Collection sc
      JOIN Supplier s ON sc.S_RegisterID = s.S_RegisterID
      ORDER BY sc.DateTime DESC
    `);
    res.status(200).json(result.recordset);
  } catch (error) {
    console.error('Error getting collections:', error);
    res.status(500).json({ message: 'Error fetching collections', error: error.message });
  }
};

// Get a single collection by ID
export const getCollectionById = async (req, res) => {
  try {
    await db.poolConnect;
    const request = db.pool.request();
    request.input('id', db.sql.Int, req.params.id);

    const result = await request.query(`
      SELECT sc.*, s.S_FullName 
      FROM Supplier_Collection sc
      JOIN Supplier s ON sc.S_RegisterID = s.S_RegisterID
      WHERE sc.Collection_ID = @id
    `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Collection not found' });
    }

    res.status(200).json(result.recordset[0]);
  } catch (error) {
    console.error('Error getting collection:', error);
    res.status(500).json({ message: 'Error fetching collection', error: error.message });
  }
};

// Get all collections for a specific supplier
export const getCollectionsBySupplier = async (req, res) => {
  try {
    await db.poolConnect;
    const request = db.pool.request();
    request.input('supplierId', db.sql.VarChar, req.params.supplierId);

    const result = await request.query(`
      SELECT * FROM Supplier_Collection 
      WHERE S_RegisterID = @supplierId
      ORDER BY DateTime DESC
    `);
    res.status(200).json(result.recordset);
  } catch (error) {
    console.error('Error getting supplier collections:', error);
    res.status(500).json({ message: 'Error fetching supplier collections', error: error.message });
  }
};

// Create a new collection
export const createCollection = async (req, res) => {
  try {
    const {
      S_RegisterID,
      Current_Rate,
      TeaBagWeight_kg,
      Water_kg,
      Bag_kg
    } = req.body;

    if (!S_RegisterID || !Current_Rate || !TeaBagWeight_kg || !Water_kg || !Bag_kg) {
      return res.status(400).json({
        message: 'All fields (S_RegisterID, Current_Rate, TeaBagWeight_kg, Water_kg, Bag_kg) are required'
      });
    }

    const BalanceWeight_kg = parseFloat(TeaBagWeight_kg) - parseFloat(Water_kg) - parseFloat(Bag_kg);
    const TotalWeight = BalanceWeight_kg;

    await db.poolConnect;
    const request = db.pool.request();
    request.input('S_RegisterID', db.sql.VarChar, S_RegisterID);
    request.input('Current_Rate', db.sql.Decimal(10, 2), Current_Rate);
    request.input('TeaBagWeight_kg', db.sql.Decimal(10, 2), TeaBagWeight_kg);
    request.input('Water_kg', db.sql.Decimal(10, 2), Water_kg);
    request.input('Bag_kg', db.sql.Decimal(10, 2), Bag_kg);
    request.input('BalanceWeight_kg', db.sql.Decimal(10, 2), BalanceWeight_kg);
    request.input('TotalWeight', db.sql.Decimal(10, 2), TotalWeight);

    const result = await request.query(`
      INSERT INTO Supplier_Collection (
        S_RegisterID,
        Current_Rate,
        TeaBagWeight_kg,
        Water_kg,
        Bag_kg,
        BalanceWeight_kg,
        TotalWeight
      ) 
      OUTPUT INSERTED.Collection_ID
      VALUES (
        @S_RegisterID,
        @Current_Rate,
        @TeaBagWeight_kg,
        @Water_kg,
        @Bag_kg,
        @BalanceWeight_kg,
        @TotalWeight
      )
    `);

    res.status(201).json({
      message: 'Collection created successfully',
      collectionId: result.recordset[0].Collection_ID,
      balanceWeight: BalanceWeight_kg
    });
  } catch (error) {
    console.error('Error creating collection:', error);
    res.status(500).json({ message: 'Error creating collection', error: error.message });
  }
};

// Delete a collection
export const deleteCollection = async (req, res) => {
  try {
    await db.poolConnect;
    const request = db.pool.request();
    request.input('id', db.sql.Int, req.params.id);

    const check = await request.query(`SELECT * FROM Supplier_Collection WHERE Collection_ID = @id`);

    if (check.recordset.length === 0) {
      return res.status(404).json({ message: 'Collection not found' });
    }

    await request.query(`DELETE FROM Supplier_Collection WHERE Collection_ID = @id`);

    res.status(200).json({ message: 'Collection deleted successfully' });
  } catch (error) {
    console.error('Error deleting collection:', error);
    res.status(500).json({ message: 'Error deleting collection', error: error.message });
  }
};

// Get collection statistics
export const getCollectionStatistics = async (req, res) => {
  try {
    await db.poolConnect;

    const countResult = await db.pool.request().query(`SELECT COUNT(*) as totalCollections FROM Supplier_Collection`);
    const weightResult = await db.pool.request().query(`SELECT SUM(BalanceWeight_kg) as totalTeaWeight FROM Supplier_Collection`);
    const rateResult = await db.pool.request().query(`SELECT AVG(Current_Rate) as averageRate FROM Supplier_Collection`);

    const dailyCollections = await db.pool.request().query(`
      SELECT 
        CONVERT(DATE, DateTime) as date, 
        SUM(BalanceWeight_kg) as totalWeight
      FROM Supplier_Collection
      WHERE DateTime >= DATEADD(DAY, -30, GETDATE())
      GROUP BY CONVERT(DATE, DateTime)
      ORDER BY date ASC
    `);

    res.status(200).json({
      totalCollections: countResult.recordset[0].totalCollections,
      totalTeaWeight: weightResult.recordset[0].totalTeaWeight || 0,
      averageRate: rateResult.recordset[0].averageRate || 0,
      dailyCollections: dailyCollections.recordset
    });
  } catch (error) {
    console.error('Error getting collection statistics:', error);
    res.status(500).json({ message: 'Error fetching collection statistics', error: error.message });
  }
};


// Update an existing supplier collection
export const updateCollection = async (req, res) => {
  try {
    const {
      Collection_ID,
      S_RegisterID,
      Current_Rate,
      TeaBagWeight_kg,
      Water_kg,
      Bag_kg
    } = req.body;

    if (!Collection_ID || !S_RegisterID || !Current_Rate || !TeaBagWeight_kg || !Water_kg || !Bag_kg) {
      return res.status(400).json({
        message: 'All fields (Collection_ID, S_RegisterID, Current_Rate, TeaBagWeight_kg, Water_kg, Bag_kg) are required'
      });
    }

    const BalanceWeight_kg = parseFloat(TeaBagWeight_kg) - parseFloat(Water_kg) - parseFloat(Bag_kg);
    const TotalWeight = BalanceWeight_kg;

    await db.poolConnect;
    const request = db.pool.request();

    request.input('Collection_ID', db.sql.Int, Collection_ID);
    request.input('S_RegisterID', db.sql.VarChar, S_RegisterID);
    request.input('Current_Rate', db.sql.Decimal(10, 2), Current_Rate);
    request.input('TeaBagWeight_kg', db.sql.Decimal(10, 2), TeaBagWeight_kg);
    request.input('Water_kg', db.sql.Decimal(10, 2), Water_kg);
    request.input('Bag_kg', db.sql.Decimal(10, 2), Bag_kg);
    request.input('BalanceWeight_kg', db.sql.Decimal(10, 2), BalanceWeight_kg);
    request.input('TotalWeight', db.sql.Decimal(10, 2), TotalWeight);

    const result = await request.query(`
      UPDATE Supplier_Collection SET
        S_RegisterID = @S_RegisterID,
        Current_Rate = @Current_Rate,
        TeaBagWeight_kg = @TeaBagWeight_kg,
        Water_kg = @Water_kg,
        Bag_kg = @Bag_kg,
        BalanceWeight_kg = @BalanceWeight_kg,
        TotalWeight = @TotalWeight
      WHERE Collection_ID = @Collection_ID
    `);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ message: 'Collection not found' });
    }

    res.status(200).json({ message: 'Collection updated successfully' });
  } catch (error) {
    console.error('Error updating collection:', error);
    res.status(500).json({ message: 'Error updating collection', error: error.message });
  }
};
