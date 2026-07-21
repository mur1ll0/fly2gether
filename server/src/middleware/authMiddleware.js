import jwt from 'jsonwebtoken';

export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token de autenticação ausente. Por favor, faça login.' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'fly2gether-fallback-jwt-secret', (err, decodedUser) => {
    if (err) {
      return res.status(403).json({ error: 'Sessão expirada ou inválida. Por favor, refaça o login.' });
    }
    req.user = decodedUser;
    next();
  });
}
