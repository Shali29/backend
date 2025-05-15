import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import Pusher from 'pusher';
import pool from './config/db.js';  // your database pool

// Import your routes (adjust paths as needed)
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

// Middleware
app.use(cors());
app.use(express.json());  // Important to parse JSON bodies

// Pusher authentication endpoint
app.post('/pusher/auth', (req, res) => {
  const { socket_id, channel_name } = req.body;

  if (!socket_id || !channel_name) {
    return res.status(400).json({ error: 'Missing socket_id or channel_name' });
  }

  // OPTIONAL Authentication Logic:
  // Example: Validate a bearer token from request headers
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];
  if (!authHeader) {
    return res.status(401).json({ error: 'Unauthorized: No Authorization header' });
  }

  const token = authHeader.split(' ')[1]; // Assuming "Bearer <token>"

  // Simple token check - replace with real verification logic
  if (!token || token !== process.env.API_AUTH_TOKEN) {
    return res.status(403).json({ error: 'Forbidden: Invalid token' });
  }

  // If authentication passed, generate auth response
  try {
    const auth = pusher.authenticate(socket_id, channel_name);
    return res.json(auth);
  } catch (error) {
    console.error('Pusher auth error:', error);
    return res.status(500).json({ error: 'Authentication failed' });
  }
});

// Your other API endpoints
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

// Test DB connection endpoint
app.get('/test-db', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT 1 + 1 AS solution');
    res.json({ success: true, message: 'Database connected!', result: rows[0] });
  } catch (error) {
    console.error('Error connecting to the database:', error);
    res.status(500).json({ success: false, message: 'Error connecting to the database', error });
  }
});

// Basic root endpoint
app.get('/', (req, res) => {
  res.send('API WORKING');
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
