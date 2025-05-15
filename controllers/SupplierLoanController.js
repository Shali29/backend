import db from '../config/db.js';
import sql from 'mssql'; // Ensure this is installed and imported

class Loan {
  static async getAll() {
    try {
      const result = await db.pool.request().query(`
        SELECT sl.*, s.S_FullName 
        FROM Supplier_Loan sl
        JOIN Supplier s ON sl.S_RegisterID = s.S_RegisterID
        ORDER BY sl.Due_Date ASC
      `);
      return result.recordset;
    } catch (error) {
      throw error;
    }
  }

  static async getById(id) {
    try {
      const result = await db.pool.request()
        .input('id', sql.Int, id)
        .query(`
          SELECT sl.*, s.S_FullName 
          FROM Supplier_Loan sl
          JOIN Supplier s ON sl.S_RegisterID = s.S_RegisterID
          WHERE sl.LoanID = @id
        `);
      return result.recordset.length === 0 ? null : result.recordset[0];
    } catch (error) {
      throw error;
    }
  }

  static async getBySupplier(supplierId) {
    try {
      const result = await db.pool.request()
        .input('supplierId', sql.VarChar, supplierId)
        .query(`
          SELECT * FROM Supplier_Loan 
          WHERE S_RegisterID = @supplierId
          ORDER BY Due_Date ASC
        `);
      return result.recordset;
    } catch (error) {
      throw error;
    }
  }

  static async create(loanData) {
    try {
      const monthlyAmount = loanData.Duration > 0 ?
        loanData.Loan_Amount / loanData.Duration : loanData.Loan_Amount;

      const dueDate = new Date();
      dueDate.setMonth(dueDate.getMonth() + loanData.Duration);
      const formattedDueDate = dueDate.toISOString().split('T')[0];

      const result = await db.pool.request()
        .input('S_RegisterID', sql.VarChar, loanData.S_RegisterID)
        .input('Loan_Amount', sql.Decimal(10, 2), loanData.Loan_Amount)
        .input('Duration', sql.Int, loanData.Duration)
        .input('PurposeOfLoan', sql.NVarChar, loanData.PurposeOfLoan)
        .input('Monthly_Amount', sql.Decimal(10, 2), monthlyAmount)
        .input('Due_Date', sql.Date, formattedDueDate)
        .input('Status', sql.VarChar, loanData.Status || 'Pending')
        .query(`
          INSERT INTO Supplier_Loan (
            S_RegisterID, Loan_Amount, Duration, PurposeOfLoan, 
            Monthly_Amount, Due_Date, Status
          )
          VALUES (
            @S_RegisterID, @Loan_Amount, @Duration, @PurposeOfLoan,
            @Monthly_Amount, @Due_Date, @Status
          )
        `);
      return result;
    } catch (error) {
      throw error;
    }
  }

  static async updateStatus(id, status) {
    try {
      const result = await db.pool.request()
        .input('id', sql.Int, id)
        .input('status', sql.VarChar, status)
        .query('UPDATE Supplier_Loan SET Status = @status WHERE LoanID = @id');
      return result;
    } catch (error) {
      throw error;
    }
  }

  static async update(id, loanData) {
    try {
      const monthlyAmount = loanData.Duration > 0 ?
        loanData.Loan_Amount / loanData.Duration : loanData.Loan_Amount;

      let dueDate = loanData.Due_Date;
      if (!dueDate) {
        const d = new Date();
        d.setMonth(d.getMonth() + loanData.Duration);
        dueDate = d.toISOString().split('T')[0];
      }

      const result = await db.pool.request()
        .input('id', sql.Int, id)
        .input('S_RegisterID', sql.VarChar, loanData.S_RegisterID)
        .input('Loan_Amount', sql.Decimal(10, 2), loanData.Loan_Amount)
        .input('Duration', sql.Int, loanData.Duration)
        .input('PurposeOfLoan', sql.NVarChar, loanData.PurposeOfLoan)
        .input('Monthly_Amount', sql.Decimal(10, 2), monthlyAmount)
        .input('Due_Date', sql.Date, dueDate)
        .input('Status', sql.VarChar, loanData.Status)
        .query(`
          UPDATE Supplier_Loan SET 
            S_RegisterID = @S_RegisterID,
            Loan_Amount = @Loan_Amount,
            Duration = @Duration,
            PurposeOfLoan = @PurposeOfLoan,
            Monthly_Amount = @Monthly_Amount,
            Due_Date = @Due_Date,
            Status = @Status
          WHERE LoanID = @id
        `);
      return result;
    } catch (error) {
      throw error;
    }
  }
static async updateStatus(id, status) {
  try {
    const result = await db.pool.request()
      .input('id', sql.Int, id)
      .input('status', sql.VarChar, status)
      .query('UPDATE Supplier_Loan SET Status = @status WHERE LoanID = @id');
    return result;
  } catch (error) {
    throw error;
  }
}

  static async delete(id) {
    try {
      const result = await db.pool.request()
        .input('id', sql.Int, id)
        .query('DELETE FROM Supplier_Loan WHERE LoanID = @id');
      return result;
    } catch (error) {
      throw error;
    }
  }

  static async getStatistics() {
    try {
      const totalLoans = await db.pool.request().query(`
        SELECT COUNT(*) as count, SUM(Loan_Amount) as totalAmount 
        FROM Supplier_Loan
      `);

      const pendingLoans = await db.pool.request().query(`
        SELECT COUNT(*) as count, SUM(Loan_Amount) as totalAmount 
        FROM Supplier_Loan WHERE Status = 'Pending'
      `);

      const paidLoans = await db.pool.request().query(`
        SELECT COUNT(*) as count, SUM(Loan_Amount) as totalAmount 
        FROM Supplier_Loan WHERE Status = 'Paid'
      `);

      const overdueLoans = await db.pool.request().query(`
        SELECT COUNT(*) as count, SUM(Loan_Amount) as totalAmount 
        FROM Supplier_Loan 
        WHERE Due_Date < GETDATE() AND Status != 'Paid'
      `);

      return {
        total: totalLoans.recordset[0],
        pending: pendingLoans.recordset[0],
        paid: paidLoans.recordset[0],
        overdue: overdueLoans.recordset[0]
      };
    } catch (error) {
      throw error;
    }
  }
}


// Controller functions
// Get all supplier loans
export const getAllLoans = async (req, res) => {
  try {
    const loans = await Loan.getAll();
    res.status(200).json(loans);
  } catch (error) {
    console.error('Error fetching supplier loans:', error);
    res.status(500).json({ message: 'Error fetching supplier loans', error: error.message });
  }
};

// Get loans by supplier ID
export const getLoansBySupplier = async (req, res) => {
  try {
    const loans = await Loan.getBySupplier(req.params.supplierId);
    if (loans.length === 0) {
      return res.status(404).json({ message: 'No loans found for this supplier' });
    }
    res.status(200).json(loans);
  } catch (error) {
    console.error('Error fetching supplier loans:', error);
    res.status(500).json({ message: 'Error fetching supplier loans', error: error.message });
  }
};

// Get loan by ID
export const getLoanById = async (req, res) => {
  try {
    const loan = await Loan.getById(req.params.id);
    if (!loan) {
      return res.status(404).json({ message: 'Loan not found' });
    }
    res.status(200).json(loan);
  } catch (error) {
    console.error('Error fetching loan:', error);
    res.status(500).json({ message: 'Error fetching loan', error: error.message });
  }
};

// Create a new loan
export const createLoan = async (req, res) => {
  try {
    const loanData = req.body;

    if (!loanData.S_RegisterID || !loanData.Loan_Amount) {
      return res.status(400).json({ message: 'Supplier ID and Loan Amount are required' });
    }

    const newLoan = await Loan.create(loanData);
    res.status(201).json(newLoan);
  } catch (error) {
    console.error('Error creating loan:', error);
    res.status(500).json({ message: 'Error creating loan', error: error.message });
  }
};
export const updateLoanStatus = async (req, res) => {
  try {
    const id = req.params.id;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }

    const result = await Loan.updateStatus(id, status);
    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ message: 'Loan not found' });
    }

    // Optionally, return updated loan data
    const updatedLoan = await Loan.getById(id);
    res.status(200).json({ message: 'Status updated successfully', loan: updatedLoan });
  } catch (error) {
    console.error('Error updating loan status:', error);
    res.status(500).json({ message: 'Error updating loan status', error: error.message });
  }
};
// Update a loan
export const updateLoan = async (req, res) => {
  try {
    const updated = await Loan.update(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ message: 'Loan not found' });
    }
    const updatedLoan = await Loan.getById(req.params.id);
    res.status(200).json(updatedLoan);
  } catch (error) {
    console.error('Error updating loan:', error);
    res.status(500).json({ message: 'Error updating loan', error: error.message });
  }
};

// Delete a loan
export const deleteLoan = async (req, res) => {
  try {
    const deleted = await Loan.delete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Loan not found' });
    }
    res.status(200).json({ message: 'Loan deleted successfully' });
  } catch (error) {
    console.error('Error deleting loan:', error);
    res.status(500).json({ message: 'Error deleting loan', error: error.message });
  }
};

// Get loan statistics
export const getLoanStatistics = async (req, res) => {
  try {
    const stats = await Loan.getStatistics();
    res.status(200).json(stats);
  } catch (error) {
    console.error('Error fetching loan statistics:', error);
    res.status(500).json({ message: 'Error fetching loan statistics', error: error.message });
  }
};