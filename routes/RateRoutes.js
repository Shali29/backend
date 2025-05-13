import express from 'express';
import { getRateById, updateRateById } from '../controllers/RateController.js';

const router = express.Router();

router.get('/:id', getRateById);
router.put('/update/:id', updateRateById);

export default router;
