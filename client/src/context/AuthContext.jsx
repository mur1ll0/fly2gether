import React, { createContext, useContext, useState, useEffect } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import API from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('fly2gether_token') || '');
  const [googleClientId, setGoogleClientId] = useState(import.meta.env.VITE_GOOGLE_CLIENT_ID || '');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch Google Client ID configuration
    API.get('/config')
      .then(res => {
        if (res.data.googleClientId) {
          setGoogleClientId(res.data.googleClientId);
        }
      })
      .catch(() => {});

    // Check existing token session
    if (token) {
      API.get('/auth/me')
        .then(res => {
          setUser(res.data.user);
        })
        .catch(() => {
          logout();
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  const loginWithGoogle = async (credentialResponse) => {
    try {
      const { credential } = credentialResponse;
      const res = await API.post('/auth/google', { idToken: credential });
      const { token: newToken, user: userData } = res.data;

      localStorage.setItem('fly2gether_token', newToken);
      setToken(newToken);
      setUser(userData);
      return userData;
    } catch (err) {
      console.error('Erro no login Google:', err);
      throw err;
    }
  };

  const loginDemo = () => {
    const demoUser = {
      id: 'demo-user-123',
      name: 'Murillo (Demonstração)',
      email: 'murillo@fly2gether.com',
      picture: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'
    };
    const mockToken = 'mock-demo-jwt-token';
    localStorage.setItem('fly2gether_token', mockToken);
    setToken(mockToken);
    setUser(demoUser);
  };

  const logout = () => {
    localStorage.removeItem('fly2gether_token');
    setToken('');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, googleClientId, loading, loginWithGoogle, loginDemo, logout }}>
      {googleClientId ? (
        <GoogleOAuthProvider clientId={googleClientId}>
          {children}
        </GoogleOAuthProvider>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
