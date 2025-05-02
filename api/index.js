// api/index.js
import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import pool from '../config/db.js';

import SupplierRoute from '../routes/SupplierRoute.js';
import ProductRoute from '../routes/ProductRoute.js';
import DriverRoute from '../routes/DriverRoute.js';
import SupplierLoanRoute from '../routes/SupplierLoanRoute.js';
import SupplierAdvanceRoute from '../routes/SupplierLoanRoute.js'; // Be careful here – might be a copy/paste issue
import SupplierCollectionRoute from '../routes/SupplierAdvanceRoute.js';
import SupplierPaymentRoute from '../routes/SupplierAdvanceRoute.js';
import TeaPacketFertilizerRoute from '../routes/TeaPacketFertilizerRoute.js';

import serverless from 'serverless-http';

const app = express();

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

// test db connection
app.get('/api/test-db', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT 1 + 1 AS solution');
    res.json({ success: true, message: 'Database connected!', result: rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error connecting to the database', error });
  }
});

// root route
app.get('/api', (req, res) => {
  res.send('API WORKING');
});

export const handler = serverless(app);
