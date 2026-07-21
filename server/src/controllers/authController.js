import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export async function googleLogin(req, res) {
  const { idToken } = req.body;
  if (!idToken) {
    return res.status(400).json({ error: 'idToken é obrigatório.' });
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;

  try {
    let email, googleId, name, picture;

    if (clientId) {
      const client = new OAuth2Client(clientId);
      const ticket = await client.verifyIdToken({
        idToken,
        audience: clientId,
      });
      const payload = ticket.getPayload();
      googleId = payload.sub;
      email = payload.email;
      name = payload.name;
      picture = payload.picture;
    } else {
      // Fallback for development without configured GOOGLE_CLIENT_ID
      const decoded = jwt.decode(idToken) || {};
      googleId = decoded.sub || 'demo-google-id-' + Date.now();
      email = decoded.email || 'usuario.demo@fly2gether.com';
      name = decoded.name || 'Usuário Fly2Gether';
      picture = decoded.picture || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80';
    }

    let user = null;
    try {
      user = await User.findOne({ googleId });
      if (!user) {
        user = new User({ googleId, email, name, picture });
        await user.save();
      } else {
        user.name = name;
        user.picture = picture;
        user.email = email;
        await user.save();
      }
    } catch (dbErr) {
      console.warn('⚠️ Mongoose indisponível, usando objeto temporário de usuário:', dbErr.message);
      user = { _id: 'demo-user-id', googleId, email, name, picture };
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, name: user.name, picture: user.picture },
      process.env.JWT_SECRET || 'fly2gether-fallback-jwt-secret',
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        picture: user.picture
      }
    });
  } catch (error) {
    console.error('Erro na autenticação Google:', error.message);
    res.status(401).json({ error: 'Falha na validação das credenciais do Google.' });
  }
}

export async function getCurrentUser(req, res) {
  res.json({ user: req.user });
}
