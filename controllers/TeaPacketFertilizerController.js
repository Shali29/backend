import db from '../config/db.js';
import { sendNotificationToDriver } from '../utils/notificationUtils.js';
import { sendNotificationToSupplier } from '../utils/notificationUtils.js';

class TeaPacketsFertilizersModel {
  // Helper to update stock within a transaction
  static async updateStock(transaction, productId, qtyChange) {
    const request = transaction.request();
    request.input('id', db.sql.VarChar, productId);
    request.input('qtyChange', db.sql.Int, qtyChange);

    const result = await request.query(`
      UPDATE Products
      SET Stock_bag = Stock_bag + @qtyChange
      WHERE ProductID = @id AND (Stock_bag + @qtyChange) >= 0
    `);

    if (result.rowsAffected[0] === 0) {
      throw new Error('Not enough stock available to update');
    }
  }

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

  // Bulk create with stock deduction
  static async createBulk(orders) {
    await db.poolConnect;
    const transaction = new db.sql.Transaction(db.pool);
    try {
      await transaction.begin();

      for (const orderData of orders) {
        const status = orderData.Order_Status || 'Pending';
        const totalItems = orderData.Total_Items || orderData.Qty;
        const totalTea = orderData.Total_TeaPackets || 0;
        const totalOther = orderData.Total_OtherItems || orderData.Qty;

        // Deduct stock for this order
        await this.updateStock(transaction, orderData.ProductID, -orderData.Qty);

        const request = transaction.request();
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

  // Single create with stock deduction
  static async create(orderData) {
    await db.poolConnect;
    const transaction = new db.sql.Transaction(db.pool);
    try {
      await transaction.begin();

      const status = orderData.Order_Status || 'Pending';
      const totalItems = orderData.Total_Items || orderData.Qty;
      const totalTea = orderData.Total_TeaPackets || 0;
      const totalOther = orderData.Total_OtherItems || orderData.Qty;

      // Deduct stock from product
      await this.updateStock(transaction, orderData.ProductID, -orderData.Qty);

      const request = transaction.request();

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

      await transaction.commit();
      return;
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
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

  // Update order and adjust stock according to qty difference or product change
  static async update(id, orderData) {
    await db.poolConnect;
    const transaction = new db.sql.Transaction(db.pool);

    try {
      await transaction.begin();

      // Fetch old order
      const oldOrderResult = await transaction.request()
        .input('id', db.sql.Int, id)
        .query(`SELECT * FROM TeaPackets_Fertilizers WHERE Order_ID = @id`);
      const oldOrder = oldOrderResult.recordset[0];
      if (!oldOrder) throw new Error('Order not found');

      // Stock adjustment
      if (oldOrder.ProductID !== orderData.ProductID) {
        // Restore old product stock
        await this.updateStock(transaction, oldOrder.ProductID, oldOrder.Qty);
        // Deduct new product stock
        await this.updateStock(transaction, orderData.ProductID, -orderData.Qty);
      } else {
        // Same product: adjust stock by difference
        const qtyDiff = oldOrder.Qty - orderData.Qty; // positive means stock increases (qty reduced)
        await this.updateStock(transaction, orderData.ProductID, qtyDiff);
      }

      // Update order data
      const request = transaction.request();
      request.input('id', db.sql.Int, id);
      request.input('S_RegisterID', db.sql.VarChar, orderData.S_RegisterID);
      request.input('ProductID', db.sql.VarChar, orderData.ProductID);
      request.input('Qty', db.sql.Int, orderData.Qty);
      request.input('Order_Status', db.sql.VarChar, orderData.Order_Status);
      request.input('Total_Items', db.sql.Int, orderData.Total_Items);
      request.input('Total_TeaPackets', db.sql.Int, orderData.Total_TeaPackets);
      request.input('Total_OtherItems', db.sql.Int, orderData.Total_OtherItems);

      await request.query(`
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

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }

  // Delete order and restore stock
  static async delete(id) {
    await db.poolConnect;
    const transaction = new db.sql.Transaction(db.pool);

    try {
      await transaction.begin();

      // Get order to restore stock
      const orderResult = await transaction.request()
        .input('id', db.sql.Int, id)
        .query('SELECT * FROM TeaPackets_Fertilizers WHERE Order_ID = @id');

      const order = orderResult.recordset[0];
      if (!order) throw new Error('Order not found');

      // Restore stock
      await this.updateStock(transaction, order.ProductID, order.Qty);

      // Delete order
      await transaction.request()
        .input('id', db.sql.Int, id)
        .query('DELETE FROM TeaPackets_Fertilizers WHERE Order_ID = @id');

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }
}


// --- Controller functions ---
// (You can leave controller code unchanged, as model handles stock adjustments)

export const getAllOrders = async (req, res) => {
  try {
    const orders = await TeaPacketsFertilizersModel.getAll();
    res.status(200).json(orders);
  } catch (error) {
    console.error('Error getting orders:', error);
    res.status(500).json({ message: 'Error fetching orders', error: error.message });
  }
};

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

export const createOrder = async (req, res) => {
  try {
    const requiredFields = ['S_RegisterID', 'ProductID', 'Qty', 'Driver_RegisterID'];
    for (const field of requiredFields) {
      if (!req.body[field]) {
        return res.status(400).json({ message: `${field} is required` });
      }
    }

    await TeaPacketsFertilizersModel.create(req.body);

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

    await TeaPacketsFertilizersModel.createBulk(orders);

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
