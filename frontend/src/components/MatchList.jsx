import React, { useState, useMemo } from 'react';
import { useRefContext } from '../context/RefContext';
import { 
  TrashIcon, 
  EditIcon, 
  WhistleIcon, 
  YellowCardIcon,
  RedCardIcon,
  PlusIcon,
  SoccerBallIcon,
  DownloadIcon,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  ChevronDown,
  ChevronUp
} from './Icons';
import { generateMatchPDF } from '../utils/pdfGenerator';
import { exportMatchesToPDF, exportMatchesToExcel } from '../utils/exportUtils';

// Format currency helper
const formatCurrency = (val) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(val || 0);
};

// Format Date helper
const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const dateObj = new Date(dateStr + 'T00:00:00'); // Prevent timezone offset
  return dateObj.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};

// Helper to get month label from year-month string
const getMonthLabel = (yearMonthStr) => {
  const [year, month] = yearMonthStr.split('-');
  const date = new Date(year, parseInt(month) - 1, 1);
  return date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
};

const MatchList = ({ onEditMatch, onAddMatch }) => {
  const { matches, deleteMatch, togglePaymentStatus, activeProfile } = useRefContext();

  // Search & Filter States
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [roleFilter, setRoleFilter] = useState('Todos');
  const [monthFilter, setMonthFilter] = useState('Todos');
  
  // Collapse/Expand state for match details
  const [expandedMatchId, setExpandedMatchId] = useState(null);

  // Extract all unique months from match dates for the dropdown filter
  const uniqueMonths = useMemo(() => {
    const months = new Set();
    matches.forEach(m => {
      if (!m.date) return;
      const monthKey = m.date.slice(0, 7); // Get YYYY-MM
      months.add(monthKey);
    });
    return Array.from(months).sort().reverse();
  }, [matches]);

  // Filtered Matches
  const filteredMatches = useMemo(() => {
    return matches.filter(m => {
      // 1. Search Query
      const query = search.toLowerCase();
      const matchText = `${m.homeTeam} ${m.awayTeam} ${m.tournament || ''} ${m.category || ''} ${m.notes || ''}`.toLowerCase();
      const matchesSearch = !query || matchText.includes(query);

      // 2. Status Filter
      const matchesStatus = statusFilter === 'Todos' || m.paymentStatus === statusFilter;

      // 3. Role Filter
      const matchesRole = roleFilter === 'Todos' || m.role === roleFilter;

      // 4. Month Filter
      const matchesMonth = monthFilter === 'Todos' || (m.date && m.date.startsWith(monthFilter));

      return matchesSearch && matchesStatus && matchesRole && matchesMonth;
    });
  }, [matches, search, statusFilter, roleFilter, monthFilter]);

  // Totals for filtered matches
  const filteredTotals = useMemo(() => {
    let total = 0;
    let paid = 0;
    let pending = 0;
    filteredMatches.forEach(m => {
      total += m.fee || 0;
      if (m.paymentStatus === 'Pagado') {
        paid += m.fee || 0;
      } else {
        pending += m.fee || 0;
      }
    });
    return { total, paid, pending, count: filteredMatches.length };
  }, [filteredMatches]);

  const handleDelete = (id, teams) => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar el partido: "${teams}"? Esta acción no se puede deshacer.`)) {
      deleteMatch(id);
    }
  };

  const handleToggleExpand = (id) => {
    setExpandedMatchId(prev => prev === id ? null : id);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Search and Filters Bar */}
      <div className="card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        
        {/* Top Search Input */}
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <input 
              type="text" 
              className="form-control" 
              placeholder="Buscar por equipo, torneo, categoría o notas..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: '2.5rem' }}
            />
            <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }}>
              🔍
            </span>
          </div>

          {search && (
            <button 
              className="btn btn-secondary" 
              style={{ padding: '0.75rem 1rem' }}
              onClick={() => setSearch('')}
            >
              Limpiar
            </button>
          )}
        </div>

        {/* Dropdown Filters */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', 
          gap: '0.75rem',
          alignItems: 'center' 
        }}>
          {/* Status Filter */}
          <div>
            <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>Estado de Pago</label>
            <select 
              className="form-control" 
              style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="Todos">Todos los Estados</option>
              <option value="Pagado">Pagados</option>
              <option value="Pendiente">Pendientes de Pago</option>
            </select>
          </div>

          {/* Role Filter */}
          <div>
            <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>Rol Arbitral</label>
            <select 
              className="form-control" 
              style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="Todos">Todos los Roles</option>
              <option value="Árbitro Central">Árbitro Central</option>
              <option value="Asistente 1">Asistente 1</option>
              <option value="Asistente 2">Asistente 2</option>
              <option value="Cuarto Árbitro">Cuarto Árbitro</option>
              <option value="Árbitro Asistente de Video (VAR)">VAR</option>
              <option value="Asistente de VAR (AVAR)">AVAR</option>
              <option value="Asistente / Alterna">Asistente / Alterna</option>
            </select>
          </div>

          {/* Month Filter */}
          <div>
            <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>Mes del Encuentro</label>
            <select 
              className="form-control" 
              style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem', textTransform: 'capitalize' }}
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
            >
              <option value="Todos">Todos los Meses</option>
              {uniqueMonths.map(m => (
                <option key={m} value={m}>
                  {getMonthLabel(m)}
                </option>
              ))}
            </select>
          </div>
        </div>

      </div>

      {/* Filtered Financial Summary Banner */}
      {filteredMatches.length > 0 && (
        <div style={{
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          padding: '0.85rem 1.25rem',
        }}>
          <div className="flex-between" style={{ flexWrap: 'wrap', gap: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
              Mostrando <strong style={{ color: 'var(--color-text)' }}>{filteredTotals.count}</strong> partidos filtrados
            </span>
            <div style={{ display: 'flex', gap: '1.25rem', fontSize: '0.85rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <span>
                Total: <strong style={{ color: 'var(--color-accent)' }}>{formatCurrency(filteredTotals.total)}</strong>
              </span>
              <span>
                Cobrado: <strong style={{ color: 'var(--color-success)' }}>{formatCurrency(filteredTotals.paid)}</strong>
              </span>
              <span>
                Pendiente: <strong style={{ color: 'var(--color-pending)' }}>{formatCurrency(filteredTotals.pending)}</strong>
              </span>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button 
                  className="btn btn-secondary"
                  style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                  onClick={() => exportMatchesToPDF(filteredMatches)}
                  title="Descargar reporte oficial de partidos en PDF"
                >
                  <DownloadIcon size={14} />
                  <span>PDF</span>
                </button>
                <button 
                  className="btn btn-secondary"
                  style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                  onClick={() => exportMatchesToExcel(filteredMatches)}
                  title="Descargar hoja de cálculo Excel"
                >
                  <FileSpreadsheet size={14} />
                  <span>Excel (.xlsx)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Matches List / Table */}
      {filteredMatches.length === 0 ? (
        <div className="card" style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          padding: '4rem 1.5rem',
          textAlign: 'center' 
        }}>
          <WhistleIcon size={40} style={{ opacity: 0.2, marginBottom: '1rem' }} />
          <h4>No se encontraron partidos</h4>
          <p className="text-muted" style={{ fontSize: '0.875rem', maxWidth: '350px', marginTop: '0.5rem' }}>
            Prueba ajustando los filtros de búsqueda o registra un nuevo partido en este perfil.
          </p>
          <button className="btn btn-primary" style={{ marginTop: '1.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }} onClick={onAddMatch}>
            <PlusIcon size={18} />
            <span>Registrar Partido</span>
          </button>
        </div>
      ) : (
        <>
          {/* DESKTOP TABLE VIEW (>= 1024px) */}
          <div className="matches-table-container matches-table-desktop">
            <table className="matches-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Torneo</th>
                  <th>Categoría</th>
                  <th>Partido</th>
                  <th style={{ textAlign: 'center' }}>Marcador</th>
                  <th>Tarjetas</th>
                  <th>Rol</th>
                  <th>Tarifa</th>
                  <th>Estado</th>
                  <th style={{ textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredMatches.map(match => {
                  const isExpanded = expandedMatchId === match.id;
                  return (
                    <React.Fragment key={match.id}>
                      <tr 
                        className="cursor-pointer hover:bg-surface-hover/80 transition-colors"
                        onClick={() => handleToggleExpand(match.id)}
                      >
                        <td style={{ whiteSpace: 'nowrap' }}>{formatDate(match.date)}</td>
                        <td style={{ maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {match.tournament || <em className="text-muted">Ninguno</em>}
                        </td>
                        <td>
                          <span className="badge" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}>
                            {match.category ? `Sub-${match.category}` : 'Libre'}
                          </span>
                        </td>
                        <td style={{ fontWeight: '600' }} className="flex items-center gap-1.5">
                          <span>{match.homeTeam} vs {match.awayTeam}</span>
                          <span className="text-[10px] text-accent/70 font-normal">
                            {isExpanded ? '▲' : '▼'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center', fontWeight: '700', color: 'var(--color-primary)' }}>
                          {match.homeGoals} - {match.awayGoals}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            {match.yellowCards > 0 && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }} title={`${match.yellowCards} Amarillas`}>
                                <YellowCardIcon size={13} />
                                <span style={{ fontSize: '0.8rem', fontWeight: '700' }}>{match.yellowCards}</span>
                              </div>
                            )}
                            {match.redCards > 0 && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }} title={`${match.redCards} Rojas`}>
                                <RedCardIcon size={13} />
                                <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--color-red-card)' }}>{match.redCards}</span>
                              </div>
                            )}
                            {!match.yellowCards && !match.redCards && (
                              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>—</span>
                            )}
                          </div>
                        </td>
                        <td>
                          <span className={`badge ${match.role === 'Árbitro Central' ? 'badge-central' : 'badge-assistant'}`}>
                            {match.role}
                          </span>
                        </td>
                        <td style={{ fontWeight: '700' }}>{formatCurrency(match.fee)}</td>
                        <td>
                          <button 
                            className={`badge ${match.paymentStatus === 'Pagado' ? 'badge-paid' : 'badge-pending'}`}
                            style={{ cursor: 'pointer', border: '1px solid currentColor' }}
                            onClick={(e) => { e.stopPropagation(); togglePaymentStatus(match.id); }}
                            title="Haz clic para alternar estado"
                          >
                            {match.paymentStatus}
                          </button>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'flex-end' }} onClick={(e) => e.stopPropagation()}>
                            <button 
                              className="btn-icon-only" 
                              onClick={() => generateMatchPDF(match, activeProfile)}
                              title="Exportar acta PDF"
                              style={{ color: 'var(--color-primary)', borderColor: 'rgba(0,200,100,0.15)' }}
                            >
                              <DownloadIcon size={14} />
                            </button>
                            <button className="btn-icon-only" onClick={() => onEditMatch(match)} title="Editar partido">
                              <EditIcon size={14} />
                            </button>
                            <button 
                              className="btn-icon-only" 
                              onClick={() => handleDelete(match.id, `${match.homeTeam} vs ${match.awayTeam}`)}
                              style={{ color: 'var(--color-red-card)', borderColor: 'rgba(255,42,95,0.1)' }}
                              title="Eliminar partido"
                            >
                              <TrashIcon size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Detail Accordion Row */}
                      {isExpanded && (
                        <tr className="bg-surface/50 border-b border-border">
                          <td colSpan="10" className="p-4 bg-black/20">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {/* Goals Info */}
                              <div className="space-y-2">
                                <h4 className="font-bold text-primary flex items-center gap-1.5 text-xs uppercase tracking-wider">
                                  <SoccerBallIcon size={14} className="text-primary" />
                                  <span>Goles del Partido</span>
                                </h4>
                                {match.goals && match.goals.length > 0 ? (
                                  <div className="flex flex-col gap-1 mt-2">
                                    {match.goals.map((g) => (
                                      <div key={g.id} className="text-xs text-slate-300 flex items-center gap-1.5">
                                        <span className="font-semibold text-primary">{g.minute}'</span> • {g.player} 
                                        <span className="text-[10px] text-muted-text">({g.team === 'local' ? match.homeTeam : match.awayTeam})</span>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-xs text-slate-500 italic block mt-1">Sin goles registrados.</span>
                                )}
                              </div>

                              {/* Cards Info */}
                              <div className="space-y-2">
                                <h4 className="font-bold text-accent flex items-center gap-1.5 text-xs uppercase tracking-wider">
                                  <YellowCardIcon size={12} />
                                  <RedCardIcon size={12} />
                                  <span>Amonestaciones y Expulsiones</span>
                                </h4>
                                {match.cards && match.cards.length > 0 ? (
                                  <div className="flex flex-col gap-1.5 mt-2">
                                    {match.cards.map((c) => (
                                      <div key={c.id} className="text-xs text-slate-300 flex items-center gap-1.5">
                                        <span className="font-semibold text-accent">{c.minute}'</span> • {c.player}
                                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                          c.type === 'amarilla' ? 'bg-yellow-500/10 text-yellow-card' : 'bg-red-500/10 text-red-card'
                                        }`}>
                                          {c.type === 'amarilla' ? 'Amarilla' : 'Roja'}
                                        </span>
                                        {c.reason && <span className="text-[10px] text-muted-text italic">({c.reason})</span>}
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-xs text-slate-500 italic block mt-1">Sin tarjetas mostradas.</span>
                                )}
                              </div>
                            </div>

                            {/* Notes */}
                            {match.notes && (
                              <div className="mt-4 pt-3 border-t border-border/20 text-left">
                                <h5 className="font-semibold text-xs text-slate-400 mb-1">Informe Arbitral / Observaciones:</h5>
                                <p className="text-xs text-slate-300 italic bg-black/10 p-2.5 rounded border border-border/20 max-w-xl">
                                  {match.notes}
                                </p>
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* MOBILE & TABLET ADAPTIVE CARDS VIEW (< 1024px) */}
          <div className="match-cards-mobile" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {filteredMatches.map(match => {
              const isExpanded = expandedMatchId === match.id;
              const isPaid = match.paymentStatus === 'Pagado';

              return (
                <div
                  key={match.id}
                  className="card"
                  style={{
                    padding: '1rem',
                    backgroundColor: 'var(--color-surface)',
                    border: isPaid ? '1px solid var(--color-border)' : '1px solid rgba(245, 158, 11, 0.35)',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem',
                  }}
                >
                  {/* Card Header: Date + Status Badge */}
                  <div className="flex-between" style={{ alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--color-text-muted)' }}>
                      📅 {formatDate(match.date)} {match.time ? `• ${match.time}` : ''}
                    </span>
                    <button
                      onClick={() => togglePaymentStatus(match.id)}
                      style={{
                        minHeight: '44px',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '20px',
                        fontWeight: '700',
                        fontSize: '0.72rem',
                        letterSpacing: '0.05em',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        cursor: 'pointer',
                        border: isPaid ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(245, 158, 11, 0.4)',
                        backgroundColor: isPaid ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                        color: isPaid ? 'var(--color-success)' : 'var(--color-pending)',
                      }}
                      title="Toca para cambiar estado de pago"
                    >
                      {isPaid ? <CheckCircle2 size={13} /> : <Clock size={13} />}
                      <span>{isPaid ? 'PAGADO' : 'PENDIENTE'}</span>
                    </button>
                  </div>

                  {/* Tournament & Category Tag */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                    <span style={{
                      fontSize: '0.75rem',
                      fontWeight: '700',
                      color: 'var(--color-primary)',
                      background: 'rgba(204, 255, 0, 0.08)',
                      padding: '0.15rem 0.5rem',
                      borderRadius: '4px'
                    }}>
                      {match.tournament || 'Torneo General'}
                    </span>
                    <span style={{
                      fontSize: '0.72rem',
                      color: 'var(--color-text-muted)',
                      background: 'rgba(255,255,255,0.05)',
                      padding: '0.15rem 0.45rem',
                      borderRadius: '4px'
                    }}>
                      {match.category ? `Sub-${match.category}` : 'Libre'}
                    </span>
                  </div>

                  {/* Matchup & Central Score Capsule */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.5rem 0.75rem',
                    background: 'rgba(0,0,0,0.2)',
                    borderRadius: 'var(--radius-sm)',
                    gap: '0.5rem'
                  }}>
                    <span style={{ fontWeight: '700', fontSize: '0.95rem', flex: 1, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {match.homeTeam}
                    </span>

                    {/* Stylized Score Capsule */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '0.2rem 0.75rem',
                      borderRadius: '12px',
                      background: 'rgba(16, 185, 129, 0.15)',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      color: 'var(--color-primary)',
                      fontWeight: '800',
                      fontSize: '1rem',
                      letterSpacing: '0.05em'
                    }}>
                      {match.homeGoals} - {match.awayGoals}
                    </div>

                    <span style={{ fontWeight: '700', fontSize: '0.95rem', flex: 1, textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {match.awayTeam}
                    </span>
                  </div>

                  {/* Details Toggle Button */}
                  <button
                    type="button"
                    onClick={() => handleToggleExpand(match.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--color-accent)',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      cursor: 'pointer',
                      padding: '0.25rem 0'
                    }}
                  >
                    <span>{isExpanded ? 'Ocultar detalles' : 'Ver incidencias y notas'}</span>
                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>

                  {/* Expanded Incidents and Notes */}
                  {isExpanded && (
                    <div style={{
                      padding: '0.75rem',
                      backgroundColor: 'rgba(0,0,0,0.15)',
                      borderRadius: 'var(--radius-sm)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.6rem',
                      fontSize: '0.78rem'
                    }}>
                      {/* Goals */}
                      <div>
                        <div style={{ fontWeight: '700', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.25rem' }}>
                          <SoccerBallIcon size={13} />
                          <span>Goleadores:</span>
                        </div>
                        {match.goals && match.goals.length > 0 ? (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                            {match.goals.map(g => (
                              <span key={g.id} style={{ background: 'var(--color-surface)', padding: '0.15rem 0.4rem', borderRadius: '4px', border: '1px solid var(--color-border)' }}>
                                <strong>{g.minute}'</strong> {g.player} ({g.team === 'local' ? 'L' : 'V'})
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted" style={{ fontStyle: 'italic' }}>Sin goles registrados</span>
                        )}
                      </div>

                      {/* Cards */}
                      <div>
                        <div style={{ fontWeight: '700', color: 'var(--color-accent)', display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.25rem' }}>
                          <YellowCardIcon size={12} />
                          <RedCardIcon size={12} />
                          <span>Tarjetas:</span>
                        </div>
                        {match.cards && match.cards.length > 0 ? (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                            {match.cards.map(c => (
                              <span key={c.id} style={{ background: 'var(--color-surface)', padding: '0.15rem 0.4rem', borderRadius: '4px', border: '1px solid var(--color-border)' }}>
                                <strong>{c.minute}'</strong> {c.player} ({c.type}) {c.reason && `- ${c.reason}`}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted" style={{ fontStyle: 'italic' }}>Sin amonestaciones registradas</span>
                        )}
                      </div>

                      {/* Notes */}
                      {match.notes && (
                        <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '0.4rem' }}>
                          <span style={{ fontWeight: '700', color: 'var(--color-text-muted)' }}>Notas: </span>
                          <span style={{ fontStyle: 'italic' }}>{match.notes}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Card Footer: Role, Fee & Touch Action Targets (min 48x48px) */}
                  <div className="flex-between" style={{
                    borderTop: '1px solid var(--color-border)',
                    paddingTop: '0.6rem',
                    alignItems: 'center'
                  }}>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>{match.role || 'Central'}</div>
                      <div style={{ fontWeight: '800', fontSize: '1rem', color: 'var(--color-text)' }}>
                        {formatCurrency(match.fee)}
                      </div>
                    </div>

                    {/* Touch Target Buttons (min 48x48px) */}
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <button
                        onClick={() => generateMatchPDF(match, activeProfile)}
                        style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: 'var(--color-surface-hover)',
                          border: '1px solid var(--color-border)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--color-primary)',
                          cursor: 'pointer'
                        }}
                        aria-label="Descargar PDF del partido"
                        title="Descargar PDF"
                      >
                        <DownloadIcon size={18} />
                      </button>

                      <button
                        onClick={() => onEditMatch(match)}
                        style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: 'var(--color-surface-hover)',
                          border: '1px solid var(--color-border)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--color-text)',
                          cursor: 'pointer'
                        }}
                        aria-label="Editar partido"
                        title="Editar"
                      >
                        <EditIcon size={18} />
                      </button>

                      <button
                        onClick={() => handleDelete(match.id, `${match.homeTeam} vs ${match.awayTeam}`)}
                        style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: 'rgba(255, 42, 95, 0.08)',
                          border: '1px solid rgba(255, 42, 95, 0.2)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--color-red-card)',
                          cursor: 'pointer'
                        }}
                        aria-label="Eliminar partido"
                        title="Eliminar"
                      >
                        <TrashIcon size={18} />
                      </button>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        </>
      )}

      <style>{`
        /* Desktop vs Mobile display switching */
        @media (min-width: 1024px) {
          .matches-table-desktop {
            display: block !important;
          }
          .matches-cards-mobile {
            display: none !important;
          }
          .debt-table-desktop {
            display: block !important;
          }
          .debt-cards-mobile {
            display: none !important;
          }
        }

        @media (max-width: 1023px) {
          .matches-table-desktop {
            display: none !important;
          }
          .matches-cards-mobile {
            display: flex !important;
          }
          .debt-table-desktop {
            display: none !important;
          }
          .debt-cards-mobile {
            display: flex !important;
          }
        }
      `}</style>
    </div>
  );
};

export default MatchList;
