// controller.js
import db from '../config/db.js';

// --- Model inside controller ---
class TeaPacketsFertilizersModel {
  static getAll() {
    return new Promise((resolve, reject) => {
      db.query(`
        SELECT tpf.*, s.S_FullName, p.ProductName, p.Rate_per_Bag
        FROM TeaPackets_Fertilizers tpf
        JOIN Supplier s ON tpf.S_RegisterID = s.S_RegisterID
        JOIN Products p ON tpf.ProductID = p.ProductID
        ORDER BY tpf.Request_Date DESC
      `, (err, results) => {
        if (err) return reject(err);
        resolve(results);
      });
    });
  }

  static getById(id) {
    return new Promise((resolve, reject) => {
      db.query(`
        SELECT tpf.*, s.S_FullName, p.ProductName, p.Rate_per_Bag
        FROM TeaPackets_Fertilizers tpf
        JOIN Supplier s ON tpf.S_RegisterID = s.S_RegisterID
        JOIN Products p ON tpf.ProductID = p.ProductID
        WHERE tpf.Order_ID = ?
      `, [id], (err, results) => {
        if (err) return reject(err);
        if (results.length === 0) return resolve(null);
        resolve(results[0]);
      });
    });
  }

  static getBySupplierId(supplierId) {
    return new Promise((resolve, reject) => {
      db.query(`
        SELECT tpf.*, p.ProductName, p.Rate_per_Bag
        FROM TeaPackets_Fertilizers tpf
        JOIN Products p ON tpf.ProductID = p.ProductID
        WHERE tpf.S_RegisterID = ?
        ORDER BY tpf.Request_Date DESC
      `, [supplierId], (err, results) => {
        if (err) return reject(err);
        resolve(results);
      });
    });
  }

  static create(orderData) {
    return new Promise((resolve, reject) => {
      const query = `
        INSERT INTO TeaPackets_Fertilizers (
          S_RegisterID, ProductID, Qty, Request_Date, Order_Status, 
          Total_Items, Total_TeaPackets, Total_OtherItems
        ) VALUES (?, ?, ?, CURDATE(), ?, ?, ?, ?)
      `;

      orderData.Order_Status = orderData.Order_Status || 'Pending';
      orderData.Total_Items = orderData.Total_Items || orderData.Qty;
      orderData.Total_TeaPackets = orderData.Total_TeaPackets || 0;
      orderData.Total_OtherItems = orderData.Total_OtherItems || orderData.Qty;

      db.query(query, [
        orderData.S_RegisterID,
        orderData.ProductID,
        orderData.Qty,
        orderData.Order_Status,
        orderData.Total_Items,
        orderData.Total_TeaPackets,
        orderData.Total_OtherItems
      ], (err, result) => {
        if (err) return reject(err);
        resolve(result);
      });
    });
  }

  static updateStatus(id, status) {
    return new Promise((resolve, reject) => {
      db.query(
        'UPDATE TeaPackets_Fertilizers SET Order_Status = ? WHERE Order_ID = ?',
        [status, id],
        (err, result) => {
          if (err) return reject(err);
          resolve(result);
        }
      );
    });
  }

  static update(id, orderData) {
    return new Promise((resolve, reject) => {
      const query = `
        UPDATE TeaPackets_Fertilizers SET 
          S_RegisterID = ?, 
          ProductID = ?, 
          Qty = ?, 
          Order_Status = ?, 
          Total_Items = ?, 
          Total_TeaPackets = ?, 
          Total_OtherItems = ?
        WHERE Order_ID = ?
      `;

      db.query(query, [
        orderData.S_RegisterID,
        orderData.ProductID,
        orderData.Qty,
        orderData.Order_Status,
        orderData.Total_Items,
        orderData.Total_TeaPackets,
        orderData.Total_OtherItems,
        id
      ], (err, result) => {
        if (err) return reject(err);
        resolve(result);
      });
    });
  }

  static delete(id) {
    return new Promise((resolve, reject) => {
      db.query('DELETE FROM TeaPackets_Fertilizers WHERE Order_ID = ?', [id], (err, result) => {
        if (err) return reject(err);
        resolve(result);
      });
    });
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

export const getOrderById = async (req, res) => {
  try {
    const order = await TeaPacketsFertilizersModel.getById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
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
    const requiredFields = ['S_RegisterID', 'ProductID', 'Qty'];
    for (const field of requiredFields) {
      if (!req.body[field]) {
        return res.status(400).json({ message: `${field} is required` });
      }
    }

    // Product model access is missing in your original code snippet.
    // You need to import Product model if you are checking stock.
    // Here assumed you will add it separately if needed.

    await TeaPacketsFertilizersModel.create(req.body);

    res.status(201).json({ message: 'Order created successfully' });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ message: 'Error creating order', error: error.message });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }

    const order = await TeaPacketsFertilizersModel.getById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    await TeaPacketsFertilizersModel.updateStatus(req.params.id, status);
    res.status(200).json({ message: 'Order status updated successfully' });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ message: 'Error updating order status', error: error.message });
  }
};

export const updateOrder = async (req, res) => {
  try {
    const order = await TeaPacketsFertilizersModel.getById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

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
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    await TeaPacketsFertilizersModel.delete(req.params.id);
    res.status(200).json({ message: 'Order deleted successfully' });
  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({ message: 'Error deleting order', error: error.message });
  }
};
