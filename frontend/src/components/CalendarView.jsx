import React, { useState, useMemo } from 'react';
import { useRefContext } from '../context/RefContext';
import { ChevronLeft, ChevronRight, PlusIcon, EditIcon, WhistleIcon } from './Icons';
import BottomSheet from './BottomSheet';

const formatCurrency = (val) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(val || 0);

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const CalendarView = ({ onAddMatch, onEditMatch }) => {
  const { activeMatches } = useRefContext();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDayMatches, setSelectedDayMatches] = useState(null);
  const [selectedDateStr, setSelectedDateStr] = useState('');

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const today = () => setCurrentDate(new Date());

  // Days matrix for current month
  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    let startDayOfWeek = firstDay.getDay() - 1; // 0 for Mon
    if (startDayOfWeek === -1) startDayOfWeek = 6; // Sunday -> 6

    const totalDays = lastDay.getDate();
    const days = [];

    // Padding previous month
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      days.push({ day: prevMonthLastDay - i, isCurrentMonth: false, dateStr: '' });
    }

    // Days of current month
    for (let d = 1; d <= totalDays; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({ day: d, isCurrentMonth: true, dateStr });
    }

    // Fill up to 35 or 42 cells
    const remaining = 35 - days.length > 0 ? 35 - days.length : (42 - days.length > 0 ? 42 - days.length : 0);
    for (let i = 1; i <= remaining; i++) {
      days.push({ day: i, isCurrentMonth: false, dateStr: '' });
    }

    return days;
  }, [year, month]);

  // Group matches by YYYY-MM-DD
  const matchesByDate = useMemo(() => {
    const map = {};
    activeMatches.forEach(m => {
      if (!m.date) return;
      if (!map[m.date]) map[m.date] = [];
      map[m.date].push(m);
    });
    return map;
  }, [activeMatches]);

  const todayStr = new Date().toISOString().slice(0, 10);

  const handleDayClick = (cell, dayMatches) => {
    if (!cell.isCurrentMonth || !cell.dateStr) return;
    if (window.innerWidth < 768) {
      // On mobile, open the bottom sheet for any day (to add or see matches)
      setSelectedDayMatches(dayMatches);
      setSelectedDateStr(cell.dateStr);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Calendar Header Controls */}
      <div className="card flex-between" style={{ flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', margin: 0 }}>
            {MONTH_NAMES[month]} <span style={{ color: 'var(--color-primary)' }}>{year}</span>
          </h2>
          <p className="text-muted" style={{ fontSize: '0.8rem', marginTop: '0.2rem' }}>
            Partidos programados y disputados del mes
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            className="btn btn-secondary"
            style={{ padding: '0.4rem 0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
            onClick={prevMonth}
            aria-label="Mes Anterior"
          >
            <ChevronLeft size={16} />
            <span>Mes Anterior</span>
          </button>
          <button className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem' }} onClick={today}>
            Hoy
          </button>
          <button
            className="btn btn-secondary"
            style={{ padding: '0.4rem 0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
            onClick={nextMonth}
            aria-label="Mes Siguiente"
          >
            <span>Mes Siguiente</span>
            <ChevronRight size={16} />
          </button>
          <button
            className="btn btn-primary"
            style={{ padding: '0.4rem 0.8rem', marginLeft: '0.25rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
            onClick={onAddMatch}
          >
            <PlusIcon size={16} />
            <span>Agendar Partido</span>
          </button>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="card" style={{ padding: '1rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', textAlign: 'center', fontWeight: '700', fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
          <div>LUN</div><div>MAR</div><div>MIÉ</div><div>JUE</div><div>VIE</div><div>SÁB</div><div>DOM</div>
        </div>

        {/* Days Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px' }}>
          {calendarDays.map((cell, idx) => {
            const dayMatches = cell.dateStr ? matchesByDate[cell.dateStr] || [] : [];
            const isToday = cell.dateStr === todayStr;
            const hasMatches = dayMatches.length > 0;

            return (
              <div
                key={idx}
                onClick={() => handleDayClick(cell, dayMatches)}
                className={`calendar-cell ${hasMatches ? 'has-matches' : ''}`}
                style={{
                  minHeight: '85px',
                  backgroundColor: cell.isCurrentMonth
                    ? (isToday ? 'rgba(0,200,100,0.08)' : 'var(--color-surface)')
                    : 'rgba(0,0,0,0.04)',
                  border: isToday ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.4rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.2rem',
                  opacity: cell.isCurrentMonth ? 1 : 0.45,
                  cursor: cell.isCurrentMonth ? 'pointer' : 'default',
                  transition: 'background-color 0.15s',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{
                    fontSize: '0.8rem',
                    fontWeight: isToday ? '800' : '600',
                    color: isToday ? 'var(--color-primary)' : 'var(--color-text)',
                  }}>
                    {cell.day}
                  </span>

                  {/* Desktop match count badge */}
                  {hasMatches && (
                    <span className="desktop-match-count" style={{ fontSize: '0.65rem', background: 'var(--color-surface-hover)', borderRadius: '3px', padding: '0.05rem 0.3rem', color: 'var(--color-text-muted)' }}>
                      {dayMatches.length}
                    </span>
                  )}
                </div>

                {/* MOBILE VIEW: Indicator Dots (< 768px) */}
                <div className="calendar-dots-mobile" style={{ display: 'none', gap: '3px', marginTop: 'auto', flexWrap: 'wrap', justifyContent: 'center' }}>
                  {dayMatches.slice(0, 4).map((m, i) => (
                    <span
                      key={m.id || i}
                      style={{
                        width: '7px',
                        height: '7px',
                        borderRadius: '50%',
                        backgroundColor: m.paymentStatus === 'Pagado' ? 'var(--color-success)' : 'var(--color-pending)',
                        display: 'inline-block'
                      }}
                    />
                  ))}
                  {dayMatches.length > 4 && (
                    <span style={{ fontSize: '0.6rem', color: 'var(--color-text-muted)', fontWeight: 'bold' }}>+</span>
                  )}
                </div>

                {/* DESKTOP VIEW: Full match tags (>= 768px) */}
                <div className="calendar-tags-desktop" style={{ display: 'flex', flexDirection: 'column', gap: '3px', overflowY: 'auto', maxHeight: '75px' }}>
                  {dayMatches.map(m => (
                    <div
                      key={m.id}
                      onClick={(e) => { e.stopPropagation(); onEditMatch(m); }}
                      title={`${m.homeTeam} vs ${m.awayTeam} - ${formatCurrency(m.fee)}`}
                      style={{
                        padding: '0.2rem 0.35rem',
                        borderRadius: '3px',
                        fontSize: '0.7rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        background: m.paymentStatus === 'Pagado' ? 'rgba(0,200,100,0.15)' : 'rgba(245,158,11,0.15)',
                        color: m.paymentStatus === 'Pagado' ? 'var(--color-primary)' : 'var(--color-pending)',
                        borderLeft: `3px solid ${m.paymentStatus === 'Pagado' ? 'var(--color-primary)' : 'var(--color-pending)'}`,
                      }}
                    >
                      {m.homeTeam || 'Local'} vs {m.awayTeam || 'Visitante'}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* MOBILE BOTTOM SHEET FOR DAY MATCHES */}
      <BottomSheet
        isOpen={Boolean(selectedDayMatches)}
        onClose={() => setSelectedDayMatches(null)}
        title={`Partidos del ${selectedDateStr}`}
        subtitle={`${selectedDayMatches?.length || 0} ${selectedDayMatches?.length === 1 ? 'partido agendado' : 'partidos agendados'}`}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {selectedDayMatches?.map(m => (
            <div
              key={m.id}
              className="card"
              style={{
                padding: '0.85rem',
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)'
              }}
            >
              <div className="flex-between" style={{ marginBottom: '0.4rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--color-text-muted)' }}>
                  {m.tournament || 'Torneo General'} • {m.category || 'Cat. Libre'}
                </span>
                <span
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: '700',
                    padding: '0.15rem 0.5rem',
                    borderRadius: '4px',
                    backgroundColor: m.paymentStatus === 'Pagado' ? 'rgba(0,200,100,0.12)' : 'rgba(245,158,11,0.12)',
                    color: m.paymentStatus === 'Pagado' ? 'var(--color-success)' : 'var(--color-pending)'
                  }}
                >
                  {m.paymentStatus === 'Pagado' ? 'PAGADO' : 'PENDIENTE'}
                </span>
              </div>

              <div style={{ fontWeight: '700', fontSize: '0.95rem', margin: '0.25rem 0' }}>
                {m.homeTeam} <span style={{ color: 'var(--color-primary)' }}>vs</span> {m.awayTeam}
              </div>

              <div className="flex-between" style={{ marginTop: '0.6rem', paddingTop: '0.5rem', borderTop: '1px solid var(--color-border)' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{m.role || 'Central'} • </span>
                  <span style={{ fontWeight: '700', color: 'var(--color-accent)', fontSize: '0.85rem' }}>{formatCurrency(m.fee)}</span>
                </div>
                <button
                  className="btn btn-secondary"
                  style={{ minHeight: '44px', padding: '0.35rem 0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem' }}
                  onClick={() => {
                    setSelectedDayMatches(null);
                    onEditMatch(m);
                  }}
                >
                  <EditIcon size={15} />
                  <span>Ver / Editar</span>
                </button>
              </div>
            </div>
          ))}

          <button
            className="btn btn-primary"
            style={{ width: '100%', minHeight: '48px', marginTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
            onClick={() => {
              setSelectedDayMatches(null);
              onAddMatch();
            }}
          >
            <PlusIcon size={18} />
            <span>+ Registrar Nuevo Partido</span>
          </button>
        </div>
      </BottomSheet>

      <style>{`
        @media (max-width: 768px) {
          .calendar-cell {
            min-height: 52px !important;
            padding: 0.25rem !important;
          }
          .desktop-match-count {
            display: none !important;
          }
          .calendar-tags-desktop {
            display: none !important;
          }
          .calendar-dots-mobile {
            display: flex !important;
          }
        }
      `}</style>
    </div>
  );
};

export default CalendarView;
