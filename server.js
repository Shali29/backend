import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import pool from './config/db.js';

import SupplierRoute from './routes/SupplierRoute.js';
import ProductRoute from './routes/ProductRoute.js';
import DriverRoute from './routes/DriverRoute.js';
import SupplierLoanRoute from './routes/SupplierLoanRoute.js';  
import SupplierAdvanceRoute from './routes/SupplierLoanRoute.js';
import SupplierCollectionRoute from './routes/SupplierAdvanceRoute.js';
import SupplierPaymentRoute from './routes/SupplierAdvanceRoute.js';
import TeaPacketFertilizerRoute from './routes/TeaPacketFertilizerRoute.js';


const app = express();
const port = process.env.PORT || 4000;

// middleware
app.use(express.json());
app.use(cors());

// api endpoints
app.use('/api/supplier', SupplierRoute);
app.use('/api/product', ProductRoute);
app.use('/api/driver', DriverRoute);
app.use('/api/supplierLoan', SupplierLoanRoute);
app.use('/api/supplierAdvance', SupplierAdvanceRoute);
app.use('/api/supplierCollection', SupplierCollectionRoute);
app.use('/api/supplierPayment', SupplierPaymentRoute);
app.use('/api/teaPacketFertilizer', TeaPacketFertilizerRoute);
 

app.get('/test-db', async (req, res) => {
  console.log('Test DB endpoint hit');
  try {
      const [rows] = await pool.query('SELECT 1 + 1 AS solution');
      console.log('Database query result:', rows);
      res.json({ success: true, message: 'Database connected!', result: rows[0] });
  } catch (error) {
      console.error('Error connecting to the database:', error);
      res.status(500).json({ success: false, message: 'Error connecting to the database', error });
  }
});


app.get('/', (req, res) => {
    res.send('API WORKING');
});

app.listen(port, () => {
    console.log(`Server starting on http://localhost:${port}`);
}); 