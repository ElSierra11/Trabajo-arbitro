/**
 * Utilidades para derivar el estado de los partidos (Programado vs Jugado)
 * sin requerir columnas adicionales en la base de datos.
 */

/**
 * Verifica si a un partido le faltan los equipos
 */
export const isMissingTeams = (match) => {
  if (!match) return true;
  const home = (match.homeTeam || '').trim();
  const away = (match.awayTeam || '').trim();
  return !home || !away || home.toLowerCase() === 'por definir' || away.toLowerCase() === 'por definir';
};

/**
 * Convierte date ("YYYY-MM-DD") y time ("HH:mm") a un objeto Date local
 */
export const getMatchDateTime = (dateStr, timeStr) => {
  if (!dateStr) return null;
  const [year, month, day] = dateStr.split('-').map(Number);
  let hours = 0;
  let minutes = 0;

  if (timeStr && timeStr.includes(':')) {
    const [h, m] = timeStr.split(':').map(Number);
    if (!isNaN(h)) hours = h;
    if (!isNaN(m)) minutes = m;
  }

  return new Date(year, month - 1, day, hours, minutes, 0);
};

/**
 * Determina si la fecha y hora del partido ya ocurrieron
 */
export const isPastMatch = (match) => {
  if (!match || !match.date) return false;
  const matchDate = getMatchDateTime(match.date, match.time);
  if (!matchDate) return false;
  
  // Si no tiene hora especificada, consideramos que finalizó al terminar el día (23:59:59)
  if (!match.time) {
    const endOfDay = new Date(matchDate);
    endOfDay.setHours(23, 59, 59, 999);
    return endOfDay < new Date();
  }

  // Si tiene hora, agregamos un margen de 2 horas (duración aproximada del partido)
  const matchEnd = new Date(matchDate.getTime() + 2 * 60 * 60 * 1000);
  return matchEnd < new Date();
};

/**
 * Determina si un partido está en estado 'Programado'
 * (Es futuro O faltan equipos por asignar)
 */
export const isScheduled = (match) => {
  if (!match) return false;
  if (isMissingTeams(match)) return true;
  return !isPastMatch(match);
};

/**
 * Sugerencia: Determina si el partido ya pasó pero le falta resultado o planilla
 */
export const needsCompletion = (match) => {
  if (!match) return false;
  if (isScheduled(match)) return false;
  
  // Si no tiene marcador registrado o no tiene goles ingresados
  const hasGoalsList = Array.isArray(match.goals) && match.goals.length > 0;
  const hasScore = (match.homeGoals > 0 || match.awayGoals > 0) || hasGoalsList;
  const hasReports = Array.isArray(match.reportFiles) && match.reportFiles.length > 0;

  return !hasScore || !hasReports;
};

/**
 * Obtiene el estado derivado unificado del partido
 * @returns {'scheduled' | 'needs_completion' | 'completed'}
 */
export const getMatchStatus = (match) => {
  if (isScheduled(match)) return 'scheduled';
  if (needsCompletion(match)) return 'needs_completion';
  return 'completed';
};

/**
 * Genera una cuenta regresiva legible para humanos
 * Ejemplos: "En 2 horas", "Hoy a las 16:00", "Mañana", "En 3 días"
 */
export const getTimeUntilMatch = (match) => {
  if (!match || !match.date) return '';
  const matchDate = getMatchDateTime(match.date, match.time);
  if (!matchDate) return '';

  const now = new Date();
  const diffMs = matchDate.getTime() - now.getTime();
  const diffHours = Math.round(diffMs / (1000 * 60 * 60));
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffMs < 0) {
    const passedDays = Math.abs(diffDays);
    if (passedDays === 0) return 'Hoy (Finalizado)';
    if (passedDays === 1) return 'Ayer';
    return `Hace ${passedDays} días`;
  }

  // Mismo día
  const isToday = now.toDateString() === matchDate.toDateString();
  if (isToday) {
    if (diffHours <= 1) return 'En menos de 1 hora';
    if (diffHours < 6) return `En ${diffHours} horas`;
    return match.time ? `Hoy a las ${match.time}` : 'Hoy';
  }

  // Mañana
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const isTomorrow = tomorrow.toDateString() === matchDate.toDateString();
  if (isTomorrow) {
    return match.time ? `Mañana a las ${match.time}` : 'Mañana';
  }

  // Próximos días
  if (diffDays <= 7) {
    const weekday = matchDate.toLocaleDateString('es-CO', { weekday: 'long' });
    const capitalized = weekday.charAt(0).toUpperCase() + weekday.slice(1);
    return `En ${diffDays} días (${capitalized})`;
  }

  return `En ${diffDays} días`;
};

/**
 * Helpers para almacenar y extraer Cancha/Lugar dentro del campo 'notes'
 * sin modificar el esquema de base de datos
 */
export const extractFieldFromNotes = (notes) => {
  if (!notes || typeof notes !== 'string') return { field: '', cleanNotes: '' };
  const match = notes.match(/^\[Cancha:\s*([^\]]+)\]\s*\n?/i);
  if (match) {
    const field = match[1].trim();
    const cleanNotes = notes.replace(/^\[Cancha:\s*([^\]]+)\]\s*\n?/i, '').trim();
    return { field, cleanNotes };
  }
  return { field: '', cleanNotes: notes };
};

export const combineFieldWithNotes = (field, notes) => {
  const cleanField = (field || '').trim();
  const cleanNotes = (notes || '').trim();
  if (!cleanField) return cleanNotes;
  if (!cleanNotes) return `[Cancha: ${cleanField}]`;
  return `[Cancha: ${cleanField}]\n${cleanNotes}`;
};
