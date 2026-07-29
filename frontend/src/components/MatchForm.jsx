import React, { useState, useEffect } from 'react';
import { useRefContext } from '../context/RefContext';
import { CloseIcon, CardIcon, SoccerBallIcon } from './Icons';

const CATEGORIES = [
  { value: '2012', label: 'Sub-2012 (Escuela)' },
  { value: '2013', label: 'Sub-2013 (Escuela)' },
  { value: '2014', label: 'Sub-2014 (Escuela)' },
  { value: '2015', label: 'Sub-2015 (Escuela)' },
  { value: '2016', label: 'Sub-2016 (Escuela)' },
  { value: '2017', label: 'Sub-2017 (Escuela)' },
  { value: '2018', label: 'Sub-2018 (Escuela)' },
  { value: '2019', label: 'Sub-2019 (Escuela)' },
  { value: '2020', label: 'Sub-2020 (Escuela)' },
  { value: 'Amateur', label: 'Amateur / Libre' },
  { value: 'Profesional', label: 'Profesional' },
  { value: 'Otro', label: 'Otro' },
];

const ROLES = [
  'Árbitro Central',
  'Asistente / Alterna',
  'Cuarto Árbitro',
];

const MatchForm = ({ isOpen, onClose, editingMatch }) => {
  const { addMatch, updateMatch, deleteMatch, activeProfile } = useRefContext();

  const [formData, setFormData] = useState({
    date: '',
    time: '',
    tournament: '',
    category: '2015',
    homeTeam: '',
    awayTeam: '',
    homeGoals: 0,
    awayGoals: 0,
    yellowCards: 0,
    redCards: 0,
    role: 'Árbitro Central',
    fee: 0,
    paymentStatus: 'Pendiente',
    notes: '',
    goals: [], // Array of { id, player, team: 'local'|'visitante', minute }
    cards: [], // Array of { id, player, type: 'amarilla'|'roja', minute, reason }
  });

  // Local inputs states for adding goals/cards
  const [goalPlayer, setGoalPlayer] = useState('');
  const [goalTeam, setGoalTeam] = useState('local');
  const [goalMinute, setGoalMinute] = useState('');

  const [cardPlayer, setCardPlayer] = useState('');
  const [cardType, setCardType] = useState('amarilla');
  const [cardMinute, setCardMinute] = useState('');
  const [cardReason, setCardReason] = useState('');

  const [errors, setErrors] = useState({});

  // Reset form when modal opens or editingMatch changes
  useEffect(() => {
    if (isOpen) {
      if (editingMatch) {
        setFormData({
          date: editingMatch.date || '',
          time: editingMatch.time || '',
          tournament: editingMatch.tournament || '',
          category: editingMatch.category || '2015',
          homeTeam: editingMatch.homeTeam || '',
          awayTeam: editingMatch.awayTeam || '',
          homeGoals: editingMatch.homeGoals || 0,
          awayGoals: editingMatch.awayGoals || 0,
          yellowCards: editingMatch.yellowCards || 0,
          redCards: editingMatch.redCards || 0,
          role: editingMatch.role || 'Árbitro Central',
          fee: editingMatch.fee || 0,
          paymentStatus: editingMatch.paymentStatus || 'Pendiente',
          notes: editingMatch.notes || '',
          goals: editingMatch.goals || [],
          cards: editingMatch.cards || [],
        });
      } else {
        setFormData({
          date: new Date().toISOString().slice(0, 10),
          time: '',
          tournament: '',
          category: '2015',
          homeTeam: '',
          awayTeam: '',
          homeGoals: 0,
          awayGoals: 0,
          yellowCards: 0,
          redCards: 0,
          role: 'Árbitro Central',
          fee: activeProfile ? activeProfile.defaultFee : 0,
          paymentStatus: 'Pendiente',
          notes: '',
          goals: [],
          cards: [],
        });
      }
      setGoalPlayer('');
      setGoalTeam('local');
      setGoalMinute('');
      setCardPlayer('');
      setCardType('amarilla');
      setCardMinute('');
      setCardReason('');
      setErrors({});
    }
  }, [isOpen, editingMatch, activeProfile]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleNumericChange = (e) => {
    const { name, value } = e.target;
    const numValue = Math.max(0, parseInt(value, 10) || 0);
    setFormData((prev) => ({
      ...prev,
      [name]: numValue,
    }));
  };

  // Dynamic Goals Handlers
  const handleAddGoal = (e) => {
    e.preventDefault();
    if (!goalPlayer.trim() || !goalMinute) return;

    const newGoal = {
      id: `goal-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      player: goalPlayer.trim(),
      team: goalTeam,
      minute: Number(goalMinute),
    };

    setFormData((prev) => {
      const updatedGoals = [...prev.goals, newGoal].sort((a, b) => a.minute - b.minute);
      const homeCount = updatedGoals.filter(g => g.team === 'local').length;
      const awayCount = updatedGoals.filter(g => g.team === 'visitante').length;
      
      return {
        ...prev,
        goals: updatedGoals,
        homeGoals: Math.max(prev.homeGoals, homeCount),
        awayGoals: Math.max(prev.awayGoals, awayCount)
      };
    });

    setGoalPlayer('');
    setGoalMinute('');
  };

  const handleRemoveGoal = (goalId) => {
    setFormData((prev) => {
      const updatedGoals = prev.goals.filter(g => g.id !== goalId);
      const homeCount = updatedGoals.filter(g => g.team === 'local').length;
      const awayCount = updatedGoals.filter(g => g.team === 'visitante').length;

      return {
        ...prev,
        goals: updatedGoals,
        homeGoals: Math.min(prev.homeGoals, homeCount),
        awayGoals: Math.min(prev.awayGoals, awayCount)
      };
    });
  };

  // Dynamic Cards Handlers
  const handleAddCard = (e) => {
    e.preventDefault();
    if (!cardPlayer.trim() || !cardMinute) return;

    const newCard = {
      id: `card-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      player: cardPlayer.trim(),
      type: cardType,
      minute: Number(cardMinute),
      reason: cardReason.trim(),
    };

    setFormData((prev) => {
      const updatedCards = [...prev.cards, newCard].sort((a, b) => a.minute - b.minute);
      const yellowCount = updatedCards.filter(c => c.type === 'amarilla').length;
      const redCount = updatedCards.filter(c => c.type === 'roja').length;

      return {
        ...prev,
        cards: updatedCards,
        yellowCards: yellowCount,
        redCards: redCount
      };
    });

    setCardPlayer('');
    setCardMinute('');
    setCardReason('');
  };

  const handleRemoveCard = (cardId) => {
    setFormData((prev) => {
      const updatedCards = prev.cards.filter(c => c.id !== cardId);
      const yellowCount = updatedCards.filter(c => c.type === 'amarilla').length;
      const redCount = updatedCards.filter(c => c.type === 'roja').length;

      return {
        ...prev,
        cards: updatedCards,
        yellowCards: yellowCount,
        redCards: redCount
      };
    });
  };

  const validate = () => {
    const tempErrors = {};
    if (!formData.date) tempErrors.date = 'La fecha es obligatoria';
    if (!formData.homeTeam.trim()) tempErrors.homeTeam = 'El equipo local es obligatorio';
    if (!formData.awayTeam.trim()) tempErrors.awayTeam = 'El equipo visitante es obligatorio';
    if (formData.fee < 0) tempErrors.fee = 'La tarifa no puede ser negativa';
    
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    if (editingMatch) {
      updateMatch(editingMatch.id, formData);
    } else {
      addMatch(formData);
    }
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content max-w-2xl">
        <div className="modal-header">
          <h3 className="text-xl font-bold">
            {editingMatch ? 'Editar Partido' : 'Registrar Partido'}
          </h3>
          <button 
            type="button"
            className="btn-icon-only rounded-full" 
            onClick={onClose} 
            aria-label="Cerrar"
          >
            <CloseIcon size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body max-h-[75vh] overflow-y-auto space-y-5">
            
            {/* Date and Time Row */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="date">Fecha *</label>
                <input 
                  type="date" 
                  id="date" 
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  className={`form-control ${errors.date ? 'border-red-card' : ''}`}
                />
                {errors.date && <span className="text-xs text-red-card">{errors.date}</span>}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="time">Hora</label>
                <input 
                  type="time" 
                  id="time" 
                  name="time"
                  value={formData.time}
                  onChange={handleChange}
                  className="form-control"
                />
              </div>
            </div>

            {/* Tournament and Category Row */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="tournament">Torneo / Liga</label>
                <input 
                  type="text" 
                  id="tournament" 
                  name="tournament"
                  placeholder="Ej. Torneo de Liga COARC"
                  value={formData.tournament}
                  onChange={handleChange}
                  className="form-control"
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="category">Categoría</label>
                <select 
                  id="category" 
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="form-control"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Teams Row */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="homeTeam">Equipo Local *</label>
                <input 
                  type="text" 
                  id="homeTeam" 
                  name="homeTeam"
                  placeholder="Ej. Atlético Nacional"
                  value={formData.homeTeam}
                  onChange={handleChange}
                  className="form-control"
                  style={{ borderColor: errors.homeTeam ? 'var(--color-red-card)' : '' }}
                />
                {errors.homeTeam && <span className="text-xs text-red-card">{errors.homeTeam}</span>}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="awayTeam">Equipo Visitante *</label>
                <input 
                  type="text" 
                  id="awayTeam" 
                  name="awayTeam"
                  placeholder="Ej. Millonarios"
                  value={formData.awayTeam}
                  onChange={handleChange}
                  className="form-control"
                  style={{ borderColor: errors.awayTeam ? 'var(--color-red-card)' : '' }}
                />
                {errors.awayTeam && <span className="text-xs text-red-card">{errors.awayTeam}</span>}
              </div>
            </div>

            {/* Marcador Final Goals (Autocalculated but editable) */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Marcador Local</label>
                <input 
                  type="number" 
                  name="homeGoals"
                  min="0"
                  value={formData.homeGoals}
                  onChange={handleNumericChange}
                  className="form-control font-bold"
                  placeholder="0"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Marcador Visitante</label>
                <input 
                  type="number" 
                  name="awayGoals"
                  min="0"
                  value={formData.awayGoals}
                  onChange={handleNumericChange}
                  className="form-control font-bold"
                  placeholder="0"
                />
              </div>
            </div>

            {/* SECTION: DINAMIC GOAL SCORERS */}
            <div className="border border-border rounded-lg p-4 bg-slate-900/30 space-y-3">
              <h4 className="font-bold text-sm text-primary uppercase tracking-wider">Goleadores del Encuentro</h4>
              
              {/* Dynamic Goal Adder Fields */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-2 items-end">
                <div className="md:col-span-2 flex flex-col gap-1">
                  <span className="text-xs text-muted">Nombre del Jugador</span>
                  <input 
                    type="text" 
                    placeholder="Ej. Andrés Pérez" 
                    value={goalPlayer}
                    onChange={(e) => setGoalPlayer(e.target.value)}
                    className="form-control py-1 px-2 text-sm"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-muted">Minuto</span>
                  <input 
                    type="number" 
                    placeholder="Ej. 14"
                    min="1"
                    max="120"
                    value={goalMinute}
                    onChange={(e) => setGoalMinute(e.target.value)}
                    className="form-control py-1 px-2 text-sm"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-muted">Equipo</span>
                  <select 
                    value={goalTeam}
                    onChange={(e) => setGoalTeam(e.target.value)}
                    className="form-control py-1 px-2 text-sm"
                  >
                    <option value="local">Local</option>
                    <option value="visitante">Visitante</option>
                  </select>
                </div>
              </div>
              <button 
                type="button" 
                onClick={handleAddGoal}
                className="btn btn-secondary py-1 text-xs font-bold flex items-center justify-center gap-1"
                style={{ marginTop: '0.75rem' }}
              >
                <SoccerBallIcon size={14} className="text-primary" />
                <span>Agregar Gol</span>
              </button>

              {/* Goals List Display */}
              {formData.goals.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {formData.goals.map((g) => (
                    <div 
                      key={g.id} 
                      className="bg-slate-800 text-xs px-3 py-1.5 rounded-md border border-border flex items-center gap-2"
                    >
                      <span className="font-semibold text-primary">{g.minute}'</span>
                      <span>{g.player} ({g.team === 'local' ? 'L' : 'V'})</span>
                      <button 
                        type="button" 
                        onClick={() => handleRemoveGoal(g.id)}
                        className="text-red-card font-bold hover:text-white px-1 ml-1"
                        title="Eliminar gol"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Total Cards counter (Autocalculated but editable) */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label" style={{ color: 'var(--color-yellow-card)' }}>Total Amarillas (Autocalculado)</label>
                <input 
                  type="number" 
                  name="yellowCards"
                  min="0"
                  value={formData.yellowCards}
                  onChange={handleNumericChange}
                  className="form-control bg-slate-900/40 text-yellow-card font-bold"
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ color: 'var(--color-red-card)' }}>Total Rojas (Autocalculado)</label>
                <input 
                  type="number" 
                  name="redCards"
                  min="0"
                  value={formData.redCards}
                  onChange={handleNumericChange}
                  className="form-control bg-slate-900/40 text-red-card font-bold"
                />
              </div>
            </div>

            {/* SECTION: DINAMIC CARDS LIST */}
            <div className="border border-border rounded-lg p-4 bg-slate-900/30 space-y-3">
              <h4 className="font-bold text-sm text-accent uppercase tracking-wider">Amonestaciones y Expulsiones</h4>
              
              {/* Dynamic Card Adder Fields */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-2 items-end">
                <div className="md:col-span-2 flex flex-col gap-1">
                  <span className="text-xs text-muted">Nombre del Jugador</span>
                  <input 
                    type="text" 
                    placeholder="Ej. Pedro Gómez" 
                    value={cardPlayer}
                    onChange={(e) => setCardPlayer(e.target.value)}
                    className="form-control py-1 px-2 text-sm"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-muted">Minuto</span>
                  <input 
                    type="number" 
                    placeholder="Ej. 44"
                    min="1"
                    max="120"
                    value={cardMinute}
                    onChange={(e) => setCardMinute(e.target.value)}
                    className="form-control py-1 px-2 text-sm"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-muted">Tarjeta</span>
                  <select 
                    value={cardType}
                    onChange={(e) => setCardType(e.target.value)}
                    className="form-control py-1 px-2 text-sm"
                  >
                    <option value="amarilla">Tarjeta Amarilla</option>
                    <option value="roja">Tarjeta Roja</option>
                  </select>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted">Motivo / Causa de la Tarjeta</span>
                <input 
                  type="text" 
                  placeholder="Ej. Falta temeraria, protestas verbales, juego brusco grave..." 
                  value={cardReason}
                  onChange={(e) => setCardReason(e.target.value)}
                  className="form-control py-1 px-2 text-sm"
                />
              </div>
              <button 
                type="button" 
                onClick={handleAddCard}
                className="btn btn-secondary py-1 text-xs font-bold flex items-center justify-center gap-1"
                style={{ marginTop: '0.75rem' }}
              >
                <CardIcon size={14} color="var(--color-yellow-card)" />
                <span>Agregar Tarjeta</span>
              </button>

              {/* Cards List Display */}
              {formData.cards.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {formData.cards.map((c) => (
                    <div 
                      key={c.id} 
                      className={`text-xs px-3 py-1.5 rounded-md border flex items-center gap-2 ${
                        c.type === 'amarilla' 
                          ? 'bg-yellow-500/10 text-yellow-card border-yellow-500/25' 
                          : 'bg-red-500/10 text-red-card border-red-500/25'
                      }`}
                    >
                      <span className="font-bold">{c.minute}'</span>
                      <span>{c.player}</span>
                      {c.reason && <span className="opacity-75">({c.reason})</span>}
                      <button 
                        type="button" 
                        onClick={() => handleRemoveCard(c.id)}
                        className="text-red-card font-bold hover:text-white px-1 ml-1"
                        title="Eliminar tarjeta"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Role, Fee and Payment Status */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="role">Rol Arbitral</label>
                <select 
                  id="role" 
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="form-control"
                >
                  {ROLES.map(role => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="paymentStatus">Estado del Pago</label>
                <select 
                  id="paymentStatus" 
                  name="paymentStatus"
                  value={formData.paymentStatus}
                  onChange={handleChange}
                  className="form-control"
                >
                  <option value="Pendiente">Pendiente (Por cobrar)</option>
                  <option value="Pagado">Pagado (Ya cobrado)</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="fee">Tarifa / Pago Cobrado ($ COP)</label>
              <input 
                type="number" 
                id="fee" 
                name="fee"
                min="0"
                step="500"
                placeholder="Tarifa recibida"
                value={formData.fee}
                onChange={handleNumericChange}
                className="form-control text-accent font-bold"
                style={{ borderColor: 'rgba(0, 240, 255, 0.3)' }}
              />
            </div>

            {/* Notes / Incidents */}
            <div className="form-group">
              <label className="form-label" htmlFor="notes">Incidencias / Notas del Partido</label>
              <textarea 
                id="notes" 
                name="notes"
                rows="3"
                placeholder="Ej: Expulsión por doble amarilla. Tarjeta roja directa por conducta violenta. Cancha húmeda..."
                value={formData.notes}
                onChange={handleChange}
                className="form-control"
                style={{ resize: 'vertical' }}
              />
            </div>
            
          </div>

          <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {editingMatch ? (
              <button 
                type="button" 
                className="btn" 
                style={{ 
                  backgroundColor: 'rgba(239, 68, 68, 0.1)', 
                  color: 'var(--color-red-card)', 
                  border: '1px solid rgba(239, 68, 68, 0.3)' 
                }}
                onClick={() => {
                  if (window.confirm(`¿Estás seguro de eliminar el partido "${formData.homeTeam || 'Local'} vs ${formData.awayTeam || 'Visitante'}"?`)) {
                    deleteMatch(editingMatch.id);
                    onClose();
                  }
                }}
              >
                Eliminar Partido
              </button>
            ) : <div />}
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={onClose}
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                className="btn btn-primary"
              >
                {editingMatch ? 'Guardar Cambios' : 'Registrar Partido'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MatchForm;
