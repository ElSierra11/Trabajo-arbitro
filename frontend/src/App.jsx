import React, { useState, useEffect } from 'react';
import { RefProvider, useRefContext } from './context/RefContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import './App.css';
import {
  DashboardIcon,
  WhistleIcon,
  StatsIcon,
  ProfilesIcon,
  CalendarIcon,
  PlusIcon,
  MenuIcon,
  CloseIcon,
  LogoutIcon,
  ShieldIcon,
  SunIcon,
  MoonIcon,
  ReceiptText,
  UserIcon,
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

const AppContent = () => {
  const { activeProfile, error, reload } = useRefContext();
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

  const handleEditMatch = (match) => {
    setEditingMatch(match);
    setIsMatchModalOpen(true);
  };
  const handleAddNewMatch = () => {
    setEditingMatch(null);
    setIsMatchModalOpen(true);
  };

  // Redirect non-admin users if they are on an admin-only tab
  useEffect(() => {
    if (!isAdmin && (currentTab === 'profiles' || currentTab === 'admin')) {
      setCurrentTab('dashboard');
    }
  }, [isAdmin, currentTab]);

  const navItems = [
    { id: 'dashboard', label: 'Panel de Control', icon: <DashboardIcon size={20} /> },
    { id: 'matches', label: 'Mis Partidos', icon: <WhistleIcon size={20} /> },
    { id: 'calendar', label: 'Calendario', icon: <CalendarIcon size={20} /> },
    { id: 'stats', label: 'Estadísticas e Ingresos', icon: <StatsIcon size={20} /> },
    ...(isAdmin ? [{ id: 'profiles', label: 'Perfiles y Respaldos', icon: <ProfilesIcon size={20} /> }] : []),
    ...(isAdmin ? [{ id: 'admin', label: 'Administración', icon: <ShieldIcon size={20} /> }] : []),
  ];

  const renderTabContent = () => {
    switch (currentTab) {
      case 'dashboard':
        return <Dashboard onNavigate={setCurrentTab} onAddMatch={handleAddNewMatch} onEditMatch={handleEditMatch} />;
      case 'matches':
        return <MatchList onEditMatch={handleEditMatch} onAddMatch={handleAddNewMatch} />;
      case 'calendar':
        return <CalendarView onAddMatch={handleAddNewMatch} onEditMatch={handleEditMatch} />;
      case 'stats':
        return <Stats onOpenInvoiceModal={() => setIsInvoiceModalOpen(true)} />;
      case 'profiles':
        return isAdmin ? <Profiles /> : <Dashboard onNavigate={setCurrentTab} onAddMatch={handleAddNewMatch} onEditMatch={handleEditMatch} />;
      case 'admin':
        return isAdmin ? <AdminPanel /> : <Dashboard onNavigate={setCurrentTab} onAddMatch={handleAddNewMatch} onEditMatch={handleEditMatch} />;
      default:
        return <Dashboard onNavigate={setCurrentTab} onAddMatch={handleAddNewMatch} onEditMatch={handleEditMatch} />;
    }
  };

  const getTabTitle = () => {
    const titles = {
      dashboard: 'Panel de Control',
      matches: 'Registro de Partidos',
      calendar: 'Calendario de Partidos',
      stats: 'Estadísticas e Ingresos',
      profiles: 'Perfiles y Respaldos',
      admin: 'Administración COARC',
    };
    return titles[currentTab] || 'COARC';
  };

  return (
    <div className="app-container">
      {/* Mobile Header (< 768px) - Clean without redundant action buttons */}
      <header className="mobile-header">
        <button className="menu-toggle-btn" onClick={toggleSidebar} aria-label="Abrir menú">
          <MenuIcon size={22} />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <img src="/coarc-logo.png" alt="COARC Logo" style={{ height: '32px', objectFit: 'contain' }} />
          <span style={{ fontWeight: '800', fontSize: '1rem', letterSpacing: '-0.02em', color: 'var(--color-primary)' }}>
            COARC<span style={{ color: 'var(--color-text)' }}>.</span>
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            onClick={logout}
            style={{
              background: 'rgba(255, 42, 95, 0.1)',
              border: '1px solid rgba(255, 42, 95, 0.25)',
              color: 'var(--color-red-card)',
              padding: '0.35rem 0.65rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.75rem',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
            }}
            title="Cerrar Sesión"
            aria-label="Cerrar Sesión"
          >
            <LogoutIcon size={14} />
            <span>Cerrar Sesión</span>
          </button>
          <button
            onClick={() => setIsDark(!isDark)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-text-muted)',
              cursor: 'pointer',
              padding: '0.4rem',
              display: 'flex',
              alignItems: 'center',
            }}
            aria-label="Cambiar tema"
          >
            {isDark ? <SunIcon size={20} /> : <MoonIcon size={20} />}
          </button>
        </div>
      </header>

      {/* Sidebar Overlay (Mobile) */}
      <div className={`sidebar-overlay ${isSidebarOpen ? 'visible' : ''}`} onClick={closeSidebar} />

      {/* Sidebar (Desktop >= 768px and Drawer on mobile) */}
      <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div>
          {/* Brand with Logo */}
          <div className="sidebar-brand" style={{ flexDirection: 'column', alignItems: 'center', gap: '0.5rem', padding: '1rem 1rem 0.75rem' }}>
            <img src="/coarc-logo.png" alt="COARC Logo" style={{ width: '60px', height: '60px', objectFit: 'contain', borderRadius: '8px' }} />
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
          {/* Profile Card */}
          <div className="sidebar-profile-card">
            <div className="profile-avatar">
              {(user?.name || activeProfile?.name || 'A').charAt(0).toUpperCase()}
            </div>
            <div className="profile-info">
              <div className="profile-name-row">
                <span className="profile-name" title={user?.name || activeProfile?.name || 'Árbitro'}>
                  {user?.name || activeProfile?.name || 'Árbitro'}
                </span>
                {isAdmin && (
                  <span className="sidebar-admin-pill">ADMIN</span>
                )}
              </div>
              <span className="profile-email" title={user?.email || 'Árbitro'}>
                {user?.email || 'Árbitro'}
              </span>
            </div>
          </div>

          {/* Actions: Theme & Logout */}
          <div className="sidebar-footer-actions">
            <button
              type="button"
              className="sidebar-action-btn theme-btn"
              onClick={() => setIsDark(!isDark)}
              aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            >
              <span>{isDark ? 'Modo Claro' : 'Modo Oscuro'}</span>
              {isDark ? <SunIcon size={16} /> : <MoonIcon size={16} />}
            </button>

            <button
              type="button"
              className="sidebar-action-btn logout-btn"
              onClick={logout}
              aria-label="Cerrar Sesión"
            >
              <LogoutIcon size={15} />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <div className="tab-content">
          <div className="flex-between" style={{ marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ minWidth: 0, flex: 1 }}>
              <h1 style={{ marginBottom: '0.2rem' }}>{getTabTitle()}</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
                <span className="text-muted" style={{ fontSize: '0.85rem' }}>
                  COARC • <strong style={{ color: 'var(--color-text)', fontWeight: '700' }}>{user?.name || activeProfile.name}</strong>
                </span>
                <button
                  onClick={logout}
                  style={{
                    background: 'rgba(255, 42, 95, 0.1)',
                    border: '1px solid rgba(255, 42, 95, 0.3)',
                    color: 'var(--color-red-card)',
                    padding: '0.2rem 0.65rem',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.72rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 42, 95, 0.2)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255, 42, 95, 0.1)')}
                  title="Cerrar sesión de la cuenta"
                >
                  <LogoutIcon size={13} />
                  <span>Cerrar Sesión</span>
                </button>
              </div>
            </div>

            {/* Desktop Action Buttons (hidden on mobile to prevent redundancy with FAB and Bottom Nav) */}
            {currentTab !== 'profiles' && currentTab !== 'admin' && (
              <div className="desktop-header-actions" style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  className="btn btn-secondary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                  onClick={() => setIsInvoiceModalOpen(true)}
                >
                  <ReceiptText size={16} />
                  <span>Cuenta de Cobro</span>
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleAddNewMatch}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <PlusIcon size={18} />
                  <span>Registrar Partido</span>
                </button>
              </div>
            )}
          </div>

          {error && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              color: '#f87171',
              padding: '0.75rem 1.25rem',
              borderRadius: 'var(--radius-md, 8px)',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
              fontSize: '0.85rem'
            }}>
              <div>
                <strong>Aviso de sincronización:</strong> {error}
              </div>
              <button 
                className="btn btn-secondary" 
                onClick={() => reload()} 
                style={{ fontSize: '0.75rem', padding: '0.35rem 0.8rem', borderColor: 'rgba(239, 68, 68, 0.5)', color: '#f87171' }}
              >
                Reintentar Cargar
              </button>
            </div>
          )}

          {renderTabContent()}
        </div>
      </main>

      {/* FLOATING ACTION BUTTON (FAB) - Circular Emerald (#10b981) for quick match registration */}
      <button
        className="mobile-fab-btn"
        onClick={handleAddNewMatch}
        aria-label="Registrar Nuevo Partido"
      >
        <PlusIcon size={26} strokeWidth={2.5} />
      </button>

      {/* MOBILE BOTTOM NAVIGATION BAR (< 768px) - 4 thumb-friendly items */}
      <nav className="mobile-bottom-nav">
        <button
          className={`bottom-nav-item ${currentTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setCurrentTab('dashboard')}
          aria-label="Panel de Control"
        >
          <DashboardIcon size={20} />
          <span>Dashboard</span>
        </button>

        <button
          className={`bottom-nav-item ${currentTab === 'matches' ? 'active' : ''}`}
          onClick={() => setCurrentTab('matches')}
          aria-label="Mis Partidos"
        >
          <WhistleIcon size={20} />
          <span>Partidos</span>
        </button>

        {/* Empty space reservation for central elevated FAB */}
        <div className="bottom-nav-fab-placeholder" />

        <button
          className={`bottom-nav-item ${currentTab === 'calendar' ? 'active' : ''}`}
          onClick={() => setCurrentTab('calendar')}
          aria-label="Calendario"
        >
          <CalendarIcon size={20} />
          <span>Calendario</span>
        </button>

        <button
          className={`bottom-nav-item ${isSidebarOpen ? 'active' : ''}`}
          onClick={() => toggleSidebar()}
          aria-label="Abrir Menú"
        >
          <UserIcon size={20} />
          <span>Menú</span>
        </button>
      </nav>

      <MatchForm
        isOpen={isMatchModalOpen}
        onClose={() => { setIsMatchModalOpen(false); setEditingMatch(null); }}
        editingMatch={editingMatch}
      />
      <InvoiceModal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
      />
    </div>
  );
};

// Auth Gate
const AuthGate = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg)', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '3px solid rgba(16, 185, 129, 0.2)', borderTopColor: 'var(--color-primary)', animation: 'spin 0.8s linear infinite' }} />
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
