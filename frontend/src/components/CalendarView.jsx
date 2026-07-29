import React, { useState, useMemo } from 'react';
import { useRefContext } from '../context/RefContext';

const formatCurrency = (val) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(val || 0);

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const CalendarView = ({ onAddMatch, onEditMatch }) => {
  const { matches } = useRefContext();
  const [currentDate, setCurrentDate] = useState(new Date());

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
    matches.forEach(m => {
      if (!m.date) return;
      if (!map[m.date]) map[m.date] = [];
      map[m.date].push(m);
    });
    return map;
  }, [matches]);

  const todayStr = new Date().toISOString().slice(0, 10);

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

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem' }} onClick={prevMonth}>
            ◀ Mes Anterior
          </button>
          <button className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem' }} onClick={today}>
            Hoy
          </button>
          <button className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem' }} onClick={nextMonth}>
            Mes Siguiente ▶
          </button>
          <button className="btn btn-primary" style={{ padding: '0.4rem 0.8rem', marginLeft: '0.5rem' }} onClick={onAddMatch}>
            + Agendar Partido
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

            return (
              <div
                key={idx}
                style={{
                  minHeight: '90px',
                  backgroundColor: cell.isCurrentMonth ? (isToday ? 'rgba(0,200,100,0.06)' : 'var(--color-surface)') : 'rgba(0,0,0,0.04)',
                  border: isToday ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.4rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.2rem',
                  opacity: cell.isCurrentMonth ? 1 : 0.45,
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
                  {dayMatches.length > 0 && (
                    <span style={{ fontSize: '0.65rem', background: 'var(--color-surface-hover)', borderRadius: '3px', padding: '0.05rem 0.3rem', color: 'var(--color-text-muted)' }}>
                      {dayMatches.length} {dayMatches.length === 1 ? 'partido' : 'partidos'}
                    </span>
                  )}
                </div>

                {/* Day match tags */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', overflowY: 'auto', maxHeight: '75px' }}>
                  {dayMatches.map(m => (
                    <div
                      key={m.id}
                      onClick={() => onEditMatch(m)}
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
    </div>
  );
};

export default CalendarView;
