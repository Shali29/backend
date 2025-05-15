import db from '../config/db.js';

// Notification Controller
export const createNotification = async (supplierId, message) => {
  try {
    const result = await db.pool.request()
      .input('S_RegisterID', db.sql.VarChar, supplierId)
      .input('Message', db.sql.NVarChar, message)
      .query(`
        INSERT INTO Supplier_Notifications (S_RegisterID, Message)
        VALUES (@S_RegisterID, @Message)
      `);
    return result;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

export const getNotificationsBySupplier = async (req, res) => {
  try {
    const supplierId = req.params.supplierId;
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
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Error fetching notifications', error: error.message });
  }
};

export const markNotificationRead = async (req, res) => {
  try {
    const notificationId = req.params.id;
    await db.pool.request()
      .input('NotificationID', db.sql.Int, notificationId)
      .query(`UPDATE Supplier_Notifications SET IsRead = 1 WHERE NotificationID = @NotificationID`);
    res.status(200).json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Error updating notification:', error);
    res.status(500).json({ message: 'Error updating notification', error: error.message });
  }
};
