import React, { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext();

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('coarc_token'));
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Verify token on mount
  useEffect(() => {
    const verify = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`${API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const userData = await res.json();
          setUser(userData);
        } else {
          // Token expired or invalid — clear it
          localStorage.removeItem('coarc_token');
          setToken(null);
          setUser(null);
        }
      } catch {
        // API not reachable — keep token, show cached user if possible
        const cached = localStorage.getItem('coarc_user');
        if (cached) setUser(JSON.parse(cached));
      } finally {
        setLoading(false);
      }
    };
    verify();
  }, [token]);

  const login = async (email, password) => {
    setAuthError(null);
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) {
        setAuthError(data.error || 'Error al iniciar sesión.');
        return false;
      }
      localStorage.setItem('coarc_token', data.token);
      localStorage.setItem('coarc_user', JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
      return true;
    } catch {
      setAuthError('No se pudo conectar al servidor. Verifica tu conexión.');
      return false;
    }
  };

  const register = async (nameOrObj, email, password, refNumber) => {
    setAuthError(null);
    let namePayload = nameOrObj;
    let emailPayload = email;
    let passPayload = password;
    let refPayload = refNumber;
    if (typeof nameOrObj === 'object' && nameOrObj !== null) {
      namePayload = nameOrObj.name;
      emailPayload = nameOrObj.email;
      passPayload = nameOrObj.password;
      refPayload = nameOrObj.refNumber;
    }
    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: namePayload, email: emailPayload, password: passPayload, refNumber: refPayload })
      });
      const data = await res.json();
      if (!res.ok) {
        setAuthError(data.error || 'Error al registrarse.');
        return false;
      }
      localStorage.setItem('coarc_token', data.token);
      localStorage.setItem('coarc_user', JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
      return true;
    } catch {
      setAuthError('No se pudo conectar al servidor. Verifica tu conexión.');
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('coarc_token');
    localStorage.removeItem('coarc_user');
    localStorage.removeItem('coarc_active_profile_id');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, authError, login, register, logout, isAdmin: user?.role === 'admin' }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
};
