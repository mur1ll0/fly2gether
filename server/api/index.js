import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from '../src/config/db.js';
import apiRoutes from '../src/routes/apiRoutes.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Conectar ao MongoDB
connectDB();

app.use('/api', apiRoutes);

export default app;
