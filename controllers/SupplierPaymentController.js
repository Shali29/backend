import db from '../config/db.js';
import sql from 'mssql';
import { sendNotificationToSupplier } from '../utils/notificationUtils.js';

const SupplierPayment = {
  async getAll() {
    const result = await db.pool.request().query(`
      SELECT sp.*, s.S_FullName 
      FROM Supplier_Payments sp
      JOIN Supplier s ON sp.S_RegisterID = s.S_RegisterID
      ORDER BY sp.Date DESC
    `);
    return result.recordset;
  },

  async getById(id) {
    const result = await db.pool.request()
      .input('id', sql.Int, id)
      .query(`
        SELECT sp.*, s.S_FullName 
        FROM Supplier_Payments sp
        JOIN Supplier s ON sp.S_RegisterID = s.S_RegisterID
        WHERE sp.PaymentsID = @id
      `);
    return result.recordset.length === 0 ? null : result.recordset[0];
  },

  async getBySupplierId(supplierId) {
    const result = await db.pool.request()
      .input('supplierId', sql.VarChar, supplierId)
      .query(`
        SELECT * FROM Supplier_Payments 
        WHERE S_RegisterID = @supplierId
        ORDER BY Date DESC
      `);
    return result.recordset;
  },

  async calculatePaymentData(supplierId) {
    const result = await db.pool.request()
      .input('supplierId', sql.VarChar, supplierId)
      .query(`
        SELECT 
          s.S_RegisterID,
          COALESCE(SUM(sc.BalanceWeight_kg * sc.Current_Rate), 0) as GrossIncome,
          COALESCE((SELECT SUM(Loan_Amount) FROM Supplier_Loan WHERE S_RegisterID = @supplierId AND Status != 'Successful'), 0) as LoanAmount,
          COALESCE((SELECT SUM(Advance_Amount) FROM Supplier_Advance WHERE S_RegisterID = @supplierId AND Status != 'Transfered'), 0) as AdvanceAmount,
          COALESCE((SELECT SUM(tpf.Qty * p.Rate_per_Bag) 
            FROM TeaPackets_Fertilizers tpf 
            JOIN Products p ON tpf.ProductID = p.ProductID 
            WHERE tpf.S_RegisterID = @supplierId AND tpf.Order_Status = 'Completed'), 0) as ProductsAmount
        FROM Supplier s
        LEFT JOIN Supplier_Collection sc ON s.S_RegisterID = sc.S_RegisterID
        WHERE s.S_RegisterID = @supplierId
        GROUP BY s.S_RegisterID
      `);

    const data = result.recordset[0] || {
      S_RegisterID: supplierId,
      GrossIncome: 0,
      LoanAmount: 0,
      AdvanceAmount: 0,
      ProductsAmount: 0
    };

    data.TransportCharge = 100;
    data.FinalTotal = data.GrossIncome - data.LoanAmount - data.AdvanceAmount - data.ProductsAmount - data.TransportCharge;
    return data;
  },

  async create(paymentData) {
    const result = await db.pool.request()
      .input('S_RegisterID', sql.VarChar, paymentData.S_RegisterID)
      .input('Supplier_Loan_Amount', sql.Decimal(10, 2), paymentData.Supplier_Loan_Amount)
      .input('Supplier_Advance_Amount', sql.Decimal(10, 2), paymentData.Supplier_Advance_Amount)
      .input('TeaPackets_Fertilizers_Amount', sql.Decimal(10, 2), paymentData.TeaPackets_Fertilizers_Amount)
      .input('Transport_Charge', sql.Decimal(10, 2), paymentData.Transport_Charge)
      .input('Final_Total_Salary', sql.Decimal(10, 2), paymentData.Final_Total_Salary)
      .input('Status', sql.VarChar, paymentData.Status || 'Pending')
      .query(`
        INSERT INTO Supplier_Payments (
          S_RegisterID, Supplier_Loan_Amount, Supplier_Advance_Amount,
          TeaPackets_Fertilizers_Amount, Transport_Charge, Final_Total_Salary,
          Date, Status
        ) VALUES (
          @S_RegisterID, @Supplier_Loan_Amount, @Supplier_Advance_Amount,
          @TeaPackets_Fertilizers_Amount, @Transport_Charge, @Final_Total_Salary,
          GETDATE(), @Status
        )
      `);
    return result;
  },

  async updateStatus(id, status) {
    const result = await db.pool.request()
      .input('id', sql.Int, id)
      .input('Status', sql.VarChar, status)
      .query(`UPDATE Supplier_Payments SET Status = @Status WHERE PaymentsID = @id`);
    return result;
  },

  async update(id, paymentData) {
    const result = await db.pool.request()
      .input('id', sql.Int, id)
      .input('S_RegisterID', sql.VarChar, paymentData.S_RegisterID)
      .input('Supplier_Loan_Amount', sql.Decimal(10, 2), paymentData.Supplier_Loan_Amount)
      .input('Supplier_Advance_Amount', sql.Decimal(10, 2), paymentData.Supplier_Advance_Amount)
      .input('TeaPackets_Fertilizers_Amount', sql.Decimal(10, 2), paymentData.TeaPackets_Fertilizers_Amount)
      .input('Transport_Charge', sql.Decimal(10, 2), paymentData.Transport_Charge)
      .input('Final_Total_Salary', sql.Decimal(10, 2), paymentData.Final_Total_Salary)
      .input('Date', sql.Date, paymentData.Date || new Date().toISOString().split('T')[0])
      .input('Status', sql.VarChar, paymentData.Status)
      .query(`
        UPDATE Supplier_Payments SET 
          S_RegisterID = @S_RegisterID,
          Supplier_Loan_Amount = @Supplier_Loan_Amount,
          Supplier_Advance_Amount = @Supplier_Advance_Amount,
          TeaPackets_Fertilizers_Amount = @TeaPackets_Fertilizers_Amount,
          Transport_Charge = @Transport_Charge,
          Final_Total_Salary = @Final_Total_Salary,
          Date = @Date,
          Status = @Status
        WHERE PaymentsID = @id
      `);
    return result;
  },

  async delete(id) {
    const result = await db.pool.request()
      .input('id', sql.Int, id)
      .query('DELETE FROM Supplier_Payments WHERE PaymentsID = @id');
    return result;
  },

  async calculate(supplierId) {
    return this.calculatePaymentData(supplierId);
  },

  async getStatistics() {
    const totalPaid = await db.pool.request().query(`
      SELECT SUM(Final_Total_Salary) as totalPaid FROM Supplier_Payments WHERE Status = 'Completed'
    `);

    const counts = await db.pool.request().query(`
      SELECT 
        COUNT(*) as totalPayments,
        SUM(CASE WHEN Status = 'Pending' THEN 1 ELSE 0 END) as pendingPayments,
        SUM(CASE WHEN Status = 'Completed' THEN 1 ELSE 0 END) as completedPayments
      FROM Supplier_Payments
    `);

    return {
      totalPaid: totalPaid.recordset[0].totalPaid || 0,
      stats: counts.recordset[0]
    };
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
    const { id } = req.params;
    const { Status } = req.body;

    if (!Status) {
      return res.status(400).json({ message: 'Status is required' });
    }

    const updated = await SupplierPayment.updateStatus(id, Status);

    if (!updated) {
      return res.status(400).json({ message: 'Failed to update payment status' });
    }

    const payment = await SupplierPayment.getById(id);
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found after update' });
    }

    const message = `Your payment with ID ${id} status has been updated to "${Status}".`;
    await sendNotificationToSupplier(payment.S_RegisterID, message);

    res.status(200).json(payment);
  } catch (error) {
    console.error('Error updating payment status:', error);
    res.status(500).json({ message: 'Error updating payment status', error: error.message });
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