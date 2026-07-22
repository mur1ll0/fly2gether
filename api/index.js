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

// Middleware para garantir que o banco está conectado em ambiente serverless
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('❌ Falha crítica de conexão com banco de dados:', err.message);
    res.status(500).json({ error: 'Erro ao conectar ao banco de dados.' });
  }
});

app.use('/api', apiRoutes);

export default app;
