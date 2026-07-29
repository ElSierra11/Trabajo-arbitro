import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
  const { login, register, authError } = useAuth();
  const [tab, setTab] = useState('login'); // 'login' | 'register'
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [refNumber, setRefNumber] = useState('');

  const validate = () => {
    const errors = {};
    if (tab === 'register' && !name.trim()) errors.name = 'El nombre completo es requerido.';
    if (!email.trim()) errors.email = 'El correo electrónico es requerido.';
    else if (!/\S+@\S+\.\S+/.test(email)) errors.email = 'Formato de correo inválido.';
    if (!password) errors.password = 'La contraseña es requerida.';
    else if (password.length < 6) errors.password = 'Mínimo 6 caracteres.';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    if (tab === 'login') {
      await login(email, password);
    } else {
      await register(name, email, password, refNumber);
    }
    setLoading(false);
  };

  const tabButtonStyle = (active) => ({
    flex: 1,
    padding: '0.75rem',
    background: active ? 'var(--color-primary)' : 'transparent',
    color: active ? '#000' : 'var(--color-text-muted)',
    border: 'none',
    borderRadius: 'var(--radius-sm)',
    fontWeight: '700',
    fontSize: '0.85rem',
    cursor: 'pointer',
    transition: 'all 0.2s',
  });

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--color-bg)',
      padding: '1.5rem',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background glow */}
      <div style={{ position: 'absolute', top: '-20%', left: '-10%', width: '600px', height: '600px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,200,100,0.05) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-20%', right: '-10%', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(30,60,180,0.05) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div style={{ width: '100%', maxWidth: '420px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* Logo + Brand */}
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
          <img
            src="/coarc-logo.png"
            alt="COARC Logo"
            style={{ width: '90px', height: '90px', objectFit: 'contain', filter: 'drop-shadow(0 4px 20px rgba(0,200,100,0.2))' }}
          />
          <div>
            <div style={{ fontSize: '1.6rem', fontWeight: '800', letterSpacing: '-0.5px', lineHeight: 1.1 }}>
              COARC<span style={{ color: 'var(--color-primary)' }}>.</span>
            </div>
            <div style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', marginTop: '0.2rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Corporación Arbitral de Córdoba
            </div>
          </div>
        </div>

        {/* Card with Login & Register Tabs */}
        <div className="card" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Tabs Selector */}
          <div style={{ display: 'flex', background: 'var(--color-surface-hover)', padding: '4px', borderRadius: 'var(--radius-sm)', gap: '4px' }}>
            <button style={tabButtonStyle(tab === 'login')} onClick={() => { setTab('login'); setFieldErrors({}); }}>
              Iniciar Sesión
            </button>
            <button style={tabButtonStyle(tab === 'register')} onClick={() => { setTab('register'); setFieldErrors({}); }}>
              Registrarse
            </button>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {tab === 'register' && (
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.4rem' }}>
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Ej. Alejandro Sierra"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  style={{ borderColor: fieldErrors.name ? 'var(--color-red-card)' : '' }}
                />
                {fieldErrors.name && <span style={{ fontSize: '0.75rem', color: 'var(--color-red-card)', marginTop: '0.25rem', display: 'block' }}>{fieldErrors.name}</span>}
              </div>
            )}

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.4rem' }}>
                Correo Electrónico *
              </label>
              <input
                type="email"
                className="form-control"
                placeholder="tu@correo.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email"
                style={{ borderColor: fieldErrors.email ? 'var(--color-red-card)' : '' }}
              />
              {fieldErrors.email && <span style={{ fontSize: '0.75rem', color: 'var(--color-red-card)', marginTop: '0.25rem', display: 'block' }}>{fieldErrors.email}</span>}
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.4rem' }}>
                Contraseña *
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-control"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
                  style={{ paddingRight: '3.5rem', borderColor: fieldErrors.password ? 'var(--color-red-card)' : '' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', fontSize: '0.7rem', fontWeight: '700', letterSpacing: '0.05em' }}
                >
                  {showPassword ? 'OCULTAR' : 'VER'}
                </button>
              </div>
              {fieldErrors.password && <span style={{ fontSize: '0.75rem', color: 'var(--color-red-card)', marginTop: '0.25rem', display: 'block' }}>{fieldErrors.password}</span>}
            </div>

            {tab === 'register' && (
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.4rem' }}>
                  Número de Árbitro (opcional)
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Ej. COARC-042"
                  value={refNumber}
                  onChange={e => setRefNumber(e.target.value)}
                />
              </div>
            )}

            {authError && (
              <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 'var(--radius-sm)', padding: '0.75rem 1rem', fontSize: '0.825rem', color: 'var(--color-red-card)', lineHeight: 1.4 }}>
                {authError}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ marginTop: '0.25rem', padding: '0.85rem', fontSize: '0.9rem', fontWeight: '700' }}
            >
              {loading ? 'Procesando...' : (tab === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta')}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', fontSize: '0.72rem', color: 'var(--color-text-muted)', opacity: 0.5 }}>
          COARC v2.0 · Corporación Arbitral de Córdoba
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
