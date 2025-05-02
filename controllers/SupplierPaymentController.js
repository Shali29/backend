import db from '../config/db.js';

// Model functions
const SupplierPayment = {
  // Get all supplier payments
  async getAll() {
    try {
      const [results] = await db.query(`
        SELECT sp.*, s.S_FullName 
        FROM Supplier_Payments sp
        JOIN Supplier s ON sp.S_RegisterID = s.S_RegisterID
        ORDER BY sp.Date DESC
      `);
      return results;
    } catch (error) {
      throw error;
    }
  },

  // Get a supplier payment by ID
  async getById(id) {
    try {
      const [results] = await db.query(`
        SELECT sp.*, s.S_FullName 
        FROM Supplier_Payments sp
        JOIN Supplier s ON sp.S_RegisterID = s.S_RegisterID
        WHERE sp.PaymentsID = ?
      `, [id]);
      return results.length === 0 ? null : results[0];
    } catch (error) {
      throw error;
    }
  },

  // Get supplier payments by supplier ID
  async getBySupplierId(supplierId) {
    try {
      const [results] = await db.query(`
        SELECT * FROM Supplier_Payments 
        WHERE S_RegisterID = ?
        ORDER BY Date DESC
      `, [supplierId]);
      return results;
    } catch (error) {
      throw error;
    }
  },

  // Calculate payment data for a supplier
  async calculatePaymentData(supplierId) {
    try {
      const [results] = await db.query(`
        SELECT 
          s.S_RegisterID,
          COALESCE(SUM(sc.BalanceWeight_kg * sc.Current_Rate), 0) as GrossIncome,
          COALESCE((SELECT SUM(Loan_Amount) FROM Supplier_Loan WHERE S_RegisterID = ? AND Status != 'Successful'), 0) as LoanAmount,
          COALESCE((SELECT SUM(Advance_Amount) FROM Supplier_Advance WHERE S_RegisterID = ? AND Status != 'Transfered'), 0) as AdvanceAmount,
          COALESCE((SELECT SUM(tpf.Qty * p.Rate_per_Bag) 
            FROM TeaPackets_Fertilizers tpf 
            JOIN Products p ON tpf.ProductID = p.ProductID 
            WHERE tpf.S_RegisterID = ? AND tpf.Order_Status = 'Completed'), 0) as ProductsAmount
        FROM Supplier s
        LEFT JOIN Supplier_Collection sc ON s.S_RegisterID = sc.S_RegisterID
        WHERE s.S_RegisterID = ?
        GROUP BY s.S_RegisterID
      `, [supplierId, supplierId, supplierId, supplierId]);

      if (results.length === 0) {
        const [noCollectionResults] = await db.query(`
          SELECT 
            S_RegisterID,
            0 as GrossIncome,
            COALESCE((SELECT SUM(Loan_Amount) FROM Supplier_Loan WHERE S_RegisterID = ? AND Status != 'Successful'), 0) as LoanAmount,
            COALESCE((SELECT SUM(Advance_Amount) FROM Supplier_Advance WHERE S_RegisterID = ? AND Status != 'Transfered'), 0) as AdvanceAmount,
            COALESCE((SELECT SUM(tpf.Qty * p.Rate_per_Bag) 
              FROM TeaPackets_Fertilizers tpf 
              JOIN Products p ON tpf.ProductID = p.ProductID 
              WHERE tpf.S_RegisterID = ? AND tpf.Order_Status = 'Completed'), 0) as ProductsAmount
          FROM Supplier
          WHERE S_RegisterID = ?
        `, [supplierId, supplierId, supplierId, supplierId]);

        if (noCollectionResults.length === 0) {
          return {
            S_RegisterID: supplierId,
            GrossIncome: 0,
            LoanAmount: 0,
            AdvanceAmount: 0,
            ProductsAmount: 0,
            TransportCharge: 100,
            FinalTotal: 0
          };
        }

        const data = noCollectionResults[0];
        data.TransportCharge = 100;
        data.FinalTotal = data.GrossIncome - data.LoanAmount - data.AdvanceAmount - data.ProductsAmount - data.TransportCharge;
        return data;
      }

      const data = results[0];
      data.TransportCharge = 100;
      data.FinalTotal = data.GrossIncome - data.LoanAmount - data.AdvanceAmount - data.ProductsAmount - data.TransportCharge;
      return data;
    } catch (error) {
      throw error;
    }
  },

  // Create a new payment
  async create(paymentData) {
    try {
      const query = `
        INSERT INTO Supplier_Payments (
          S_RegisterID, Supplier_Loan_Amount, Supplier_Advance_Amount, 
          TeaPackets_Fertilizers_Amount, Transport_Charge, Final_Total_Salary, 
          Date, Status
        ) VALUES (?, ?, ?, ?, ?, ?, CURDATE(), ?)
      `;
      
      const [result] = await db.query(
        query,
        [
          paymentData.S_RegisterID,
          paymentData.Supplier_Loan_Amount,
          paymentData.Supplier_Advance_Amount,
          paymentData.TeaPackets_Fertilizers_Amount,
          paymentData.Transport_Charge,
          paymentData.Final_Total_Salary,
          paymentData.Status || 'Pending'
        ]
      );
      return result;
    } catch (error) {
      throw error;
    }
  },

  // Update the status of a payment
  async updateStatus(id, status) {
    try {
      const [result] = await db.query(
        'UPDATE Supplier_Payments SET Status = ? WHERE PaymentsID = ?',
        [status, id]
      );
      return result;
    } catch (error) {
      throw error;
    }
  },

  // Update payment data
  async update(id, paymentData) {
    try {
      const query = `
        UPDATE Supplier_Payments SET 
          S_RegisterID = ?, 
          Supplier_Loan_Amount = ?, 
          Supplier_Advance_Amount = ?, 
          TeaPackets_Fertilizers_Amount = ?, 
          Transport_Charge = ?, 
          Final_Total_Salary = ?, 
          Date = ?, 
          Status = ? 
        WHERE PaymentsID = ?
      `;

      const [result] = await db.query(
        query,
        [
          paymentData.S_RegisterID,
          paymentData.Supplier_Loan_Amount,
          paymentData.Supplier_Advance_Amount,
          paymentData.TeaPackets_Fertilizers_Amount,
          paymentData.Transport_Charge,
          paymentData.Final_Total_Salary,
          paymentData.Date || new Date().toISOString().split('T')[0],
          paymentData.Status,
          id
        ]
      );
      return result;
    } catch (error) {
      throw error;
    }
  },

  // Delete payment by ID
  async delete(id) {
    try {
      const [result] = await db.query('DELETE FROM Supplier_Payments WHERE PaymentsID = ?', [id]);
      return result;
    } catch (error) {
      throw error;
    }
  },

  // Calculate method for compatibility with controller
  async calculate(supplierId) {
    return this.calculatePaymentData(supplierId);
  },

  // Add statistics method to match controller
  async getStatistics() {
    try {
      const [totalPaid] = await db.query(
        'SELECT SUM(Final_Total_Salary) as totalPaid FROM Supplier_Payments WHERE Status = "Completed"'
      );
      
      const [counts] = await db.query(`
        SELECT 
          COUNT(*) as totalPayments,
          SUM(CASE WHEN Status = 'Pending' THEN 1 ELSE 0 END) as pendingPayments,
          SUM(CASE WHEN Status = 'Completed' THEN 1 ELSE 0 END) as completedPayments
        FROM Supplier_Payments
      `);
      
      return {
        totalPaid: totalPaid[0].totalPaid || 0,
        stats: counts[0]
      };
    } catch (error) {
      throw error;
    }
  }
};

// Controller functions
export const getAllPayments = async (req, res) => {
  try {
    const payments = await SupplierPayment.getAll();
    res.status(200).json(payments);
  } catch (error) {
    console.error('Error fetching supplier payments:', error);
    res.status(500).json({ message: 'Error fetching supplier payments', error: error.message });
  }
};

export const getPaymentsBySupplier = async (req, res) => {
  try {
    const payments = await SupplierPayment.getBySupplierId(req.params.supplierId);
    if (payments.length === 0) {
      return res.status(404).json({ message: 'No payments found for this supplier' });
    }
    res.status(200).json(payments);
  } catch (error) {
    console.error('Error fetching supplier payments:', error);
    res.status(500).json({ message: 'Error fetching supplier payments', error: error.message });
  }
};

export const getPaymentById = async (req, res) => {
  try {
    const payment = await SupplierPayment.getById(req.params.id);
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }
    res.status(200).json(payment);
  } catch (error) {
    console.error('Error fetching payment:', error);
    res.status(500).json({ message: 'Error fetching payment', error: error.message });
  }
};

export const createPayment = async (req, res) => {
  try {
    const newPayment = await SupplierPayment.create(req.body);
    res.status(201).json(newPayment);
  } catch (error) {
    console.error('Error creating payment:', error);
    res.status(500).json({ message: 'Error creating payment', error: error.message });
  }
};

export const updatePayment = async (req, res) => {
  try {
    const updated = await SupplierPayment.update(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ message: 'Payment not found or update failed' });
    }
    const payment = await SupplierPayment.getById(req.params.id);
    res.status(200).json(payment);
  } catch (error) {
    console.error('Error updating payment:', error);
    res.status(500).json({ message: 'Error updating payment', error: error.message });
  }
};

export const deletePayment = async (req, res) => {
  try {
    const deleted = await SupplierPayment.delete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Payment not found' });
    }
    res.status(200).json({ message: 'Payment deleted successfully' });
  } catch (error) {
    console.error('Error deleting payment:', error);
    res.status(500).json({ message: 'Error deleting payment', error: error.message });
  }
};

export const updatePaymentStatus = async (req, res) => {
  try {
    const updated = await SupplierPayment.updateStatus(req.params.id, req.body.Status);
    if (!updated) {
      return res.status(400).json({ message: 'Failed to update payment status' });
    }
    const payment = await SupplierPayment.getById(req.params.id);
    res.status(200).json(payment);
  } catch (error) {
    console.error('Error updating payment status:', error);
    res.status(500).json({ message: 'Error updating payment status', error: error.message });
  }
};

export const calculatePayment = async (req, res) => {
  try {
    const result = await SupplierPayment.calculate(req.params.supplierId);
    res.status(200).json(result);
  } catch (error) {
    console.error('Error calculating payment:', error);
    res.status(500).json({ message: 'Error calculating payment', error: error.message });
  }
};

export const getPaymentStatistics = async (req, res) => {
  try {
    const stats = await SupplierPayment.getStatistics();
    res.status(200).json(stats);
  } catch (error) {
    console.error('Error fetching payment statistics:', error);
    res.status(500).json({ message: 'Error fetching payment statistics', error: error.message });
  }
};