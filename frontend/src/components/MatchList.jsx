import React, { useState, useMemo } from 'react';
import { useRefContext } from '../context/RefContext';
import { 
  TrashIcon, 
  EditIcon, 
  WhistleIcon, 
  CardIcon, 
  PlusIcon,
  SoccerBallIcon,
  DownloadIcon
} from './Icons';
import { generateMatchPDF } from '../utils/pdfGenerator';
import { exportMatchesToPDF, exportMatchesToExcel } from '../utils/exportUtils';

// Format currency helper
const formatCurrency = (val) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(val);
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
  const { matches, deleteMatch, togglePaymentStatus } = useRefContext();

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
    return Array.from(months).sort().reverse(); // Show latest months first
  }, [matches]);

  // Apply filters
  const filteredMatches = useMemo(() => {
    return matches.filter(match => {
      // 1. Search Query
      const home = match.homeTeam.toLowerCase();
      const away = match.awayTeam.toLowerCase();
      const tournament = match.tournament.toLowerCase();
      const query = search.toLowerCase();
      const matchesSearch = home.includes(query) || away.includes(query) || tournament.includes(query);

      // 2. Status Filter
      const matchesStatus = statusFilter === 'Todos' || match.paymentStatus === statusFilter;

      // 3. Role Filter
      const matchesRole = roleFilter === 'Todos' || match.role === roleFilter;

      // 4. Month Filter
      const matchesMonth = monthFilter === 'Todos' || (match.date && match.date.startsWith(monthFilter));

      return matchesSearch && matchesStatus && matchesRole && matchesMonth;
    });
  }, [matches, search, statusFilter, roleFilter, monthFilter]);

  // Total earnings for the current filtered matches
  const filteredTotals = useMemo(() => {
    let total = 0;
    let paid = 0;
    let pending = 0;
    filteredMatches.forEach(m => {
      total += m.fee;
      if (m.paymentStatus === 'Pagado') {
        paid += m.fee;
      } else {
        pending += m.fee;
      }
    });
    return { total, paid, pending };
  }, [filteredMatches]);

  const handleDelete = (id, teams) => {
    if (window.confirm(`¿Estás seguro de eliminar el partido "${teams}" de los registros?`)) {
      deleteMatch(id);
    }
  };

  const handleToggleExpand = (id) => {
    setExpandedMatchId(expandedMatchId === id ? null : id);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Search and Filters Card */}
      <div className="card">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Search Row */}
          <div>
            <input 
              type="text"
              placeholder="Buscar por equipos o liga/torneo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-control animate-none"
              style={{ backgroundColor: 'rgba(0,0,0,0.15)' }}
            />
          </div>

          {/* Filters Row */}
          <div className="form-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.8rem' }}>Estado de Pago</label>
              <select 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)}
                className="form-control text-sm py-2 px-3"
              >
                <option value="Todos">Todos los pagos</option>
                <option value="Pagado">Pagados (Cobrado)</option>
                <option value="Pendiente">Pendientes (Por cobrar)</option>
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.8rem' }}>Rol de Árbitro</label>
              <select 
                value={roleFilter} 
                onChange={(e) => setRoleFilter(e.target.value)}
                className="form-control text-sm py-2 px-3"
              >
                <option value="Todos">Todos los roles</option>
                <option value="Árbitro Central">Árbitro Central</option>
                <option value="Asistente / Alterna">Asistente / Alterna</option>
                <option value="Cuarto Árbitro">Cuarto Árbitro</option>
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.8rem' }}>Mes del Encuentro</label>
              <select 
                value={monthFilter} 
                onChange={(e) => setMonthFilter(e.target.value)}
                className="form-control text-sm py-2 px-3"
              >
                <option value="Todos">Todos los meses</option>
                {uniqueMonths.map(ym => (
                  <option key={ym} value={ym}>{getMonthLabel(ym)}</option>
                ))}
              </select>
            </div>

          </div>

        </div>
      </div>

      {/* Filtered Summary Panel */}
      {filteredMatches.length > 0 && (
        <div className="card" style={{ 
          padding: '1rem 1.5rem', 
          backgroundColor: 'rgba(0,0,0,0.15)', 
          borderLeft: '4px solid var(--color-accent)'
        }}>
          <div className="flex-between" style={{ flexWrap: 'wrap', gap: '1rem' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>
              Encontrados: <span style={{ color: 'var(--color-accent)' }}>{filteredMatches.length} partidos</span>
            </span>
            <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', flexWrap: 'wrap', fontSize: '0.88rem' }}>
              <span>
                Total: <strong style={{ color: 'var(--color-text)' }}>{formatCurrency(filteredTotals.total)}</strong>
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
                  style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                  onClick={() => exportMatchesToPDF(filteredMatches)}
                  title="Descargar reporte oficial de partidos en PDF"
                >
                  <DownloadIcon size={14} />
                  <span>PDF</span>
                </button>
                <button 
                  className="btn btn-secondary"
                  style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                  onClick={() => exportMatchesToExcel(filteredMatches)}
                  title="Descargar hoja de cálculo Excel"
                >
                  <DownloadIcon size={14} />
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
          <button className="btn btn-primary" style={{ marginTop: '1.5rem' }} onClick={onAddMatch}>
            <PlusIcon size={18} />
            <span>Registrar Partido</span>
          </button>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="matches-table-container" style={{ display: window.innerWidth > 768 ? 'block' : 'none' }}>
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
                            Sub-{match.category}
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
                                <CardIcon color="var(--color-yellow-card)" size={14} />
                                <span style={{ fontSize: '0.8rem', fontWeight: '700' }}>{match.yellowCards}</span>
                              </div>
                            )}
                            {match.redCards > 0 && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }} title={`${match.redCards} Rojas`}>
                                <CardIcon color="var(--color-red-card)" size={14} />
                                <span style={{ fontSize: '0.8rem', fontWeight: '700' }}>{match.redCards}</span>
                              </div>
                            )}
                            {match.yellowCards === 0 && match.redCards === 0 && <span style={{ opacity: 0.3 }}>-</span>}
                          </div>
                        </td>
                        <td>
                          <span className={`badge ${match.role === 'Árbitro Central' ? 'badge-central' : 'badge-assistant'}`}>
                            {match.role === 'Árbitro Central' ? 'Central' : 'Asistente'}
                          </span>
                        </td>
                        <td style={{ fontWeight: '700' }}>{formatCurrency(match.fee)}</td>
                        <td>
                          <button 
                            className={`badge ${match.paymentStatus === 'Pagado' ? 'badge-paid' : 'badge-pending'}`}
                            style={{ cursor: 'pointer', border: '1px solid currentColor' }}
                            onClick={(e) => { e.stopPropagation(); togglePaymentStatus(match.id); }}
                            title="Alternar estado de pago"
                          >
                            {match.paymentStatus}
                          </button>
                        </td>
                        <td style={{ textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                            <button 
                              className="btn-icon-only" 
                              onClick={() => generateMatchPDF(match, activeProfile)}
                              title="Exportar planilla PDF"
                              style={{ color: 'var(--color-primary)', borderColor: 'rgba(0,200,100,0.2)' }}
                            >
                              <DownloadIcon size={16} />
                            </button>
                            <button 
                              className="btn-icon-only" 
                              onClick={() => onEditMatch(match)}
                              title="Editar partido"
                            >
                              <EditIcon size={16} />
                            </button>
                            <button 
                              className="btn-icon-only" 
                              onClick={() => handleDelete(match.id, `${match.homeTeam} vs ${match.awayTeam}`)}
                              title="Eliminar partido"
                              style={{ borderColor: 'rgba(255, 42, 95, 0.2)', color: 'var(--color-red-card)' }}
                            >
                              <TrashIcon size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                      {/* Expanded Section inside Table */}
                      {isExpanded && (
                        <tr className="bg-slate-950/40">
                          <td colSpan="10" className="p-4 border-b border-border/40">
                            <div className="grid grid-cols-2 gap-6 text-sm text-left">
                              
                              {/* Scorers info */}
                              <div className="space-y-2 border-r border-border/30 pr-4">
                                <h4 className="font-bold text-primary flex items-center gap-1.5 text-xs uppercase tracking-wider">
                                  <SoccerBallIcon size={14} className="text-primary" />
                                  <span>Goleadores del Partido</span>
                                </h4>
                                {match.goals && match.goals.length > 0 ? (
                                  <div className="flex flex-col gap-1.5 mt-2">
                                    {match.goals.map((g) => (
                                      <div key={g.id} className="text-xs text-slate-300">
                                        <span className="font-semibold text-primary">{g.minute}'</span> • {g.player} <span className="text-[10px] text-muted-text bg-slate-800 px-1.5 py-0.5 rounded ml-1">{g.team === 'local' ? 'Local' : 'Visitante'}</span>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-xs text-slate-500 italic block mt-1">Sin goleadores registrados.</span>
                                )}
                              </div>

                              {/* Cards info */}
                              <div className="space-y-2">
                                <h4 className="font-bold text-accent flex items-center gap-1.5 text-xs uppercase tracking-wider">
                                  <CardIcon size={12} color="var(--color-yellow-card)" />
                                  <CardIcon size={12} color="var(--color-red-card)" />
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

                            {/* Observaciones / Notes */}
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

          {/* Mobile Card List View (Responsive wrapper) */}
          <div className="match-card-list" style={{ display: window.innerWidth <= 768 ? 'flex' : 'none' }}>
            {filteredMatches.map(match => {
              const isExpanded = expandedMatchId === match.id;
              return (
                <div key={match.id} className="match-item flex flex-col items-stretch gap-3">
                  <div className="flex-between">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span className={`badge ${match.role === 'Árbitro Central' ? 'badge-central' : 'badge-assistant'}`}>
                        {match.role}
                      </span>
                      <span className="badge" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}>
                        Sub-{match.category}
                      </span>
                    </div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                      {formatDate(match.date)}
                    </span>
                  </div>

                  <div style={{ fontSize: '1.05rem', fontWeight: '700', padding: '0.25rem 0' }}>
                    {match.homeTeam} <span style={{ color: 'var(--color-primary)' }}>{match.homeGoals}</span> - <span style={{ color: 'var(--color-primary)' }}>{match.awayGoals}</span> {match.awayTeam}
                  </div>

                  {match.tournament && (
                    <div className="text-muted" style={{ fontSize: '0.8rem' }}>
                      Liga/Torneo: {match.tournament}
                    </div>
                  )}

                  {/* Mobile toggle detail button */}
                  <div>
                    <button 
                      type="button"
                      className="text-xs text-primary font-semibold hover:underline"
                      onClick={() => handleToggleExpand(match.id)}
                    >
                      {isExpanded ? 'Ocultar detalles ▲' : 'Ver goleadores y tarjetas ▼'}
                    </button>
                  </div>

                  {/* Expanded Section inside Mobile Card */}
                  {isExpanded && (
                    <div className="pt-2.5 border-t border-border/40 space-y-3 text-left">
                      
                      {/* Scorers */}
                      <div>
                        <span className="text-[10px] text-primary uppercase font-bold tracking-wider flex items-center gap-1">
                          <SoccerBallIcon size={12} className="text-primary" />
                          <span>Goleadores</span>
                        </span>
                        {match.goals && match.goals.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            {match.goals.map((g) => (
                              <span key={g.id} className="bg-slate-800 border border-border/30 text-xs px-2 py-0.5 rounded text-slate-300">
                                <strong className="text-primary">{g.minute}'</strong> {g.player} ({g.team === 'local' ? 'L' : 'V'})
                              </span>
                            ))}
                          </div>
                        ) : (
                          <div className="text-xs text-slate-500 italic mt-0.5">Sin goles registrados</div>
                        )}
                      </div>

                      {/* Cards */}
                      <div>
                        <span className="text-[10px] text-accent uppercase font-bold tracking-wider flex items-center gap-1">
                          <CardIcon size={10} color="var(--color-yellow-card)" />
                          <CardIcon size={10} color="var(--color-red-card)" />
                          <span>Tarjetas</span>
                        </span>
                        {match.cards && match.cards.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            {match.cards.map((c) => (
                              <span key={c.id} className={`border text-xs px-2 py-0.5 rounded flex items-center gap-1 ${
                                c.type === 'amarilla' 
                                  ? 'bg-yellow-500/10 text-yellow-card border-yellow-500/25' 
                                  : 'bg-red-500/10 text-red-card border-red-500/25'
                              }`}>
                                <strong>{c.minute}'</strong> {c.player} {c.reason && `(${c.reason})`}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <div className="text-xs text-slate-500 italic mt-0.5">Sin amonestaciones registradas</div>
                        )}
                      </div>

                    </div>
                  )}

                  <div className="flex-between" style={{ borderTop: '1px solid var(--color-border)', paddingTop: '0.75rem', marginTop: '0.25rem' }}>
                    {/* Card counters */}
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                      {match.yellowCards > 0 && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '2px', fontSize: '0.8rem' }}>
                          <CardIcon color="var(--color-yellow-card)" size={14} /> {match.yellowCards}
                        </span>
                      )}
                      {match.redCards > 0 && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '2px', fontSize: '0.8rem' }}>
                          <CardIcon color="var(--color-red-card)" size={14} /> {match.redCards}
                        </span>
                      )}
                    </div>

                    {/* Pricing and Actions */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span style={{ fontWeight: '700', fontSize: '0.95rem' }}>{formatCurrency(match.fee)}</span>
                        <button 
                          className={`badge ${match.paymentStatus === 'Pagado' ? 'badge-paid' : 'badge-pending'}`}
                          style={{ cursor: 'pointer', border: '1px solid currentColor', padding: '0.15rem 0.5rem', fontSize: '0.7rem' }}
                          onClick={(e) => { e.stopPropagation(); togglePaymentStatus(match.id); }}
                        >
                          {match.paymentStatus}
                        </button>
                      </div>

                      <button 
                        className="btn-icon-only" 
                        onClick={() => generateMatchPDF(match, activeProfile)}
                        title="Exportar PDF"
                        style={{ color: 'var(--color-primary)', borderColor: 'rgba(0,200,100,0.15)' }}
                      >
                        <DownloadIcon size={14} />
                      </button>
                      <button className="btn-icon-only" onClick={() => onEditMatch(match)}>
                        <EditIcon size={14} />
                      </button>
                      <button 
                        className="btn-icon-only" 
                        onClick={() => handleDelete(match.id, `${match.homeTeam} vs ${match.awayTeam}`)}
                        style={{ color: 'var(--color-red-card)', borderColor: 'rgba(255,42,95,0.1)' }}
                      >
                        <TrashIcon size={14} />
                      </button>
                    </div>
                  </div>

                  {match.notes && !isExpanded && (
                    <div className="bg-black/20 p-2 rounded text-xs text-slate-400 italic text-left border-l-2 border-border mt-1">
                      {match.notes}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

    </div>
  );
};

export default MatchList;
