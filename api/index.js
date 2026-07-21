import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

// Carregar .env
dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), 'server/.env') });

import { connectDB } from '../server/src/config/db.js';
import apiRoutes from '../server/src/routes/apiRoutes.js';

const app = express();

app.use(cors());
app.use(express.json());

// Conectar ao MongoDB
connectDB();

app.use('/api', apiRoutes);

export default app;
