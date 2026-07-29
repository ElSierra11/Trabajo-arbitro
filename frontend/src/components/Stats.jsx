import React, { useMemo } from 'react';
import { useRefContext } from '../context/RefContext';
import { WhistleIcon, DollarIcon, CardIcon, PendingIcon } from './Icons';
import { exportFinancialsToPDF, exportMatchesToExcel } from '../utils/exportUtils';

const formatCurrency = (val) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(val || 0);

const Stats = ({ onOpenInvoiceModal }) => {
  const { matches, stats } = useRefContext();

  // 1. Calculate statistics by category
  const categoryStats = useMemo(() => {
    const categories = {};
    matches.forEach(m => {
      const cat = m.category || 'Otro';
      if (!categories[cat]) {
        categories[cat] = {
          name: cat.startsWith('20') ? `Sub-${cat}` : cat,
          count: 0,
          earnings: 0,
          yellow: 0,
          red: 0
        };
      }
      categories[cat].count += 1;
      categories[cat].earnings += m.fee || 0;
      categories[cat].yellow += m.yellowCards || 0;
      categories[cat].red += m.redCards || 0;
    });
    return Object.values(categories).sort((a, b) => b.earnings - a.earnings);
  }, [matches]);

  // 2. Tournament Debt Breakdown (Who owes how much)
  const tournamentDebts = useMemo(() => {
    const map = {};
    matches.forEach(m => {
      const t = m.tournament || 'Torneo General / Amistoso';
      if (!map[t]) {
        map[t] = { name: t, total: 0, paid: 0, pending: 0, count: 0 };
      }
      map[t].count += 1;
      map[t].total += m.fee || 0;
      if (m.paymentStatus === 'Pagado') map[t].paid += m.fee || 0;
      else map[t].pending += m.fee || 0;
    });
    return Object.values(map).sort((a, b) => b.pending - a.pending);
  }, [matches]);

  // 3. Calculate statistics by role
  const roleStats = useMemo(() => {
    const roles = {
      'Árbitro Central': { name: 'Árbitro Central', count: 0, earnings: 0, yellow: 0, red: 0 },
      'Asistente / Alterna': { name: 'Asistente / Alterna', count: 0, earnings: 0, yellow: 0, red: 0 },
      'Cuarto Árbitro': { name: 'Cuarto Árbitro', count: 0, earnings: 0, yellow: 0, red: 0 }
    };

    matches.forEach(m => {
      const r = m.role || 'Árbitro Central';
      let targetRole = 'Árbitro Central';
      if (r.includes('Asistente') || r.includes('Alterna')) {
        targetRole = 'Asistente / Alterna';
      } else if (r.includes('Cuarto')) {
        targetRole = 'Cuarto Árbitro';
      }

      roles[targetRole].count += 1;
      roles[targetRole].earnings += m.fee || 0;
      roles[targetRole].yellow += m.yellowCards || 0;
      roles[targetRole].red += m.redCards || 0;
    });

    return Object.values(roles).filter(r => r.count > 0);
  }, [matches]);

  if (matches.length === 0) {
    return (
      <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '5rem 1.5rem', textAlign: 'center' }}>
        <WhistleIcon size={48} style={{ opacity: 0.2, marginBottom: '1rem', color: 'var(--color-primary)' }} />
        <h3>Aún no hay estadísticas disponibles</h3>
        <p className="text-muted" style={{ fontSize: '0.875rem', maxWidth: '350px', marginTop: '0.5rem' }}>
          Ingresa algunos partidos en el sistema para generar tus gráficos mensuales de ingresos y análisis por rol.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Debt per Tournament Card */}
      <section className="card">
        <div className="flex-between" style={{ marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.2rem' }}>Desglose de Deudas por Liga / Torneo</h3>
            <p className="text-muted" style={{ fontSize: '0.8rem' }}>Identifica rápidamente qué organización o torneo tiene montos pendientes por pagar</p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button className="btn btn-secondary" style={{ padding: '0.5rem 0.85rem', fontSize: '0.85rem' }} onClick={() => exportFinancialsToPDF(stats, 'COARC')}>
              📄 Informe PDF
            </button>
            <button className="btn btn-secondary" style={{ padding: '0.5rem 0.85rem', fontSize: '0.85rem' }} onClick={() => exportMatchesToExcel(matches, 'COARC_Finanzas')}>
              📊 Reporte Excel
            </button>
            {stats.pendingEarnings > 0 && (
              <button className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }} onClick={onOpenInvoiceModal}>
                📄 Cuenta de Cobro PDF
              </button>
            )}
          </div>
        </div>

        <div className="matches-table-container">
          <table className="matches-table">
            <thead>
              <tr>
                <th>Torneo / Liga</th>
                <th style={{ textAlign: 'center' }}>Partidos</th>
                <th>Total Facturado</th>
                <th style={{ color: 'var(--color-success)' }}>Cobrado</th>
                <th style={{ color: 'var(--color-pending)' }}>Por Cobrar (Deuda)</th>
                <th style={{ textAlign: 'center' }}>Acción</th>
              </tr>
            </thead>
            <tbody>
              {tournamentDebts.map(t => (
                <tr key={t.name}>
                  <td style={{ fontWeight: '600' }}>{t.name}</td>
                  <td style={{ textAlign: 'center' }}>
                    <span style={{ background: 'rgba(0,200,100,0.08)', color: 'var(--color-primary)', border: '1px solid rgba(0,200,100,0.2)', borderRadius: '4px', padding: '0.1rem 0.5rem', fontSize: '0.8rem', fontWeight: '700' }}>
                      {t.count}
                    </span>
                  </td>
                  <td style={{ fontWeight: '700', color: 'var(--color-accent)' }}>{formatCurrency(t.total)}</td>
                  <td style={{ color: 'var(--color-success)', fontWeight: '600' }}>{formatCurrency(t.paid)}</td>
                  <td>
                    <span style={{ color: t.pending > 0 ? 'var(--color-pending)' : 'var(--color-text-muted)', fontWeight: t.pending > 0 ? '700' : '400' }}>
                      {t.pending > 0 ? formatCurrency(t.pending) : 'Al día'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    {t.pending > 0 && (
                      <button className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }} onClick={onOpenInvoiceModal}>
                        Cobrar PDF
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Role and Monthly grid */}
      <div className="grid-cols-3">
        {/* Monthly Summary */}
        <section className="card" style={{ gridColumn: window.innerWidth > 768 ? 'span 2' : 'span 1' }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Histórico por Meses</h3>
          <div className="matches-table-container">
            <table className="matches-table">
              <thead>
                <tr>
                  <th>Mes</th>
                  <th style={{ textAlign: 'center' }}>Partidos</th>
                  <th>Ganancias</th>
                  <th>Cobrado</th>
                  <th>Pendiente</th>
                </tr>
              </thead>
              <tbody>
                {stats.monthlyStats.slice().reverse().map(m => (
                  <tr key={m.monthKey}>
                    <td style={{ fontWeight: '600', textTransform: 'capitalize' }}>{m.label}</td>
                    <td style={{ textAlign: 'center', fontWeight: '700' }}>{m.count}</td>
                    <td style={{ color: 'var(--color-accent)', fontWeight: '700' }}>{formatCurrency(m.total)}</td>
                    <td style={{ color: 'var(--color-success)', fontWeight: '600' }}>{formatCurrency(m.paid)}</td>
                    <td>
                      <span style={{ color: m.pending > 0 ? 'var(--color-pending)' : 'var(--color-text-muted)', fontWeight: m.pending > 0 ? '700' : '400' }}>
                        {formatCurrency(m.pending)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Role Performance */}
        <section className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '0.25rem' }}>Ingresos por Rol</h3>
          <p className="text-muted" style={{ fontSize: '0.8rem', marginBottom: '0.5rem' }}>Estadísticas según la función desempeñada.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {roleStats.map(role => (
              <div key={role.name} className="card" style={{ padding: '1rem', backgroundColor: 'rgba(0,0,0,0.1)' }}>
                <div className="flex-between">
                  <span style={{ fontWeight: '700', fontSize: '0.9rem' }}>{role.name}</span>
                  <span className="badge" style={{ backgroundColor: 'var(--color-surface-hover)' }}>
                    {role.count} {role.count === 1 ? 'partido' : 'partidos'}
                  </span>
                </div>
                <div className="flex-between" style={{ marginTop: '0.75rem' }}>
                  <span className="text-muted" style={{ fontSize: '0.8rem' }}>Ganancias:</span>
                  <span style={{ fontWeight: '700', color: 'var(--color-primary)' }}>{formatCurrency(role.earnings)}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Category Analysis */}
      <section className="card">
        <h3 style={{ fontSize: '1.2rem', marginBottom: '1.25rem' }}>Análisis por Categoría (Escuelas y Torneos)</h3>
        <div className="matches-table-container">
          <table className="matches-table">
            <thead>
              <tr>
                <th>Categoría</th>
                <th style={{ textAlign: 'center' }}>Partidos Dirigidos</th>
                <th>Ingresos Generados</th>
                <th>Tarifa Promedio</th>
                <th style={{ textAlign: 'center' }}>Tarjetas</th>
              </tr>
            </thead>
            <tbody>
              {categoryStats.map(cat => (
                <tr key={cat.name}>
                  <td style={{ fontWeight: '600' }}>{cat.name}</td>
                  <td style={{ textAlign: 'center', fontWeight: '700' }}>{cat.count}</td>
                  <td style={{ color: 'var(--color-accent)', fontWeight: '700' }}>{formatCurrency(cat.earnings)}</td>
                  <td>{formatCurrency(Math.round(cat.earnings / cat.count))}</td>
                  <td style={{ textAlign: 'center' }}>
                    <span style={{ fontWeight: '600' }}>{cat.yellow}</span> <span style={{ opacity: 0.3 }}>/</span> <span style={{ fontWeight: '600', color: 'var(--color-red-card)' }}>{cat.red}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

    </div>
  );
};

export default Stats;
