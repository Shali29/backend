import db from '../config/db.js';
import { sendNotificationToDriver } from '../utils/notificationUtils.js';
import { sendNotificationToSupplier } from '../utils/notificationUtils.js';

class TeaPacketsFertilizersModel {
  static async getAll() {
    await db.poolConnect;
    const result = await db.pool.request().query(`
      SELECT tpf.*, s.S_FullName, p.ProductName, p.Rate_per_Bag
      FROM TeaPackets_Fertilizers tpf
      JOIN Supplier s ON tpf.S_RegisterID = s.S_RegisterID
      JOIN Products p ON tpf.ProductID = p.ProductID
      ORDER BY tpf.Request_Date DESC
    `);
    return result.recordset;
  }

  static async getById(id) {
    await db.poolConnect;
    const request = db.pool.request();
    request.input('id', db.sql.Int, id);

    const result = await request.query(`
      SELECT tpf.*, s.S_FullName, p.ProductName, p.Rate_per_Bag
      FROM TeaPackets_Fertilizers tpf
      JOIN Supplier s ON tpf.S_RegisterID = s.S_RegisterID
      JOIN Products p ON tpf.ProductID = p.ProductID
      WHERE tpf.Order_ID = @id
    `);

    return result.recordset.length ? result.recordset[0] : null;
  }

  static async createBulk(orders) {
  await db.poolConnect;
  const transaction = new db.sql.Transaction(db.pool);
  try {
    await transaction.begin();
    const request = transaction.request();

    for (const orderData of orders) {
      const status = orderData.Order_Status || 'Pending';
      const totalItems = orderData.Total_Items || orderData.Qty;
      const totalTea = orderData.Total_TeaPackets || 0;
      const totalOther = orderData.Total_OtherItems || orderData.Qty;

      request.input('S_RegisterID', db.sql.VarChar, orderData.S_RegisterID);
      request.input('ProductID', db.sql.VarChar, orderData.ProductID);
      request.input('Qty', db.sql.Int, orderData.Qty);
      request.input('Order_Status', db.sql.VarChar, status);
      request.input('Total_Items', db.sql.Int, totalItems);
      request.input('Total_TeaPackets', db.sql.Int, totalTea);
      request.input('Total_OtherItems', db.sql.Int, totalOther);

      await request.query(`
        INSERT INTO TeaPackets_Fertilizers (
          S_RegisterID, ProductID, Qty, Request_Date, Order_Status, 
          Total_Items, Total_TeaPackets, Total_OtherItems
        ) VALUES (
          @S_RegisterID, @ProductID, @Qty, GETDATE(), @Order_Status,
          @Total_Items, @Total_TeaPackets, @Total_OtherItems
        )
      `);
      request.parameters = {}; // Clear parameters for next iteration
    }

    await transaction.commit();
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
}


  static async getBySupplierId(supplierId) {
    await db.poolConnect;
    const request = db.pool.request();
    request.input('supplierId', db.sql.VarChar, supplierId);

    const result = await request.query(`
      SELECT tpf.*, p.ProductName, p.Rate_per_Bag
      FROM TeaPackets_Fertilizers tpf
      JOIN Products p ON tpf.ProductID = p.ProductID
      WHERE tpf.S_RegisterID = @supplierId
      ORDER BY tpf.Request_Date DESC
    `);
    return result.recordset;
  }

  
  static async create(orderData) {
    await db.poolConnect;
    const request = db.pool.request();

    const status = orderData.Order_Status || 'Pending';
    const totalItems = orderData.Total_Items || orderData.Qty;
    const totalTea = orderData.Total_TeaPackets || 0;
    const totalOther = orderData.Total_OtherItems || orderData.Qty;

    request.input('S_RegisterID', db.sql.VarChar, orderData.S_RegisterID);
    request.input('ProductID', db.sql.VarChar, orderData.ProductID);
    request.input('Qty', db.sql.Int, orderData.Qty);
    request.input('Order_Status', db.sql.VarChar, status);
    request.input('Total_Items', db.sql.Int, totalItems);
    request.input('Total_TeaPackets', db.sql.Int, totalTea);
    request.input('Total_OtherItems', db.sql.Int, totalOther);

    const result = await request.query(`
      INSERT INTO TeaPackets_Fertilizers (
        S_RegisterID, ProductID, Qty, Request_Date, Order_Status, 
        Total_Items, Total_TeaPackets, Total_OtherItems
      ) VALUES (
        @S_RegisterID, @ProductID, @Qty, GETDATE(), @Order_Status,
        @Total_Items, @Total_TeaPackets, @Total_OtherItems
      )
    `);

    return result;
  }

  static async updateStatus(id, status) {
    await db.poolConnect;
    const request = db.pool.request();
    request.input('id', db.sql.Int, id);
    request.input('status', db.sql.VarChar, status);

    const result = await request.query(`
      UPDATE TeaPackets_Fertilizers SET Order_Status = @status WHERE Order_ID = @id
    `);
    return result;
  }

  static async update(id, orderData) {
    await db.poolConnect;
    const request = db.pool.request();

    request.input('id', db.sql.Int, id);
    request.input('S_RegisterID', db.sql.VarChar, orderData.S_RegisterID);
    request.input('ProductID', db.sql.VarChar, orderData.ProductID);
    request.input('Qty', db.sql.Int, orderData.Qty);
    request.input('Order_Status', db.sql.VarChar, orderData.Order_Status);
    request.input('Total_Items', db.sql.Int, orderData.Total_Items);
    request.input('Total_TeaPackets', db.sql.Int, orderData.Total_TeaPackets);
    request.input('Total_OtherItems', db.sql.Int, orderData.Total_OtherItems);

    const result = await request.query(`
      UPDATE TeaPackets_Fertilizers SET 
        S_RegisterID = @S_RegisterID,
        ProductID = @ProductID,
        Qty = @Qty,
        Order_Status = @Order_Status,
        Total_Items = @Total_Items,
        Total_TeaPackets = @Total_TeaPackets,
        Total_OtherItems = @Total_OtherItems
      WHERE Order_ID = @id
    `);

    return result;
  }

  static async delete(id) {
    await db.poolConnect;
    const request = db.pool.request();
    request.input('id', db.sql.Int, id);

    const result = await request.query(`
      DELETE FROM TeaPackets_Fertilizers WHERE Order_ID = @id
    `);

    return result;
  }
}


// --- Controller functions ---
export const getAllOrders = async (req, res) => {
  try {
    const orders = await TeaPacketsFertilizersModel.getAll();
    res.status(200).json(orders);
  } catch (error) {
    console.error('Error getting orders:', error);
    res.status(500).json({ message: 'Error fetching orders', error: error.message });
  }
};
// Controller function to create multiple orders in bulk


export const getOrderById = async (req, res) => {
  try {
    const order = await TeaPacketsFertilizersModel.getById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.status(200).json(order);
  } catch (error) {
    console.error('Error getting order:', error);
    res.status(500).json({ message: 'Error fetching order', error: error.message });
  }
};

export const getOrdersBySupplier = async (req, res) => {
  try {
    const orders = await TeaPacketsFertilizersModel.getBySupplierId(req.params.supplierId);
    res.status(200).json(orders);
  } catch (error) {
    console.error('Error getting supplier orders:', error);
    res.status(500).json({ message: 'Error fetching supplier orders', error: error.message });
  }
};

// Create single order and send notification to driver
export const createOrder = async (req, res) => {
  try {
    const requiredFields = ['S_RegisterID', 'ProductID', 'Qty', 'Driver_RegisterID']; // Add Driver_RegisterID as required field if applicable
    for (const field of requiredFields) {
      if (!req.body[field]) {
        return res.status(400).json({ message: `${field} is required` });
      }
    }

    await TeaPacketsFertilizersModel.create(req.body);

    // Send notification to driver
    const driverId = req.body.Driver_RegisterID;
    const message = `New order created with product ${req.body.ProductID} (Qty: ${req.body.Qty}).`;
    if (driverId) {
      await sendNotificationToDriver(driverId, message);
    }

    res.status(201).json({ message: 'Order created successfully' });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ message: 'Error creating order', error: error.message });
  }
};

// Create multiple orders in bulk and send notifications to drivers
export const createBulkOrders = async (req, res) => {
  try {
    const orders = req.body;
    if (!Array.isArray(orders) || orders.length === 0) {
      return res.status(400).json({ message: 'An array of orders is required' });
    }

    for (const orderData of orders) {
      const requiredFields = ['S_RegisterID', 'ProductID', 'Qty', 'Driver_RegisterID'];
      for (const field of requiredFields) {
        if (!orderData[field]) {
          return res.status(400).json({ message: `${field} is required in one of the orders` });
        }
      }
    }

    // Bulk insert
    await TeaPacketsFertilizersModel.createBulk(orders);

    // Send notifications to drivers
    for (const orderData of orders) {
      const driverId = orderData.Driver_RegisterID;
      const message = `New order created with product ${orderData.ProductID} (Qty: ${orderData.Qty}).`;
      if (driverId) {
        await sendNotificationToDriver(driverId, message);
      }
    }

    res.status(201).json({ message: 'Bulk orders created successfully' });
  } catch (error) {
    console.error('Error creating bulk orders:', error);
    res.status(500).json({ message: 'Error creating bulk orders', error: error.message });
  }
};


export const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) return res.status(400).json({ message: 'Status is required' });

    const order = await TeaPacketsFertilizersModel.getById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    await TeaPacketsFertilizersModel.updateStatus(req.params.id, status);

    // Send notification to supplier
    if (order.S_RegisterID) {
      const message = `Your order #${req.params.id} status has been updated to "${status}".`;
      await sendNotificationToSupplier(order.S_RegisterID, message);
    }

    res.status(200).json({ message: 'Order status updated successfully' });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ message: 'Error updating order status', error: error.message });
  }
};

export const updateOrder = async (req, res) => {
  try {
    const order = await TeaPacketsFertilizersModel.getById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    await TeaPacketsFertilizersModel.update(req.params.id, req.body);
    res.status(200).json({ message: 'Order updated successfully' });
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({ message: 'Error updating order', error: error.message });
  }
};

export const deleteOrder = async (req, res) => {
  try {
    const order = await TeaPacketsFertilizersModel.getById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    await TeaPacketsFertilizersModel.delete(req.params.id);
    res.status(200).json({ message: 'Order deleted successfully' });
  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({ message: 'Error deleting order', error: error.message });
  }
};
