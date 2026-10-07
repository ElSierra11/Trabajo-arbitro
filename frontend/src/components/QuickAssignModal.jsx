import React, { useState, useMemo } from 'react';
import { useRefContext } from '../context/RefContext';
import { CloseIcon, CheckCircle2, WhistleIcon } from './Icons';

const QuickAssignModal = ({ match, isOpen, onClose }) => {
  const { matches, updateMatch } = useRefContext();

  const [homeTeam, setHomeTeam] = useState(match?.homeTeam || '');
  const [awayTeam, setAwayTeam] = useState(match?.awayTeam || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Sincronizar estado cuando se abre para un partido específico
  React.useEffect(() => {
    if (match) {
      setHomeTeam(match.homeTeam || '');
      setAwayTeam(match.awayTeam || '');
      setError('');
    }
  }, [match]);

  // Extraer lista única de equipos previamente utilizados para autocompletado
  const existingTeams = useMemo(() => {
    const set = new Set();
    matches.forEach(m => {
      if (m.homeTeam && m.homeTeam.trim()) set.add(m.homeTeam.trim());
      if (m.awayTeam && m.awayTeam.trim()) set.add(m.awayTeam.trim());
    });
    return Array.from(set).sort();
  }, [matches]);

  if (!isOpen || !match) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!homeTeam.trim() || !awayTeam.trim()) {
      setError('Por favor indica ambos equipos (Local y Visitante).');
      return;
    }

    setSaving(true);
    setError('');
    try {
      await updateMatch(match.id, {
        ...match,
        homeTeam: homeTeam.trim(),
        awayTeam: awayTeam.trim(),
      });
      onClose();
    } catch (err) {
      setError('Error al actualizar equipos. Intenta nuevamente.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 99999 }}>
      <div 
        className="modal-content card" 
        style={{ 
          maxWidth: '480px', 
          width: '95%', 
          padding: '1.5rem',
          borderRadius: 'var(--radius-lg, 16px)',
          border: '1px solid var(--color-border)',
          boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
          animation: 'fadeIn 0.2s ease-out'
        }}
      >
        {/* Header */}
        <div className="flex-between" style={{ marginBottom: '1.25rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '8px',
              background: 'rgba(var(--color-primary-rgb), 0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--color-primary)'
            }}>
              <WhistleIcon size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Asignar Equipos</h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                {match.date} {match.time ? `• ${match.time}` : ''} {match.tournament ? `• ${match.tournament}` : ''}
              </span>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="btn-icon-only" 
            style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--color-text-muted)' }}
            aria-label="Cerrar modal"
          >
            <CloseIcon size={20} />
          </button>
        </div>

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: 'var(--color-red-card)',
            padding: '0.6rem 0.8rem',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.8rem',
            marginBottom: '1rem',
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Datalist para autocompletado */}
          <datalist id="teams-autocomplete">
            {existingTeams.map(t => (
              <option key={t} value={t} />
            ))}
          </datalist>

          <div className="form-group">
            <label className="form-label" htmlFor="quick-homeTeam" style={{ fontSize: '0.85rem' }}>
              Equipo Local *
            </label>
            <input
              type="text"
              id="quick-homeTeam"
              list="teams-autocomplete"
              placeholder="Ej. Real Sociedad FC"
              value={homeTeam}
              onChange={(e) => setHomeTeam(e.target.value)}
              className="form-control"
              autoFocus
              required
            />
          </div>

          <div style={{ textAlign: 'center', fontWeight: '800', color: 'var(--color-primary)', fontSize: '0.85rem' }}>
            VS
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="quick-awayTeam" style={{ fontSize: '0.85rem' }}>
              Equipo Visitante *
            </label>
            <input
              type="text"
              id="quick-awayTeam"
              list="teams-autocomplete"
              placeholder="Ej. Deportivo Córdoba"
              value={awayTeam}
              onChange={(e) => setAwayTeam(e.target.value)}
              className="form-control"
              required
            />
          </div>

          {/* Quick suggestions based on recent teams */}
          {existingTeams.length > 0 && (
            <div style={{ marginTop: '0.25rem' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.35rem' }}>
                Equipos recientes (haz clic para autocompletar):
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', maxHeight: '70px', overflowY: 'auto' }}>
                {existingTeams.slice(0, 6).map(team => (
                  <button
                    key={team}
                    type="button"
                    onClick={() => {
                      if (!homeTeam) setHomeTeam(team);
                      else if (!awayTeam && team !== homeTeam) setAwayTeam(team);
                    }}
                    style={{
                      background: 'var(--color-surface)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '4px',
                      padding: '0.2rem 0.5rem',
                      fontSize: '0.72rem',
                      color: 'var(--color-text)',
                      cursor: 'pointer',
                    }}
                  >
                    + {team}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--color-border)' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={saving}
              style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving}
              style={{ fontSize: '0.85rem', padding: '0.5rem 1.25rem', fontWeight: '700' }}
            >
              {saving ? 'Guardando...' : 'Asignar Equipos'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default QuickAssignModal;
