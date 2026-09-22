import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRefContext } from '../context/RefContext';
import { CloseIcon, CheckCircle2, AlertCircle, KeyIcon, UserIcon, ReceiptText } from './Icons';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const UserProfileModal = ({ isOpen, onClose }) => {
  const { user, token, updateUserData } = useAuth();
  const { activeProfile, updateProfile } = useRefContext();

  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'banking' | 'security'
  
  // Profile state
  const [name, setName] = useState('');
  const [refNumber, setRefNumber] = useState('');
  const [defaultFee, setDefaultFee] = useState(50000);

  // Banking state (for PDF invoices)
  const [bank, setBank] = useState('Bancolombia');
  const [accountType, setAccountType] = useState('Ahorros');
  const [accountNumber, setAccountNumber] = useState('');

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // UI state
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    if (!isOpen || !user) return;
    setName(user.name || activeProfile?.name || '');
    setRefNumber(user.refNumber || activeProfile?.refNumber || '');
    setDefaultFee(activeProfile?.defaultFee || 50000);

    // Load saved banking info from localStorage
    try {
      const savedBankInfo = localStorage.getItem(`coarc_bank_info_${user.id}`);
      if (savedBankInfo) {
        const parsed = JSON.parse(savedBankInfo);
        setBank(parsed.bank || 'Bancolombia');
        setAccountType(parsed.accountType || 'Ahorros');
        setAccountNumber(parsed.accountNumber || '');
      }
    } catch (_) {}

    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setError(null);
    setSuccess(null);
  }, [isOpen, user, activeProfile]);

  if (!isOpen || !user) return null;

  const handleSaveProfileAndBank = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      // 1. Update user info in backend (User table + Profile records)
      const res = await fetch(`${API_URL}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          refNumber: refNumber.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al actualizar datos personales.');
      }

      const updatedUser = await res.json();
      updateUserData(updatedUser);

      // 2. Update defaultFee in active Profile if available
      if (activeProfile?.id) {
        await updateProfile(activeProfile.id, {
          name: name.trim(),
          refNumber: refNumber.trim(),
          defaultFee: Number(defaultFee) || 0,
        });
      }

      // 3. Save bank info to localStorage for invoice generation
      localStorage.setItem(
        `coarc_bank_info_${user.id}`,
        JSON.stringify({
          bank: bank.trim(),
          accountType,
          accountNumber: accountNumber.trim(),
        })
      );

      setSuccess('Tus datos y tarifas se guardaron correctamente.');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message || 'Error al guardar los cambios.');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      setError('Por favor completa todos los campos de contraseña.');
      return;
    }
    if (newPassword.length < 6) {
      setError('La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Las nuevas contraseñas no coinciden.');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`${API_URL}/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al cambiar la contraseña.');
      }

      setSuccess('Contraseña cambiada exitosamente.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message || 'Error al cambiar contraseña.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '560px' }}
      >
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-text-dark)',
                fontWeight: '800',
                fontFamily: 'var(--font-display)',
                fontSize: '1rem',
              }}
            >
              {(user.name || 'A').charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 style={{ fontSize: '1.15rem', margin: 0 }}>Mi Perfil de Árbitro</h2>
              <span className="text-muted" style={{ fontSize: '0.75rem' }}>
                {user.email}
              </span>
            </div>
          </div>
          <button
            type="button"
            className="btn-icon-only"
            onClick={onClose}
            aria-label="Cerrar modal"
          >
            <CloseIcon size={18} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid var(--color-border)',
            padding: '0 1.25rem',
            gap: '1rem',
            background: 'var(--color-bg)',
          }}
        >
          <button
            type="button"
            onClick={() => { setActiveTab('profile'); setError(null); setSuccess(null); }}
            style={{
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'profile' ? '2px solid var(--color-primary)' : '2px solid transparent',
              color: activeTab === 'profile' ? 'var(--color-text)' : 'var(--color-text-muted)',
              padding: '0.75rem 0.25rem',
              fontSize: '0.85rem',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <UserIcon size={16} />
            <span>Datos y Tarifas</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('banking'); setError(null); setSuccess(null); }}
            style={{
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'banking' ? '2px solid var(--color-primary)' : '2px solid transparent',
              color: activeTab === 'banking' ? 'var(--color-text)' : 'var(--color-text-muted)',
              padding: '0.75rem 0.25rem',
              fontSize: '0.85rem',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <ReceiptText size={16} />
            <span>Datos de Cobro</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('security'); setError(null); setSuccess(null); }}
            style={{
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'security' ? '2px solid var(--color-primary)' : '2px solid transparent',
              color: activeTab === 'security' ? 'var(--color-text)' : 'var(--color-text-muted)',
              padding: '0.75rem 0.25rem',
              fontSize: '0.85rem',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <KeyIcon size={16} />
            <span>Seguridad</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {error && (
            <div
              style={{
                background: 'rgba(255, 42, 95, 0.1)',
                border: '1px solid rgba(255, 42, 95, 0.3)',
                color: 'var(--color-red-card)',
                padding: '0.65rem 0.85rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.82rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div
              style={{
                background: 'rgba(0, 200, 100, 0.1)',
                border: '1px solid rgba(0, 200, 100, 0.3)',
                color: 'var(--color-success)',
                padding: '0.65rem 0.85rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.82rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <CheckCircle2 size={16} />
              <span>{success}</span>
            </div>
          )}

          {/* TAB 1: Profile & Referee Rates */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfileAndBank} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Nombre Completo *</label>
                <input
                  type="text"
                  className="form-control"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Yelena Breidy"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">N° Colegiado / Carnet / Cédula</label>
                  <input
                    type="text"
                    className="form-control"
                    value={refNumber}
                    onChange={(e) => setRefNumber(e.target.value)}
                    placeholder="Ej: COARC-12 o CC 1067..."
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Tarifa por Partido ($ COP)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={defaultFee}
                    onChange={(e) => setDefaultFee(Math.max(0, parseInt(e.target.value, 10) || 0))}
                    placeholder="50000"
                  />
                  <span className="text-muted" style={{ fontSize: '0.72rem', marginTop: '0.2rem', display: 'block' }}>
                    Valor sugerido al registrar nuevos partidos.
                  </span>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Correo Electrónico (Identificador)</label>
                <input
                  type="email"
                  className="form-control"
                  value={user.email}
                  disabled
                  style={{ opacity: 0.7, cursor: 'not-allowed', backgroundColor: 'var(--color-bg)' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={onClose}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Guardando...' : 'Guardar Datos'}
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: Banking Details */}
          {activeTab === 'banking' && (
            <form onSubmit={handleSaveProfileAndBank} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '0.75rem 1rem' }}>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                  💡 <strong>Nota:</strong> Estos datos bancarios se usarán automáticamente para completar tu <strong>Cuenta de Cobro en PDF</strong> cada vez que vayas a cobrar tus partidos.
                </p>
              </div>

              <div className="form-group">
                <label className="form-label">Entidad Bancaria / Billetera Digital</label>
                <input
                  type="text"
                  className="form-control"
                  value={bank}
                  onChange={(e) => setBank(e.target.value)}
                  placeholder="Ej: Bancolombia, Nequi, Daviplata, BBVA..."
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Tipo de Cuenta</label>
                  <select
                    className="form-control"
                    value={accountType}
                    onChange={(e) => setAccountType(e.target.value)}
                  >
                    <option value="Ahorros">Cuenta de Ahorros</option>
                    <option value="Corriente">Cuenta Corriente</option>
                    <option value="Billetera Digital">Billetera Digital (Nequi/Daviplata)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Número de Cuenta o Celular</label>
                  <input
                    type="text"
                    className="form-control"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder="Ej: 300 123 4567 o 123456789"
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={onClose}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Guardando...' : 'Guardar Datos Bancarios'}
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: Change Password */}
          {activeTab === 'security' && (
            <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Contraseña Actual *</label>
                <input
                  type="password"
                  className="form-control"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Ingresa tu contraseña actual"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Nueva Contraseña *</label>
                  <input
                    type="password"
                    className="form-control"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    minLength={6}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Confirmar Nueva Contraseña *</label>
                  <input
                    type="password"
                    className="form-control"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repite la nueva contraseña"
                    minLength={6}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={onClose}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Actualizando...' : 'Cambiar Contraseña'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfileModal;
