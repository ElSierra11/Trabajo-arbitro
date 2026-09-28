import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const formatCurrency = (val) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(val || 0);

import { UserIcon, ShieldIcon, PlusCircle, CloseIcon, CheckCircle2, FileSpreadsheet, KeyIcon, TrashIcon, ClipboardList } from './Icons';

const AdminPanel = () => {
  const { token, user: currentUser } = useAuth();
  const [tab, setTab] = useState('users'); // 'users' | 'create'
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Deletion modal state
  const [userToDelete, setUserToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Inspector modal state (view matches of a specific referee)
  const [viewingUser, setViewingUser] = useState(null);
  const [refereeMatches, setRefereeMatches] = useState([]);
  const [loadingMatches, setLoadingMatches] = useState(false);

  // Create user form
  const [form, setForm] = useState({ name: '', email: '', password: '', refNumber: '', role: 'user' });
  const [creating, setCreating] = useState(false);

  const headers = useMemo(() => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  }), [token]);

  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/admin/users`, { headers });
      if (!res.ok) throw new Error('Error al cargar árbitros');
      const data = await res.json();
      setUsers(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadUsers();
  }, []);

  const handleResetPassword = async (userId, userName) => {
    const newPassword = window.prompt(`Ingresa la nueva contraseña para ${userName}:`);
    if (!newPassword) return;
    if (newPassword.length < 6) {
      alert('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`${API_URL}/users/${userId}/reset-password`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al restablecer contraseña');
      setSuccess(data.message || 'Contraseña restablecida correctamente');
    } catch (e) {
      setError(e.message);
    }
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    if (userToDelete.id === currentUser?.id) {
      setError('No puedes eliminar tu propia cuenta de administrador.');
      setUserToDelete(null);
      return;
    }

    setDeleting(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`${API_URL}/admin/users/${userToDelete.id}`, {
        method: 'DELETE',
        headers,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al eliminar árbitro');
      setSuccess(data.message || `La cuenta de "${userToDelete.name}" fue eliminada correctamente.`);
      setUserToDelete(null);
      loadUsers();
    } catch (e) {
      setError(e.message);
    } finally {
      setDeleting(false);
    }
  };

  const handleInspectMatches = async (targetUser) => {
    setViewingUser(targetUser);
    setLoadingMatches(true);
    setRefereeMatches([]);
    try {
      const res = await fetch(`${API_URL}/admin/matches?userId=${targetUser.id}`, { headers });
      if (!res.ok) throw new Error('Error al consultar los partidos de este árbitro');
      const data = await res.json();
      setRefereeMatches(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoadingMatches(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) {
      setError('Nombre, correo y contraseña son requeridos.');
      return;
    }
    setCreating(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`${API_URL}/admin/users`, {
        method: 'POST',
        headers,
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al crear árbitro');
      setSuccess(`Árbitro "${form.name}" creado correctamente.`);
      setForm({ name: '', email: '', password: '', refNumber: '', role: 'user' });
      setTab('users');
      loadUsers();
    } catch (e) {
      setError(e.message);
    } finally {
      setCreating(false);
    }
  };

  const totalPartidos = useMemo(() => users.reduce((s, u) => s + (u.matchCount || 0), 0), [users]);
  const totalIngresos = useMemo(() => users.reduce((s, u) => s + (u.totalEarnings || 0), 0), [users]);

  const tabStyle = (active) => ({
    padding: '0.6rem 1.2rem',
    borderRadius: 'var(--radius-sm)',
    border: 'none',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '0.85rem',
    transition: 'all 0.2s',
    background: active ? 'var(--color-surface-hover)' : 'transparent',
    color: active ? 'var(--color-text)' : 'var(--color-text-muted)',
    boxShadow: active ? '0 1px 4px rgba(0,0,0,0.3)' : 'none',
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Summary Cards */}
      <div className="grid-cols-4">
        <div className="card metric-card">
          <div className="card-header-accent" style={{ background: 'var(--color-primary)' }} />
          <span className="metric-title">Árbitros Registrados</span>
          <span className="metric-value">{users.length}</span>
          <div className="metric-trend text-muted">En la corporación</div>
          <UserIcon size={40} />
        </div>
        <div className="card metric-card">
          <div className="card-header-accent" style={{ background: 'var(--color-accent)' }} />
          <span className="metric-title">Partidos Totales</span>
          <span className="metric-value">{totalPartidos}</span>
          <div className="metric-trend text-muted">De toda la corporación</div>
        </div>
        <div className="card metric-card">
          <div className="card-header-accent" style={{ background: '#8b5cf6' }} />
          <span className="metric-title">Ingresos Corporación</span>
          <span className="metric-value" style={{ fontSize: users.length > 0 ? '1.1rem' : '1.5rem' }}>{formatCurrency(totalIngresos)}</span>
          <div className="metric-trend text-muted">Total facturado</div>
        </div>
        <div className="card metric-card" style={{ cursor: 'pointer', borderColor: 'rgba(0,200,100,0.3)' }} onClick={() => setTab('create')}>
          <div className="card-header-accent" style={{ background: 'var(--color-success)' }} />
          <span className="metric-title">Crear Nuevo Árbitro</span>
          <div style={{ marginTop: '0.5rem' }}>
            <PlusCircle size={36} />
          </div>
          <div className="metric-trend" style={{ color: 'var(--color-primary)' }}>Haz clic para crear</div>
        </div>
      </div>

      {/* Tabs & Actions Bar */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--color-surface)', borderRadius: 'var(--radius-sm)', padding: '4px', width: 'fit-content' }}>
            <button style={tabStyle(tab === 'users')} onClick={() => { setTab('users'); setError(null); setSuccess(null); }}>
              <UserIcon size={14} /> Árbitros ({users.length})
            </button>
            <button style={tabStyle(tab === 'create')} onClick={() => { setTab('create'); setError(null); setSuccess(null); }}>
              <PlusCircle size={14} /> Crear Árbitro
            </button>
          </div>

          <button
            className="btn btn-secondary"
            style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
            onClick={() => {
              const headersList = ['Nombre', 'Correo', 'N_Arbitro', 'Rol', 'Partidos', 'Ingresos_Totales', 'Ingresos_Cobrados'];
              const rows = users.map(u => [
                `"${u.name}"`,
                `"${u.email}"`,
                `"${u.refNumber || ''}"`,
                `"${u.role}"`,
                u.matchCount || 0,
                u.totalEarnings || 0,
                u.paidEarnings || 0,
              ]);
              const csv = [headersList.join(','), ...rows.map(r => r.join(','))].join('\n');
              const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `coarc_reporte_arbitros_${new Date().toISOString().slice(0,10)}.csv`;
              a.click();
            }}
          >
            <FileSpreadsheet size={15} />
            <span>Exportar Reporte Master (CSV)</span>
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 'var(--radius-sm)', padding: '0.75rem 1rem', fontSize: '0.85rem', color: 'var(--color-red-card)', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>{error}</span>
            <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', display: 'flex' }}><CloseIcon size={16} /></button>
          </div>
        )}
        {success && (
          <div style={{ background: 'rgba(0,200,100,0.08)', border: '1px solid rgba(0,200,100,0.25)', borderRadius: 'var(--radius-sm)', padding: '0.75rem 1rem', fontSize: '0.85rem', color: 'var(--color-primary)', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <CheckCircle2 size={16} />
              <span>{success}</span>
            </div>
            <button onClick={() => setSuccess(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', display: 'flex' }}><CloseIcon size={16} /></button>
          </div>
        )}

        {/* Users Table */}
        {tab === 'users' && (
          loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>Cargando árbitros...</div>
          ) : users.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem' }}>
              <UserIcon size={48} />
              <p style={{ color: 'var(--color-text-muted)', marginTop: '1rem' }}>No hay árbitros registrados aún.</p>
              <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={() => setTab('create')}>Crear primer árbitro</button>
            </div>
          ) : (
            <div className="matches-table-container">
              <table className="matches-table">
                <thead>
                  <tr>
                    <th>Árbitro</th>
                    <th>Correo</th>
                    <th>N° Árbitro</th>
                    <th style={{ textAlign: 'center' }}>Partidos</th>
                    <th>Ingresos</th>
                    <th>Rol</th>
                    <th>Registro</th>
                    <th style={{ textAlign: 'center' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => {
                    const isSelf = u.id === currentUser?.id;
                    return (
                      <tr key={u.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{
                              width: '34px', height: '34px', borderRadius: '50%', flexShrink: 0,
                              background: 'linear-gradient(135deg, var(--color-primary), #00a855)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontWeight: '700', fontSize: '0.9rem', color: '#000'
                            }}>
                              {u.name?.charAt(0)?.toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontWeight: '600' }}>{u.name}</div>
                              {isSelf && (
                                <span style={{ fontSize: '0.7rem', color: 'var(--color-primary)', fontWeight: '700' }}>
                                  (Tu cuenta)
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>{u.email}</td>
                        <td style={{ fontSize: '0.85rem' }}>{u.refNumber || '—'}</td>
                        <td style={{ textAlign: 'center' }}>
                          <button
                            onClick={() => handleInspectMatches(u)}
                            title="Ver los partidos pitados por este árbitro"
                            style={{
                              background: 'rgba(0,200,100,0.08)',
                              color: 'var(--color-primary)',
                              border: '1px solid rgba(0,200,100,0.25)',
                              borderRadius: '4px',
                              padding: '0.15rem 0.55rem',
                              fontSize: '0.8rem',
                              fontWeight: '700',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.3rem',
                            }}
                          >
                            <ClipboardList size={12} />
                            <span>{u.matchCount || 0}</span>
                          </button>
                        </td>
                        <td style={{ fontWeight: '600', color: 'var(--color-accent)' }}>{formatCurrency(u.totalEarnings)}</td>
                        <td>
                          <span style={{
                            fontSize: '0.72rem', fontWeight: '700', letterSpacing: '0.05em',
                            padding: '0.2rem 0.5rem', borderRadius: '4px',
                            background: u.role === 'admin' ? 'rgba(0,200,100,0.1)' : 'rgba(255,255,255,0.05)',
                            color: u.role === 'admin' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                            border: u.role === 'admin' ? '1px solid rgba(0,200,100,0.2)' : '1px solid var(--color-border)',
                          }}>
                            {u.role === 'admin' ? 'ADMIN' : 'ÁRBITRO'}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                          {u.createdAt ? new Date(u.createdAt).toLocaleDateString('es-CO') : '—'}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'center' }}>
                            {/* Inspect Matches Button */}
                            <button
                              className="btn btn-secondary"
                              style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                              onClick={() => handleInspectMatches(u)}
                              title="Ver partidos de este árbitro"
                            >
                              <ClipboardList size={13} />
                              <span>Partidos</span>
                            </button>

                            {/* Reset Password Button */}
                            <button
                              className="btn btn-secondary"
                              style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                              onClick={() => handleResetPassword(u.id, u.name)}
                              title="Restablecer contraseña de esta cuenta"
                            >
                              <KeyIcon size={13} />
                              <span>Clave</span>
                            </button>

                            {/* Delete User Button */}
                            {isSelf ? (
                              <button
                                className="btn btn-secondary"
                                style={{
                                  fontSize: '0.75rem',
                                  padding: '0.25rem 0.5rem',
                                  opacity: 0.4,
                                  cursor: 'not-allowed',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.25rem'
                                }}
                                disabled
                                title="No puedes eliminar tu propia cuenta de administrador"
                              >
                                <TrashIcon size={13} />
                                <span>Eliminar</span>
                              </button>
                            ) : (
                              <button
                                className="btn btn-secondary"
                                style={{
                                  fontSize: '0.75rem',
                                  padding: '0.25rem 0.5rem',
                                  color: 'var(--color-red-card)',
                                  borderColor: 'rgba(239, 68, 68, 0.3)',
                                  background: 'rgba(239, 68, 68, 0.08)',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.25rem',
                                }}
                                onClick={() => setUserToDelete(u)}
                                title={`Eliminar cuenta de ${u.name}`}
                              >
                                <TrashIcon size={13} />
                                <span>Eliminar</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
        )}

        {/* Create User Form */}
        {tab === 'create' && (
          <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '480px' }}>
            <h4 style={{ marginBottom: '0.25rem' }}>Crear nueva cuenta de árbitro</h4>
            <p className="text-muted" style={{ fontSize: '0.82rem', marginBottom: '0.5rem' }}>
              El árbitro recibirá estas credenciales para ingresar a la plataforma.
            </p>

            {[
              { label: 'Nombre Completo *', key: 'name', type: 'text', placeholder: 'Ej. Carlos Rodríguez' },
              { label: 'Correo Electrónico *', key: 'email', type: 'email', placeholder: 'arbitro@ejemplo.com' },
              { label: 'Contraseña *', key: 'password', type: 'password', placeholder: 'Mínimo 6 caracteres' },
              { label: 'Número de Árbitro', key: 'refNumber', type: 'text', placeholder: 'Ej. COARC-042 (opcional)' },
            ].map(f => (
              <div key={f.key}>
                <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.4rem' }}>{f.label}</label>
                <input
                  type={f.type}
                  className="form-control"
                  placeholder={f.placeholder}
                  value={form[f.key]}
                  onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                />
              </div>
            ))}

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.4rem' }}>Rol</label>
              <select className="form-control" value={form.role} onChange={e => setForm(prev => ({ ...prev, role: e.target.value }))}>
                <option value="user">Árbitro</option>
                <option value="admin">Administrador</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button type="submit" className="btn btn-primary" disabled={creating} style={{ flex: 1 }}>
                {creating ? 'Creando...' : 'Crear Árbitro'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => setTab('users')}>Cancelar</button>
            </div>
          </form>
        )}
      </div>

      {/* Confirmation Modal: Delete User */}
      {userToDelete && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1rem',
        }}>
          <div className="card" style={{
            maxWidth: '460px',
            width: '100%',
            padding: '1.75rem',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--color-red-card)' }}>
              <div style={{
                background: 'rgba(239, 68, 68, 0.15)',
                padding: '0.6rem',
                borderRadius: '50%',
                display: 'flex',
              }}>
                <TrashIcon size={24} />
              </div>
              <h3 style={{ margin: 0, fontSize: '1.15rem' }}>¿Eliminar cuenta de árbitro?</h3>
            </div>

            <div style={{ fontSize: '0.9rem', color: 'var(--color-text)', lineHeight: '1.5' }}>
              Estás a punto de eliminar permanentemente la cuenta de:
              <div style={{
                background: 'var(--color-surface)',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-sm)',
                margin: '0.75rem 0',
                border: '1px solid var(--color-border)',
              }}>
                <div style={{ fontWeight: '700' }}>{userToDelete.name}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{userToDelete.email}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-accent)', marginTop: '0.25rem' }}>
                  Partidos registrados: <strong>{userToDelete.matchCount || 0}</strong>
                </div>
              </div>
              <p style={{ color: 'var(--color-red-card)', fontSize: '0.82rem', margin: 0 }}>
                ⚠️ <strong>Atención:</strong> Esta acción borrará también todos los partidos, perfiles y datos asociados a este árbitro. No se puede deshacer.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                disabled={deleting}
                onClick={() => setUserToDelete(null)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn"
                disabled={deleting}
                onClick={handleConfirmDelete}
                style={{
                  background: 'var(--color-red-card)',
                  color: '#fff',
                  border: 'none',
                  fontWeight: '600',
                  padding: '0.6rem 1.25rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                {deleting ? 'Eliminando...' : 'Sí, eliminar cuenta'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inspector Modal: View Referee Matches */}
      {viewingUser && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1rem',
        }}>
          <div className="card" style={{
            maxWidth: '820px',
            width: '100%',
            maxHeight: '85vh',
            display: 'flex',
            flexDirection: 'column',
            padding: '1.5rem',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--color-border)',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <ClipboardList size={20} color="var(--color-primary)" />
                  Partidos de {viewingUser.name}
                </h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                  {viewingUser.email} &bull; Total: {refereeMatches.length} partidos &bull; Ingresos: {formatCurrency(viewingUser.totalEarnings)}
                </span>
              </div>
              <button
                onClick={() => setViewingUser(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}
              >
                <CloseIcon size={20} />
              </button>
            </div>

            <div style={{ overflowY: 'auto', flex: 1, marginTop: '0.5rem' }}>
              {loadingMatches ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
                  Cargando partidos del árbitro...
                </div>
              ) : refereeMatches.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
                  Este árbitro no tiene partidos registrados aún.
                </div>
              ) : (
                <table className="matches-table" style={{ width: '100%' }}>
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Torneo</th>
                      <th>Encuentro</th>
                      <th>Marcador</th>
                      <th>Rol</th>
                      <th>Honorarios</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {refereeMatches.map(m => (
                      <tr key={m.id}>
                        <td style={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>{m.date} {m.time}</td>
                        <td style={{ fontSize: '0.82rem', fontWeight: '500' }}>{m.tournament || '—'}</td>
                        <td style={{ fontSize: '0.85rem', fontWeight: '600' }}>{m.homeTeam} vs {m.awayTeam}</td>
                        <td style={{ textAlign: 'center', fontWeight: '700' }}>{m.homeGoals} - {m.awayGoals}</td>
                        <td style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{m.role}</td>
                        <td style={{ fontWeight: '600', color: 'var(--color-accent)' }}>{formatCurrency(m.fee)}</td>
                        <td>
                          <span style={{
                            fontSize: '0.72rem',
                            fontWeight: '700',
                            padding: '0.15rem 0.45rem',
                            borderRadius: '4px',
                            background: m.paymentStatus === 'Pagado' ? 'rgba(0,200,100,0.1)' : 'rgba(234,179,8,0.1)',
                            color: m.paymentStatus === 'Pagado' ? 'var(--color-primary)' : '#eab308',
                            border: m.paymentStatus === 'Pagado' ? '1px solid rgba(0,200,100,0.2)' : '1px solid rgba(234,179,8,0.2)',
                          }}>
                            {m.paymentStatus}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--color-border)' }}>
              <button className="btn btn-secondary" onClick={() => setViewingUser(null)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminPanel;
