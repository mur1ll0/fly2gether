import mongoose from 'mongoose';

let isConnected = false;

export async function connectDB() {
  if (isConnected) {
    return;
  }

  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    console.warn('⚠️ MONGODB_URI não configurado no .env. Rodando em modo em memória/fallback local.');
    return;
  }

  try {
    const db = await mongoose.connect(mongoUri, {
      bufferCommands: false,
    });
    isConnected = db.connections[0].readyState === 1;
    console.log('✅ MongoDB Conectado com Sucesso!');
  } catch (error) {
    console.error('❌ Erro de conexão com MongoDB:', error.message);
  }
}
