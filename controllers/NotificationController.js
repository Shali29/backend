import db from '../config/db.js';

// ====== SUPPLIER ======
export const createSupplierNotification = async (supplierId, message) => {
  try {
    await db.pool.request()
      .input('S_RegisterID', db.sql.VarChar, supplierId)
      .input('Message', db.sql.NVarChar, message)
      .query(`
        INSERT INTO Supplier_Notifications (S_RegisterID, Message)
        VALUES (@S_RegisterID, @Message)
      `);
  } catch (error) {
    console.error('Error creating supplier notification:', error);
    throw error;
  }
};

export const getNotificationsBySupplier = async (req, res) => {
  try {
    const { supplierId } = req.params;
    const result = await db.pool.request()
      .input('S_RegisterID', db.sql.VarChar, supplierId)
      .query(`
        SELECT NotificationID, Message, IsRead, CreatedAt
        FROM Supplier_Notifications
        WHERE S_RegisterID = @S_RegisterID
        ORDER BY CreatedAt DESC
      `);
    res.status(200).json(result.recordset);
  } catch (error) {
    console.error('Error fetching supplier notifications:', error);
    res.status(500).json({ message: 'Error fetching supplier notifications', error: error.message });
  }
};

export const markSupplierNotificationRead = async (req, res) => {
  try {
    const notificationId = req.params.id;
    await db.pool.request()
      .input('NotificationID', db.sql.Int, notificationId)
      .query(`UPDATE Supplier_Notifications SET IsRead = 1 WHERE NotificationID = @NotificationID`);
    res.status(200).json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Error updating supplier notification:', error);
    res.status(500).json({ message: 'Error updating supplier notification', error: error.message });
  }
};

// ====== DRIVER ======
export const createDriverNotification = async (driverId, message) => {
  try {
    await db.pool.request()
      .input('D_RegisterID', db.sql.VarChar, driverId)
      .input('Message', db.sql.NVarChar, message)
      .query(`
        INSERT INTO Driver_Notifications (D_RegisterID, Message)
        VALUES (@D_RegisterID, @Message)
      `);
  } catch (error) {
    console.error('Error creating driver notification:', error);
    throw error;
  }
};

export const getNotificationsByDriver = async (req, res) => {
  try {
    const { driverId } = req.params;
    const result = await db.pool.request()
      .input('D_RegisterID', db.sql.VarChar, driverId)
      .query(`
        SELECT NotificationID, Message, IsRead, CreatedAt
        FROM Driver_Notifications
        WHERE D_RegisterID = @D_RegisterID
        ORDER BY CreatedAt DESC
      `);
    res.status(200).json(result.recordset);
  } catch (error) {
    console.error('Error fetching driver notifications:', error);
    res.status(500).json({ message: 'Error fetching driver notifications', error: error.message });
  }
};

export const markDriverNotificationRead = async (req, res) => {
  try {
    const notificationId = req.params.id;
    await db.pool.request()
      .input('NotificationID', db.sql.Int, notificationId)
      .query(`UPDATE Driver_Notifications SET IsRead = 1 WHERE NotificationID = @NotificationID`);
    res.status(200).json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Error updating driver notification:', error);
    res.status(500).json({ message: 'Error updating driver notification', error: error.message });
  }
};
