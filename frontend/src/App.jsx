import React, { useState, useEffect } from 'react';
import { RefProvider, useRefContext } from './context/RefContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import './App.css';
import {
  DashboardIcon,
  WhistleIcon,
  StatsIcon,
  ProfilesIcon,
  PlusIcon,
  MenuIcon,
} from './components/Icons';

import Dashboard from './components/Dashboard';
import MatchList from './components/MatchList';
import Stats from './components/Stats';
import Profiles from './components/Profiles';
import MatchForm from './components/MatchForm';
import LoginPage from './components/LoginPage';
import AdminPanel from './components/AdminPanel';
import CalendarView from './components/CalendarView';
import InvoiceModal from './components/InvoiceModal';
import ErrorBoundary from './components/ErrorBoundary';
import PwaInstallPrompt from './components/PwaInstallPrompt';

// Inline Icons
const LogoutIcon = ({ size = 18 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);
const AdminIcon = ({ size = 18 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);
const CalendarIcon = ({ size = 18 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);
const SunIcon = ({ size = 18 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
    <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
  </svg>
);
const MoonIcon = ({ size = 18 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>
);

const AppContent = () => {
  const { activeProfile } = useRefContext();
  const { user, logout, isAdmin } = useAuth();
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMatchModalOpen, setIsMatchModalOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [editingMatch, setEditingMatch] = useState(null);
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('coarc_theme');
    return saved !== 'light';
  });

  // Apply theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    localStorage.setItem('coarc_theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  const handleEditMatch = (match) => { setEditingMatch(match); setIsMatchModalOpen(true); };
  const handleAddNewMatch = () => { setEditingMatch(null); setIsMatchModalOpen(true); };

  const navItems = [
    { id: 'dashboard', label: 'Panel de Control', icon: <DashboardIcon /> },
    { id: 'matches', label: 'Mis Partidos', icon: <WhistleIcon /> },
    { id: 'calendar', label: 'Calendario', icon: <CalendarIcon /> },
    { id: 'stats', label: 'Estadísticas e Ingresos', icon: <StatsIcon /> },
    { id: 'profiles', label: 'Perfiles', icon: <ProfilesIcon /> },
    ...(isAdmin ? [{ id: 'admin', label: 'Administración', icon: <AdminIcon size={20} /> }] : []),
  ];

  const renderTabContent = () => {
    switch (currentTab) {
      case 'dashboard': return <Dashboard onNavigate={setCurrentTab} onAddMatch={handleAddNewMatch} onEditMatch={handleEditMatch} />;
      case 'matches': return <MatchList onEditMatch={handleEditMatch} onAddMatch={handleAddNewMatch} />;
      case 'calendar': return <CalendarView onAddMatch={handleAddNewMatch} onEditMatch={handleEditMatch} />;
      case 'stats': return <Stats onOpenInvoiceModal={() => setIsInvoiceModalOpen(true)} />;
      case 'profiles': return <Profiles />;
      case 'admin': return isAdmin ? <AdminPanel /> : <Dashboard onNavigate={setCurrentTab} onAddMatch={handleAddNewMatch} onEditMatch={handleEditMatch} />;
      default: return <Dashboard onNavigate={setCurrentTab} onAddMatch={handleAddNewMatch} onEditMatch={handleEditMatch} />;
    }
  };

  const getTabTitle = () => {
    const titles = {
      dashboard: 'Panel de Control',
      matches: 'Registro de Partidos',
      calendar: 'Calendario de Partidos',
      stats: 'Estadísticas e Ingresos',
      profiles: 'Perfiles y Respaldos',
      admin: 'Administración COARC'
    };
    return titles[currentTab] || 'COARC';
  };

  return (
    <div className="app-container">
      {/* Mobile Header */}
      <header className="mobile-header">
        <button className="menu-toggle-btn" onClick={toggleSidebar} aria-label="Abrir menú">
          <MenuIcon size={24} />
        </button>
        <img src="/coarc-logo.png" alt="COARC Logo" style={{ height: '36px', objectFit: 'contain' }} />
        <button className="btn-primary" style={{ padding: '0.4rem', borderRadius: 'var(--radius-sm)' }} onClick={handleAddNewMatch} aria-label="Registrar Partido">
          <PlusIcon size={18} />
        </button>
      </header>

      {/* Sidebar Overlay (Mobile) */}
      <div className={`sidebar-overlay ${isSidebarOpen ? 'visible' : ''}`} onClick={closeSidebar} />

      {/* Sidebar */}
      <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div>
          {/* Brand with Logo */}
          <div className="sidebar-brand" style={{ flexDirection: 'column', alignItems: 'center', gap: '0.5rem', padding: '1rem 1rem 0.75rem' }}>
            <img src="/coarc-logo.png" alt="COARC Logo" style={{ width: '64px', height: '64px', objectFit: 'contain', borderRadius: '8px' }} />
            <div style={{ textAlign: 'center' }}>
              <div className="brand-title" style={{ fontSize: '1.2rem' }}>COARC<span>.</span></div>
              <div className="brand-subtitle" style={{ fontSize: '0.68rem', letterSpacing: '0.05em' }}>Corporación Arbitral</div>
            </div>
          </div>

          <nav className="sidebar-menu">
            {navItems.map(item => (
              <div
                key={item.id}
                className={`sidebar-link ${currentTab === item.id ? 'active' : ''}`}
                onClick={() => { setCurrentTab(item.id); closeSidebar(); }}
                style={item.id === 'admin' ? { borderTop: '1px solid var(--color-border)', marginTop: '0.5rem', paddingTop: '0.75rem' } : {}}
              >
                {item.icon}
                <span>{item.label}</span>
                {item.id === 'admin' && (
                  <span style={{ marginLeft: 'auto', fontSize: '0.65rem', background: 'rgba(0,200,100,0.15)', color: 'var(--color-primary)', padding: '0.1rem 0.4rem', borderRadius: '3px', fontWeight: '700' }}>ADMIN</span>
                )}
              </div>
            ))}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="sidebar-footer">
          {/* Theme toggle */}
          <button
            onClick={() => setIsDark(!isDark)}
            style={{
              width: '100%', marginBottom: '0.5rem',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)',
              background: 'var(--color-surface)', border: '1px solid var(--color-border)',
              color: 'var(--color-text-muted)', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer',
            }}
          >
            <span>{isDark ? 'Modo Claro' : 'Modo Oscuro'}</span>
            {isDark ? <SunIcon size={15} /> : <MoonIcon size={15} />}
          </button>

          {/* Admin badge */}
          {isAdmin && (
            <div style={{ textAlign: 'center', marginBottom: '0.5rem', fontSize: '0.7rem', fontWeight: '700', letterSpacing: '0.08em', color: 'var(--color-primary)', background: 'rgba(0,200,100,0.08)', border: '1px solid rgba(0,200,100,0.2)', borderRadius: '4px', padding: '0.2rem 0.5rem' }}>
              ADMINISTRADOR
            </div>
          )}

          {/* Profile info */}
          <div className="sidebar-profile-card">
            <div className="profile-avatar">{(user?.name || activeProfile.name).charAt(0).toUpperCase()}</div>
            <div className="profile-info">
              <div className="profile-name">{user?.name || activeProfile.name}</div>
              <div className="profile-role" style={{ fontSize: '0.7rem', opacity: 0.7 }}>{user?.email || 'Árbitro'}</div>
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={logout}
            style={{
              width: '100%', marginTop: '0.75rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
              padding: '0.6rem', borderRadius: 'var(--radius-sm)',
              background: 'rgba(255,42,95,0.06)', border: '1px solid rgba(255,42,95,0.15)',
              color: 'var(--color-red-card)', fontSize: '0.8rem', fontWeight: '600',
              cursor: 'pointer', transition: 'all 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,42,95,0.12)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,42,95,0.06)'}
          >
            <LogoutIcon size={15} />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <div className="tab-content">
          <div className="flex-between" style={{ marginBottom: '2rem' }}>
            <div>
              <h1 style={{ marginBottom: '0.25rem' }}>{getTabTitle()}</h1>
              <p className="text-muted">Corporación Arbitral de Córdoba • {user?.name || activeProfile.name}</p>
            </div>
            {currentTab !== 'profiles' && currentTab !== 'admin' && (
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button className="btn btn-secondary" onClick={() => setIsInvoiceModalOpen(true)}>
                  📄 Cuenta de Cobro
                </button>
                <button className="btn btn-primary" onClick={handleAddNewMatch} style={{ display: window.innerWidth > 1024 ? 'inline-flex' : 'none' }}>
                  <PlusIcon size={18} />
                  <span>Registrar Partido</span>
                </button>
              </div>
            )}
          </div>
          {renderTabContent()}
        </div>
      </main>

      <MatchForm isOpen={isMatchModalOpen} onClose={() => { setIsMatchModalOpen(false); setEditingMatch(null); }} editingMatch={editingMatch} />
      <InvoiceModal isOpen={isInvoiceModalOpen} onClose={() => setIsInvoiceModalOpen(false)} />
    </div>
  );
};

// Auth Gate
const AuthGate = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg)', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '3px solid rgba(0,200,100,0.2)', borderTopColor: 'var(--color-primary)', animation: 'spin 0.8s linear infinite' }} />
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Verificando sesión...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!user) return <LoginPage />;

  return (
    <RefProvider>
      <AppContent />
    </RefProvider>
  );
};

const App = () => (
  <ErrorBoundary>
    <AuthProvider>
      <AuthGate />
      <PwaInstallPrompt />
    </AuthProvider>
  </ErrorBoundary>
);

export default App;
