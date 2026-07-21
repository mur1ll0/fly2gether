import mongoose from 'mongoose';
import dns from 'node:dns';

let isConnected = false;

function isSrvDnsRefused(error) {
  return (
    error &&
    (
      error.code === 'ECONNREFUSED' ||
      error.code === 'ENOTFOUND' ||
      error.code === 'EREFUSED'
    ) &&
    error.syscall === 'querySrv'
  );
}

export async function connectDB() {
  if (isConnected) {
    return mongoose.connection;
  }

  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;

  if (!mongoUri) {
    console.warn('⚠️ MONGODB_URI não configurado no .env. Rodando com armazenamento local/memória.');
    return null;
  }

  try {
    const db = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });
    isConnected = db.connections[0].readyState === 1;
    console.log('✅ MongoDB Conectado com Sucesso!');
    return mongoose.connection;
  } catch (error) {
    if (isSrvDnsRefused(error) || error.message.includes('querySrv')) {
      console.warn('⚠️ Falha de consulta SRV pelo DNS do sistema operacional. Tentando novamente via Google DNS (8.8.8.8 / 8.8.4.4)...');
      try {
        dns.setServers(['8.8.8.8', '8.8.4.4']);
        const db = await mongoose.connect(mongoUri, {
          serverSelectionTimeoutMS: 5000,
        });
        isConnected = db.connections[0].readyState === 1;
        console.log('✅ MongoDB Conectado com Sucesso via Google DNS!');
        return mongoose.connection;
      } catch (dnsError) {
        console.error('❌ Erro de conexão com MongoDB mesmo via Google DNS:', dnsError.message);
        console.warn('⚠️ O servidor continuará rodando com o sistema resiliente de armazenamento local.');
      }
    } else {
      console.error('❌ Erro de conexão com MongoDB:', error.message);
      console.warn('⚠️ O servidor continuará rodando com o sistema resiliente de armazenamento local.');
    }
  }
}
