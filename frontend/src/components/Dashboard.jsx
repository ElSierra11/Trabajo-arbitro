import React, { useMemo } from 'react';
import { useRefContext } from '../context/RefContext';
import { 
  WhistleIcon, 
  DollarIcon, 
  CardIcon, 
  CheckIcon, 
  PendingIcon, 
  EditIcon,
  StatsIcon
} from './Icons';

const formatCurrency = (val) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(val || 0);

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
};

const MONTH_NAMES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

const Dashboard = ({ onNavigate, onAddMatch, onEditMatch }) => {
  const { matches, stats, togglePaymentStatus } = useRefContext();

  const recentMatches = matches.slice(0, 4);

  // Build monthly summary
  const monthlySummary = useMemo(() => {
    const map = {};
    matches.forEach(m => {
      if (!m.date) return;
      const d = new Date(m.date + 'T00:00:00');
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!map[key]) {
        map[key] = {
          key,
          label: `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`,
          count: 0,
          total: 0,
          paid: 0,
          pending: 0,
        };
      }
      map[key].count += 1;
      map[key].total += m.fee || 0;
      if (m.paymentStatus === 'Pagado') map[key].paid += m.fee || 0;
      else map[key].pending += m.fee || 0;
    });
    return Object.values(map).sort((a, b) => b.key.localeCompare(a.key));
  }, [matches]);

  // Overdue alert: matches pending payment for more than 14 days
  const overdueMatches = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 14);
    return matches.filter(m => {
      if (m.paymentStatus === 'Pagado') return false;
      const d = new Date(m.date + 'T00:00:00');
      return d < cutoff;
    });
  }, [matches]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Overdue Alert */}
      {overdueMatches.length > 0 && (
        <div style={{
          background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)',
          borderRadius: 'var(--radius-md)', padding: '1rem 1.25rem',
          display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap',
        }}>
          <PendingIcon size={22} style={{ color: 'var(--color-pending)', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: '700', color: 'var(--color-pending)', fontSize: '0.9rem' }}>
              {overdueMatches.length} cobro{overdueMatches.length > 1 ? 's' : ''} pendiente{overdueMatches.length > 1 ? 's' : ''} hace más de 14 días
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
              Total sin cobrar: <strong style={{ color: 'var(--color-pending)' }}>{formatCurrency(overdueMatches.reduce((s, m) => s + (m.fee || 0), 0))}</strong>
            </div>
          </div>
          <button className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem', flexShrink: 0, borderColor: 'rgba(245,158,11,0.3)' }} onClick={() => onNavigate('matches')}>
            Ver partidos
          </button>
        </div>
      )}

      {/* 4 Metric Cards Grid */}
      <section className="grid-cols-4">
        <div className="card metric-card">
          <div className="card-header-accent" style={{ background: 'var(--color-primary)' }} />
          <span className="metric-title">Partidos Arbitrados</span>
          <span className="metric-value">{stats.totalMatches}</span>
          <div className="metric-trend text-muted">Historial acumulado</div>
          <WhistleIcon className="metric-icon" size={40} />
        </div>

        <div className="card metric-card">
          <div className="card-header-accent" style={{ background: 'var(--color-accent)' }} />
          <span className="metric-title">Ganancias Totales</span>
          <span className="metric-value">{formatCurrency(stats.totalEarnings)}</span>
          <div className="metric-trend" style={{ color: 'var(--color-primary)' }}>Total por cobrar y cobrado</div>
          <DollarIcon className="metric-icon" size={40} />
        </div>

        <div className="card metric-card">
          <div className="card-header-accent" style={{ background: 'var(--color-success)' }} />
          <span className="metric-title">Dinero Cobrado</span>
          <span className="metric-value" style={{ color: 'var(--color-success)' }}>{formatCurrency(stats.paidEarnings)}</span>
          <div className="metric-trend text-muted">Recibido en cuenta</div>
          <CheckIcon className="metric-icon" size={40} style={{ color: 'var(--color-success)' }} />
        </div>

        <div className="card metric-card" style={{ borderColor: stats.pendingEarnings > 0 ? 'rgba(245, 158, 11, 0.4)' : '' }}>
          <div className="card-header-accent" style={{ background: 'var(--color-pending)' }} />
          <span className="metric-title">Por Cobrar (Pendiente)</span>
          <span className="metric-value" style={{ color: stats.pendingEarnings > 0 ? 'var(--color-pending)' : 'var(--color-text-muted)' }}>
            {formatCurrency(stats.pendingEarnings)}
          </span>
          <div className="metric-trend" style={{ color: stats.pendingEarnings > 0 ? 'var(--color-pending)' : 'var(--color-text-muted)' }}>
            {stats.pendingEarnings > 0 ? 'Cobros pendientes de pago' : 'Sin deudas pendientes'}
          </div>
          <PendingIcon className="metric-icon" size={40} style={{ color: 'var(--color-pending)' }} />
        </div>
      </section>

      {/* Main Panel */}
      <div className="grid-cols-3">
        
        {/* Recent Matches */}
        <section className="card" style={{ gridColumn: window.innerWidth > 768 ? 'span 2' : 'span 1' }}>
          <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.2rem' }}>Partidos Recientes</h3>
            {matches.length > 0 && (
              <button className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.875rem' }} onClick={() => onNavigate('matches')}>
                Ver todos
              </button>
            )}
          </div>

          {recentMatches.length === 0 ? (
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'3rem 1.5rem', textAlign:'center', backgroundColor:'rgba(0,0,0,0.1)', borderRadius:'var(--radius-md)' }}>
              <WhistleIcon size={48} style={{ opacity: 0.3, marginBottom: '1rem', color: 'var(--color-primary)' }} />
              <h4 style={{ marginBottom: '0.5rem' }}>No hay partidos registrados aún</h4>
              <p className="text-muted" style={{ fontSize: '0.875rem', maxWidth: '300px', marginBottom: '1.5rem' }}>
                Registra los partidos de tus fines de semana para llevar el control de tus ingresos y estadísticas.
              </p>
              <button className="btn btn-primary" onClick={onAddMatch}>Registrar Mi Primer Partido</button>
            </div>
          ) : (
            <div className="match-card-list">
              {recentMatches.map(match => (
                <div key={match.id} className="match-item">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span className="badge badge-central" style={{
                        backgroundColor: match.role === 'Árbitro Central' ? 'rgba(204, 255, 0, 0.1)' : 'rgba(0, 240, 255, 0.1)',
                        color: match.role === 'Árbitro Central' ? 'var(--color-primary)' : 'var(--color-accent)',
                        borderColor: match.role === 'Árbitro Central' ? 'rgba(204, 255, 0, 0.2)' : 'rgba(0, 240, 255, 0.2)',
                      }}>
                        {match.role}
                      </span>
                      {match.category && (
                        <span className="badge" style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--color-text)' }}>
                          Sub-{match.category}
                        </span>
                      )}
                      <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{formatDate(match.date)}</span>
                    </div>
                    <div className="match-teams" style={{ marginTop: '0.5rem' }}>
                      {match.homeTeam || 'Local'} <span style={{ color: 'var(--color-primary)' }}>{match.homeGoals}</span> vs <span style={{ color: 'var(--color-primary)' }}>{match.awayGoals}</span> {match.awayTeam || 'Visitante'}
                    </div>
                    {match.tournament && <div className="text-muted" style={{ fontSize: '0.8rem' }}>Liga/Torneo: {match.tournament}</div>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <div style={{ fontWeight: '700', fontSize: '1rem' }}>{formatCurrency(match.fee)}</div>
                      <button
                        className={`badge ${match.paymentStatus === 'Pagado' ? 'badge-paid' : 'badge-pending'}`}
                        style={{ cursor: 'pointer', border: '1px solid currentColor' }}
                        onClick={() => togglePaymentStatus(match.id)}
                        title="Haga clic para cambiar estado de pago"
                      >
                        {match.paymentStatus}
                      </button>
                    </div>
                    <button className="btn-icon-only" onClick={() => onEditMatch(match)} title="Editar partido">
                      <EditIcon size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Stats Summary */}
        <section className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Resumen Arbitral</h3>

          <div className="card" style={{ backgroundColor: 'rgba(0,0,0,0.15)', padding: '1rem', border: '1px solid var(--color-border)' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: '600' }}>Tarjetas Mostradas</span>
            <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
                <CardIcon color="var(--color-yellow-card)" size={24} />
                <div>
                  <div style={{ fontSize: '1.25rem', fontWeight: '800' }}>{stats.totalYellowCards}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Amarillas</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
                <CardIcon color="var(--color-red-card)" size={24} />
                <div>
                  <div style={{ fontSize: '1.25rem', fontWeight: '800' }}>{stats.totalRedCards}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Rojas</div>
                </div>
              </div>
            </div>
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div className="flex-between" style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>
              <span className="text-muted" style={{ fontSize: '0.875rem' }}>Promedio Tarjetas / Juego:</span>
              <span style={{ fontWeight: '700' }}>{stats.totalMatches > 0 ? ((stats.totalYellowCards + stats.totalRedCards) / stats.totalMatches).toFixed(1) : 0}</span>
            </div>
            <div className="flex-between" style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>
              <span className="text-muted" style={{ fontSize: '0.875rem' }}>Partidos como Central:</span>
              <span style={{ fontWeight: '700' }}>{matches.filter(m => m.role === 'Árbitro Central').length}</span>
            </div>
            <div className="flex-between" style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>
              <span className="text-muted" style={{ fontSize: '0.875rem' }}>Partidos como Asistente:</span>
              <span style={{ fontWeight: '700' }}>{matches.filter(m => m.role !== 'Árbitro Central').length}</span>
            </div>
            <div className="flex-between" style={{ paddingBottom: '0.5rem' }}>
              <span className="text-muted" style={{ fontSize: '0.875rem' }}>Tarifa Promedio:</span>
              <span style={{ fontWeight: '700', color: 'var(--color-accent)' }}>{formatCurrency(stats.totalMatches > 0 ? (stats.totalEarnings / stats.totalMatches) : 0)}</span>
            </div>
          </div>

          <button className="btn btn-secondary btn-block" style={{ marginTop: 'auto' }} onClick={() => onNavigate('stats')}>
            <StatsIcon size={16} />
            <span>Ver Análisis Completo</span>
          </button>
        </section>
      </div>

      {/* Monthly Income Table */}
      {monthlySummary.length > 0 && (
        <section className="card">
          <div className="flex-between" style={{ marginBottom: '1.25rem' }}>
            <div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '0.2rem' }}>Resumen Mensual de Partidos</h3>
              <p className="text-muted" style={{ fontSize: '0.8rem' }}>Todos los partidos pitados por mes con ingresos acumulados</p>
            </div>
            <div style={{
              background: 'rgba(0,200,100,0.08)', border: '1px solid rgba(0,200,100,0.2)',
              borderRadius: 'var(--radius-sm)', padding: '0.4rem 0.8rem', textAlign: 'right'
            }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', fontWeight: '600' }}>INGRESO TOTAL</div>
              <div style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--color-primary)' }}>{formatCurrency(stats.totalEarnings)}</div>
            </div>
          </div>

          <div className="matches-table-container">
            <table className="matches-table">
              <thead>
                <tr>
                  <th>Mes</th>
                  <th style={{ textAlign: 'center' }}>Partidos</th>
                  <th>Ingresos</th>
                  <th style={{ color: 'var(--color-success)' }}>Cobrado</th>
                  <th style={{ color: 'var(--color-pending)' }}>Pendiente</th>
                  <th style={{ textAlign: 'right', width: '120px' }}>Progreso</th>
                </tr>
              </thead>
              <tbody>
                {monthlySummary.map(m => {
                  const paidPct = m.total > 0 ? Math.round((m.paid / m.total) * 100) : 0;
                  return (
                    <tr key={m.key}>
                      <td style={{ fontWeight: '600', textTransform: 'capitalize' }}>{m.label}</td>
                      <td style={{ textAlign: 'center' }}>
                        <span style={{
                          background: 'rgba(0,200,100,0.08)', color: 'var(--color-primary)',
                          border: '1px solid rgba(0,200,100,0.2)', borderRadius: '4px',
                          padding: '0.1rem 0.5rem', fontSize: '0.8rem', fontWeight: '700'
                        }}>
                          {m.count}
                        </span>
                      </td>
                      <td style={{ fontWeight: '700', color: 'var(--color-accent)' }}>{formatCurrency(m.total)}</td>
                      <td style={{ color: 'var(--color-success)', fontWeight: '600' }}>{formatCurrency(m.paid)}</td>
                      <td>
                        <span style={{
                          color: m.pending > 0 ? 'var(--color-pending)' : 'var(--color-text-muted)',
                          fontWeight: m.pending > 0 ? '700' : '400'
                        }}>
                          {m.pending > 0 ? formatCurrency(m.pending) : '—'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'flex-end' }}>
                          <div style={{ width: '60px', height: '6px', background: 'var(--color-border)', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ width: `${paidPct}%`, height: '100%', background: paidPct === 100 ? 'var(--color-success)' : 'var(--color-primary)', borderRadius: '3px', transition: 'width 0.5s ease' }} />
                          </div>
                          <span style={{ fontSize: '0.75rem', fontWeight: '700', color: paidPct === 100 ? 'var(--color-success)' : 'var(--color-text-muted)', minWidth: '30px', textAlign: 'right' }}>
                            {paidPct}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr style={{ borderTop: '2px solid var(--color-border)' }}>
                  <td style={{ fontWeight: '800', fontSize: '0.9rem' }}>TOTAL</td>
                  <td style={{ textAlign: 'center', fontWeight: '800' }}>{stats.totalMatches}</td>
                  <td style={{ fontWeight: '800', color: 'var(--color-accent)' }}>{formatCurrency(stats.totalEarnings)}</td>
                  <td style={{ fontWeight: '800', color: 'var(--color-success)' }}>{formatCurrency(stats.paidEarnings)}</td>
                  <td style={{ fontWeight: '800', color: stats.pendingEarnings > 0 ? 'var(--color-pending)' : 'var(--color-text-muted)' }}>{stats.pendingEarnings > 0 ? formatCurrency(stats.pendingEarnings) : '—'}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </section>
      )}
    </div>
  );
};

export default Dashboard;
