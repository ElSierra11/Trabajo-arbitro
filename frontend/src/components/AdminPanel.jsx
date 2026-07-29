import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const formatCurrency = (val) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(val || 0);

const MONTH_NAMES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

// Icons inline
const UserIcon = ({ size = 18 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
);
const ShieldIcon = ({ size = 18 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);
const PlusCircleIcon = ({ size = 18 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
  </svg>
);
const XIcon = ({ size = 16 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
);

const AdminPanel = () => {
  const { token } = useAuth();
  const [tab, setTab] = useState('users'); // 'users' | 'create'
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Create user form
  const [form, setForm] = useState({ name: '', email: '', password: '', refNumber: '', role: 'user' });
  const [creating, setCreating] = useState(false);

  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

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
      setSuccess(`✅ ${data.message}`);
    } catch (e) {
      setError(e.message);
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
      setSuccess(`✅ Árbitro "${form.name}" creado correctamente.`);
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
            <PlusCircleIcon size={36} />
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
              <PlusCircleIcon size={14} /> Crear Árbitro
            </button>
          </div>

          <button
            className="btn btn-secondary"
            style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            onClick={() => {
              const headers = ["ID Árbitro", "Nombre Completo", "Correo Electrónico", "N° Registro", "Partidos Dirigidos", "Total Facturado COP", "Total Cobrado COP", "Rol Sistema", "Fecha Registro"];
              const rows = users.map(u => [
                u.id, `"${u.name || ''}"`, `"${u.email || ''}"`, `"${u.refNumber || ''}"`, u.matchCount || 0, u.totalEarnings || 0, u.paidEarnings || 0, u.role === 'admin' ? 'Administrador' : 'Árbitro', u.createdAt ? new Date(u.createdAt).toLocaleDateString('es-CO') : ''
              ]);
              const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
              const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `coarc_reporte_arbitros_${new Date().toISOString().slice(0,10)}.csv`;
              a.click();
            }}
          >
            📊 Exportar Reporte Master (CSV)
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 'var(--radius-sm)', padding: '0.75rem 1rem', fontSize: '0.85rem', color: 'var(--color-red-card)', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {error}
            <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}><XIcon /></button>
          </div>
        )}
        {success && (
          <div style={{ background: 'rgba(0,200,100,0.08)', border: '1px solid rgba(0,200,100,0.25)', borderRadius: 'var(--radius-sm)', padding: '0.75rem 1rem', fontSize: '0.85rem', color: 'var(--color-primary)', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {success}
            <button onClick={() => setSuccess(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}><XIcon /></button>
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
                    <th style={{ textAlign: 'center' }}>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
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
                          <span style={{ fontWeight: '600' }}>{u.name}</span>
                        </div>
                      </td>
                      <td style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>{u.email}</td>
                      <td style={{ fontSize: '0.85rem' }}>{u.refNumber || '—'}</td>
                      <td style={{ textAlign: 'center' }}>
                        <span style={{ background: 'rgba(0,200,100,0.08)', color: 'var(--color-primary)', border: '1px solid rgba(0,200,100,0.2)', borderRadius: '4px', padding: '0.1rem 0.5rem', fontSize: '0.8rem', fontWeight: '700' }}>
                          {u.matchCount || 0}
                        </span>
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
                        <button
                          className="btn btn-secondary"
                          style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                          onClick={() => handleResetPassword(u.id, u.name)}
                          title="Restablecer contraseña de esta cuenta"
                        >
                          🔑 Clave
                        </button>
                      </td>
                    </tr>
                  ))}
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
    </div>
  );
};

export default AdminPanel;
