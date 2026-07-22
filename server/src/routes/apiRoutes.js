import { Router } from 'express';
import { searchAirports } from '../controllers/airportController.js';
import { googleLogin, getCurrentUser } from '../controllers/authController.js';
import { handleSearchFlights, handleSerpApiUsage, handleGetReturnFlights, handleGetBookingUrl } from '../controllers/flightController.js';
import { createAlert, getUserAlerts, deleteAlert, checkAlertsNow } from '../controllers/alertController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();

// Config pública do frontend (ex: Google Client ID)
router.get('/config', (req, res) => {
  res.json({
    googleClientId: process.env.GOOGLE_CLIENT_ID || ''
  });
});

// Autocomplete de Aeroportos
router.get('/airports', searchAirports);

// Autenticação Google
router.post('/auth/google', googleLogin);
router.get('/auth/me', authenticateToken, getCurrentUser);

// Busca de Voos Normais e Voos Combinados (Fly Together)
router.get('/flights/search', handleSearchFlights);
router.get('/flights/return-options', handleGetReturnFlights);
router.get('/flights/booking-url', handleGetBookingUrl);
router.get('/serpapi-usage', handleSerpApiUsage);

// Alertas de Preço por E-mail (Exigem autenticação do usuário Google)
router.post('/alerts', authenticateToken, createAlert);
router.get('/alerts', authenticateToken, getUserAlerts);
router.delete('/alerts/:id', authenticateToken, deleteAlert);
router.post('/alerts/check-now', authenticateToken, async (req, res) => {
  await checkAlertsNow();
  res.json({ message: 'Varredura manual de alertas disparada!' });
});

export default router;
