import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

// Carregar variáveis do .env da raiz e da pasta server
dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), 'server/.env') });

import { connectDB } from './config/db.js';
import apiRoutes from './routes/apiRoutes.js';
import { initCronJobs } from './services/cronService.js';

const app = express();

app.use(cors());
app.use(express.json());

// Middleware para garantir que o banco está conectado antes de processar qualquer requisição
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('❌ Falha de conexão com banco de dados:', err.message);
    res.status(500).json({ error: 'Erro ao conectar ao banco de dados.' });
  }
});

// Rotas da API
app.use('/api', apiRoutes);

// Servir arquivos estáticos do frontend em produção se compilados no servidor
const clientDist = path.join(process.cwd(), 'client', 'dist');
app.use(express.static(clientDist));

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(clientDist, 'index.html'), (err) => {
    if (err) next();
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Servidor Fly2Gether rodando na porta ${PORT}`);
  initCronJobs();
});

export default app;
