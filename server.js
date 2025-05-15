import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import pool from './config/db.js';
import Pusher from 'pusher';  // Import Pusher here

import SupplierRoute from './routes/SupplierRoute.js';
import ProductRoute from './routes/ProductRoute.js';
import DriverRoute from './routes/DriverRoute.js';
import SupplierLoanRoute from './routes/SupplierLoanRoute.js';
import SupplierAdvanceRoute from './routes/SupplierLoanRoute.js';
import SupplierCollectionRoute from './routes/SupplierCollectionRoute.js';
import SupplierPaymentRoute from './routes/SupplierPaymentRoute.js';
import TeaPacketFertilizerRoute from './routes/TeaPacketFertilizerRoute.js';
import rateRoutes from './routes/RateRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';

const app = express();
const port = process.env.PORT || 4000;

// Pusher setup
const pusher = new Pusher({
  appId: "1993072",
  key: "04b459376799d9c622c3",
  secret: "d3776dd2a46a32da59d4",
  cluster: "ap2",
  useTLS: true,
});

// middleware
app.use(express.json());
app.use(cors());

// Pusher authentication endpoint
app.post('/pusher/auth', (req, res) => {
  const socketId = req.body.socket_id;
  const channel = req.body.channel_name;

  // TODO: Add your auth validation logic here (e.g. verify user/session/token)

  const auth = pusher.authenticate(socketId, channel);
  res.send(auth);
});

// api endpoints
app.use('/api/supplier', SupplierRoute);
app.use('/api/product', ProductRoute);
app.use('/api/driver', DriverRoute);
app.use('/api/supplierLoan', SupplierLoanRoute);
app.use('/api/supplierAdvance', SupplierAdvanceRoute);
app.use('/api/supplierCollection', SupplierCollectionRoute);
app.use('/api/supplierPayment', SupplierPaymentRoute);
app.use('/api/teaPacketFertilizer', TeaPacketFertilizerRoute);
app.use('/api/rate', rateRoutes);
app.use('/api/notifications', notificationRoutes);

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
  console.log(`Server starting on port ${port}`);
});
