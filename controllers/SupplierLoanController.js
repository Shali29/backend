import db from '../config/db.js';

// Model class
class Loan {
  // Fetch all supplier loans ordered by due date
  static async getAll() {
    try {
      const [results] = await db.query(`
        SELECT sl.*, s.S_FullName 
        FROM Supplier_Loan sl
        JOIN Supplier s ON sl.S_RegisterID = s.S_RegisterID
        ORDER BY sl.Due_Date ASC
      `);
      return results;
    } catch (error) {
      throw error;
    }
  }

  // Fetch a supplier loan by its ID
  static async getById(id) {
    try {
      const [results] = await db.query(`
        SELECT sl.*, s.S_FullName 
        FROM Supplier_Loan sl
        JOIN Supplier s ON sl.S_RegisterID = s.S_RegisterID
        WHERE sl.LoanID = ?
      `, [id]);
      
      return results.length === 0 ? null : results[0];
    } catch (error) {
      throw error;
    }
  }

  // Fetch all loans for a specific supplier ordered by due date
  // Note: Fixed method name from getBySupplierId to getBySupplier to match controller usage
  static async getBySupplier(supplierId) {
    try {
      const [results] = await db.query(`
        SELECT * FROM Supplier_Loan 
        WHERE S_RegisterID = ?
        ORDER BY Due_Date ASC
      `, [supplierId]);
      return results;
    } catch (error) {
      throw error;
    }
  }

  // Create a new supplier loan
  static async create(loanData) {
    try {
      // Calculate the monthly amount based on loan amount and duration
      const monthlyAmount = loanData.Duration > 0 ? 
        loanData.Loan_Amount / loanData.Duration : loanData.Loan_Amount;
      
      // Calculate due date (current date + duration in months)
      const dueDate = new Date();
      dueDate.setMonth(dueDate.getMonth() + loanData.Duration);
      
      const query = `
        INSERT INTO Supplier_Loan (
          S_RegisterID, Loan_Amount, Duration, PurposeOfLoan, 
          Monthly_Amount, Due_Date, Status
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `;
      
      const [result] = await db.query(query, [
        loanData.S_RegisterID,
        loanData.Loan_Amount,
        loanData.Duration,
        loanData.PurposeOfLoan,
        monthlyAmount,
        dueDate.toISOString().split('T')[0], // Format as YYYY-MM-DD
        loanData.Status || 'Pending'
      ]);
      
      return result;
    } catch (error) {
      throw error;
    }
  }

  // Update the status of a supplier loan
  static async updateStatus(id, status) {
    try {
      const [result] = await db.query(
        'UPDATE Supplier_Loan SET Status = ? WHERE LoanID = ?',
        [status, id]
      );
      return result;
    } catch (error) {
      throw error;
    }
  }

  // Update an existing supplier loan
  static async update(id, loanData) {
    try {
      // Calculate the monthly amount based on loan amount and duration
      const monthlyAmount = loanData.Duration > 0 ? 
        loanData.Loan_Amount / loanData.Duration : loanData.Loan_Amount;
      
      const query = `
        UPDATE Supplier_Loan SET 
          S_RegisterID = ?, 
          Loan_Amount = ?, 
          Duration = ?, 
          PurposeOfLoan = ?, 
          Monthly_Amount = ?, 
          Due_Date = ?, 
          Status = ?
        WHERE LoanID = ?
      `;
      
      // If the due date is provided, use it; otherwise, calculate it
      let dueDate;
      if (loanData.Due_Date) {
        dueDate = loanData.Due_Date;
      } else {
        dueDate = new Date();
        dueDate.setMonth(dueDate.getMonth() + loanData.Duration);
        dueDate = dueDate.toISOString().split('T')[0]; // Format as YYYY-MM-DD
      }
      
      const [result] = await db.query(
        query,
        [
          loanData.S_RegisterID,
          loanData.Loan_Amount,
          loanData.Duration,
          loanData.PurposeOfLoan,
          monthlyAmount,
          dueDate,
          loanData.Status,
          id
        ]
      );
      return result;
    } catch (error) {
      throw error;
    }
  }

  // Delete a supplier loan by its ID
  static async delete(id) {
    try {
      const [result] = await db.query('DELETE FROM Supplier_Loan WHERE LoanID = ?', [id]);
      return result;
    } catch (error) {
      throw error;
    }
  }

  // Get loan statistics (implementation for referenced method in controller)
  static async getStatistics() {
    try {
      // Get total loans count and sum
      const [totalLoans] = await db.query(`
        SELECT COUNT(*) as count, SUM(Loan_Amount) as totalAmount 
        FROM Supplier_Loan
      `);
      
      // Get pending loans
      const [pendingLoans] = await db.query(`
        SELECT COUNT(*) as count, SUM(Loan_Amount) as totalAmount 
        FROM Supplier_Loan 
        WHERE Status = 'Pending'
      `);
      
      // Get paid loans
      const [paidLoans] = await db.query(`
        SELECT COUNT(*) as count, SUM(Loan_Amount) as totalAmount 
        FROM Supplier_Loan 
        WHERE Status = 'Paid'
      `);
      
      // Get overdue loans (due date passed and status not paid)
      const [overdueLoans] = await db.query(`
        SELECT COUNT(*) as count, SUM(Loan_Amount) as totalAmount 
        FROM Supplier_Loan 
        WHERE Due_Date < CURDATE() AND Status != 'Paid'
      `);
      
      return {
        total: totalLoans[0],
        pending: pendingLoans[0],
        paid: paidLoans[0],
        overdue: overdueLoans[0]
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