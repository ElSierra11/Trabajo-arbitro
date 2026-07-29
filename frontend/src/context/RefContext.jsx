import React, { createContext, useState, useEffect, useContext } from 'react';

const RefContext = createContext();

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const DEFAULT_PROFILE = {
  id: 'profile-coarc',
  name: 'Árbitro Principal',
  refNumber: 'COARC-01',
  defaultFee: 50000,
};

// Helper: returns Authorization header with stored JWT
const getAuthHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${localStorage.getItem('coarc_token') || ''}`
});

export const RefProvider = ({ children }) => {
  const [profiles, setProfiles] = useState([DEFAULT_PROFILE]);
  const [activeProfileId, setActiveProfileId] = useState(DEFAULT_PROFILE.id);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 1. Fetch initial data from backend API
  const fetchData = async () => {
    setLoading(true);
    try {
      const headers = getAuthHeaders();
      // Fetch profiles
      const profRes = await fetch(`${API_URL}/profiles`, { headers });
      if (!profRes.ok) throw new Error('Error al cargar perfiles del servidor');
      const profData = await profRes.json();
      setProfiles(profData);

      // Fetch matches
      const matchRes = await fetch(`${API_URL}/matches`, { headers });
      if (!matchRes.ok) throw new Error('Error al cargar partidos del servidor');
      const matchData = await matchRes.json();
      setMatches(matchData);

      // Determine active profile from local preferences or fallback to first
      const savedActiveId = localStorage.getItem('coarc_active_profile_id');
      if (savedActiveId && profData.some(p => p.id === savedActiveId)) {
        setActiveProfileId(savedActiveId);
      } else if (profData.length > 0) {
        setActiveProfileId(profData[0].id);
      }
      
      setError(null);
    } catch (err) {
      console.error('API connection error:', err);
      setError('No se pudo conectar al servidor. Los datos podrían no estar sincronizados.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Save active profile ID locally as preference
  const handleSetActiveProfile = (id) => {
    setActiveProfileId(id);
    localStorage.setItem('coarc_active_profile_id', id);
  };

  // 2. Profile API Actions
  const addProfile = async (name, refNumber, defaultFee) => {
    try {
      const res = await fetch(`${API_URL}/profiles`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ name, refNumber, defaultFee })
      });
      if (!res.ok) throw new Error('Error al guardar el perfil en el servidor');
      const newProfile = await res.json();
      setProfiles(prev => [...prev, newProfile]);
      handleSetActiveProfile(newProfile.id);
    } catch (err) {
      console.error(err);
      alert('Error: ' + err.message);
    }
  };

  const updateProfile = async (id, updatedData) => {
    try {
      const res = await fetch(`${API_URL}/profiles/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(updatedData)
      });
      if (!res.ok) throw new Error('Error al actualizar el perfil en el servidor');
      const updated = await res.json();
      setProfiles(prev => prev.map(p => (p.id === id ? updated : p)));
    } catch (err) {
      console.error(err);
      alert('Error: ' + err.message);
    }
  };

  const deleteProfile = async (id) => {
    if (profiles.length <= 1) return;
    try {
      const res = await fetch(`${API_URL}/profiles/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
      if (!res.ok) throw new Error('Error al eliminar el perfil del servidor');

      setProfiles(prev => prev.filter(p => p.id !== id));
      setMatches(prev => prev.filter(m => m.profileId !== id));

      if (activeProfileId === id) {
        const remaining = profiles.filter(p => p.id !== id);
        handleSetActiveProfile(remaining[0].id);
      }
    } catch (err) {
      console.error(err);
      alert('Error: ' + err.message);
    }
  };

  // 3. Match API Actions
  const addMatch = async (matchData) => {
    try {
      const res = await fetch(`${API_URL}/matches`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ ...matchData, profileId: activeProfileId })
      });
      if (!res.ok) throw new Error('Error al guardar el partido en el servidor');
      const newMatch = await res.json();
      setMatches(prev => [newMatch, ...prev]);
    } catch (err) {
      console.error(err);
      alert('Error al registrar partido: ' + err.message);
    }
  };

  const updateMatch = async (id, updatedMatchData) => {
    try {
      const res = await fetch(`${API_URL}/matches/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(updatedMatchData)
      });
      if (!res.ok) throw new Error('Error al actualizar el partido en el servidor');
      const updated = await res.json();
      setMatches(prev => prev.map(m => (m.id === id ? updated : m)));
    } catch (err) {
      console.error(err);
      alert('Error al editar partido: ' + err.message);
    }
  };

  const deleteMatch = async (id) => {
    try {
      const res = await fetch(`${API_URL}/matches/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
      if (!res.ok) throw new Error('Error al eliminar el partido del servidor');
      setMatches(prev => prev.filter(m => m.id !== id));
    } catch (err) {
      console.error(err);
      alert('Error al eliminar partido: ' + err.message);
    }
  };

  const togglePaymentStatus = async (id) => {
    const match = matches.find(m => m.id === id);
    if (!match) return;
    const newStatus = match.paymentStatus === 'Pagado' ? 'Pendiente' : 'Pagado';
    await updateMatch(id, { paymentStatus: newStatus });
  };

  // 4. Import / Export Data
  const exportData = () => {
    const dataStr = JSON.stringify({ profiles, matches });
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `coarc_refmanager_backup_${new Date().toISOString().slice(0,10)}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const importData = async (jsonData) => {
    try {
      const parsed = JSON.parse(jsonData);
      if (!parsed.profiles || !Array.isArray(parsed.profiles) || !parsed.matches || !Array.isArray(parsed.matches)) {
        return { success: false, error: 'Formato de archivo inválido.' };
      }

      // Sync with backend API
      const res = await fetch(`${API_URL}/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: jsonData
      });

      if (!res.ok) throw new Error('Error de importación del servidor');
      
      // Reload everything
      await fetchData();
      return { success: true };
    } catch (e) {
      console.error('Import error:', e);
      return { success: false, error: e.message };
    }
  };

  // Selectors for active profile
  const activeProfile = profiles.find(p => p.id === activeProfileId) || DEFAULT_PROFILE;
  const activeMatches = matches.filter(m => m.profileId === activeProfileId);

  // Statistics calculations helper
  const getStats = () => {
    let totalEarnings = 0;
    let paidEarnings = 0;
    let pendingEarnings = 0;
    let totalYellowCards = 0;
    let totalRedCards = 0;

    activeMatches.forEach(m => {
      totalEarnings += m.fee;
      if (m.paymentStatus === 'Pagado') {
        paidEarnings += m.fee;
      } else {
        pendingEarnings += m.fee;
      }
      totalYellowCards += m.yellowCards;
      totalRedCards += m.redCards;
    });

    // Monthly breakdown
    const monthlyStats = {};
    activeMatches.forEach(m => {
      if (!m.date) return;
      const dateObj = new Date(m.date + 'T00:00:00'); // Prevent UTC timezone shift
      const year = dateObj.getFullYear();
      const month = dateObj.getMonth();
      const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
      
      if (!monthlyStats[monthKey]) {
        monthlyStats[monthKey] = {
          monthKey,
          label: dateObj.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }),
          total: 0,
          paid: 0,
          pending: 0,
          count: 0
        };
      }
      
      monthlyStats[monthKey].total += m.fee;
      if (m.paymentStatus === 'Pagado') {
        monthlyStats[monthKey].paid += m.fee;
      } else {
        monthlyStats[monthKey].pending += m.fee;
      }
      monthlyStats[monthKey].count += 1;
    });

    const monthlyStatsArray = Object.values(monthlyStats).sort((a, b) => {
      return a.monthKey.localeCompare(b.monthKey);
    });

    return {
      totalMatches: activeMatches.length,
      totalEarnings,
      paidEarnings,
      pendingEarnings,
      totalYellowCards,
      totalRedCards,
      monthlyStats: monthlyStatsArray,
    };
  };

  return (
    <RefContext.Provider
      value={{
        profiles,
        activeProfileId,
        setActiveProfileId: handleSetActiveProfile,
        activeProfile,
        matches: activeMatches,
        allMatchesRaw: matches,
        loading,
        error,
        addProfile,
        updateProfile,
        deleteProfile,
        addMatch,
        updateMatch,
        deleteMatch,
        togglePaymentStatus,
        exportData,
        importData,
        stats: getStats(),
        reload: fetchData
      }}
    >
      {children}
    </RefContext.Provider>
  );
};

export const useRefContext = () => {
  const context = useContext(RefContext);
  if (!context) {
    throw new Error('useRefContext debe usarse dentro de un RefProvider');
  }
  return context;
};
