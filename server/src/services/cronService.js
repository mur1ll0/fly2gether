import cron from 'node-cron';
import { checkAlertsNow } from '../controllers/alertController.js';

export function initCronJobs() {
  console.log('⏰ Inicializando Cron Runner de Alertas de Preço...');
  
  // Rodar a cada 6 horas no ambiente real (para fins de dev, roda no start e a cada hora)
  cron.schedule('0 * * * *', async () => {
    console.log('⏰ Executando tarefa agendada: Varredura de Preços e Promoções...');
    await checkAlertsNow();
  });
}
