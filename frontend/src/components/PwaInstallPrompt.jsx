import React, { useState, useEffect } from 'react';
import { CloseIcon, CheckCircle2 } from './Icons';

const PwaInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // 1. Detect if running as installed standalone app
    const isStandaloneMode = 
      window.matchMedia('(display-mode: standalone)').matches || 
      window.navigator.standalone === true ||
      document.referrer.includes('android-app://');

    setIsStandalone(isStandaloneMode);

    // 2. Detect iOS device
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isAppleDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isAppleDevice);

    if (isStandaloneMode) return;

    // 3. Listen for Android/Desktop native install prompt
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Check if user dismissed it in this session
      const dismissed = sessionStorage.getItem('coarc_pwa_dismissed');
      if (!dismissed) {
        setShowBanner(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // If on iOS and not standalone, show banner if not dismissed
    if (isAppleDevice) {
      const dismissed = sessionStorage.getItem('coarc_pwa_dismissed');
      if (!dismissed) {
        // Show after a brief delay for a smoother user experience
        const timer = setTimeout(() => setShowBanner(true), 1500);
        return () => clearTimeout(timer);
      }
    }

    // Listen for custom trigger from anywhere in the app
    const handleOpenInstallGuide = () => {
      setShowModal(true);
    };
    window.addEventListener('open-pwa-install-guide', handleOpenInstallGuide);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('open-pwa-install-guide', handleOpenInstallGuide);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowBanner(false);
      }
      setDeferredPrompt(null);
    } else {
      // If no native prompt (iOS or browser without deferredPrompt), open guided modal
      setShowModal(true);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    sessionStorage.setItem('coarc_pwa_dismissed', 'true');
  };

  if (isStandalone) return null;

  return (
    <>
      {/* Floating Bottom Banner */}
      {showBanner && (
        <div
          style={{
            position: 'fixed',
            bottom: '1.25rem',
            left: '1rem',
            right: '1rem',
            maxWidth: '440px',
            margin: '0 auto',
            backgroundColor: 'var(--color-surface)',
            border: '1px solid rgba(var(--color-primary-rgb), 0.35)',
            borderRadius: 'var(--radius-md)',
            boxShadow: '0 12px 36px rgba(0, 0, 0, 0.45)',
            padding: '1rem',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
            animation: 'slideUp 0.3s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem' }}>
            <img
              src="/coarc-logo.png"
              alt="COARC Logo"
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '10px',
                objectFit: 'contain',
                flexShrink: 0,
                backgroundColor: 'rgba(0,0,0,0.2)',
                padding: '3px',
              }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: '800', color: 'var(--color-text)' }}>
                  ¡Instala COARC en tu Celular! 📲
                </h4>
                <button
                  type="button"
                  onClick={handleDismiss}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--color-text-muted)',
                    cursor: 'pointer',
                    padding: '0.2rem',
                    display: 'flex',
                  }}
                  title="Cerrar"
                >
                  <CloseIcon size={16} />
                </button>
              </div>
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.78rem', color: 'var(--color-text-muted)', lineHeight: '1.35' }}>
                {isIOS
                  ? 'Úsala como una app nativa en tu iPhone para registrar partidos rápido y sin conexión.'
                  : 'Accede en un toque desde tu pantalla de inicio y gestiona tus partidos en la cancha.'}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => { setShowBanner(false); setShowModal(true); }}
              style={{ fontSize: '0.78rem', padding: '0.45rem 0.85rem' }}
            >
              Ver Instrucciones
            </button>

            <button
              type="button"
              className="btn btn-primary"
              onClick={handleInstallClick}
              style={{ fontSize: '0.78rem', padding: '0.45rem 1rem', fontWeight: '800' }}
            >
              {deferredPrompt ? 'Instalar Ahora ⚡' : 'Cómo Instalar 📲'}
            </button>
          </div>
        </div>
      )}

      {/* Detailed Installation Guide Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '540px' }}
          >
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    background: 'rgba(var(--color-primary-rgb), 0.15)',
                    color: 'var(--color-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '800',
                    fontSize: '1.2rem',
                  }}
                >
                  📲
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem' }}>Instalar COARC como App</h3>
                  <span className="text-muted" style={{ fontSize: '0.75rem' }}>
                    Disponible para Android y iPhone
                  </span>
                </div>
              </div>
              <button
                type="button"
                className="btn-icon-only"
                onClick={() => setShowModal(false)}
              >
                <CloseIcon size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Native Prompt button if available on Chrome */}
              {deferredPrompt && (
                <div style={{ background: 'rgba(var(--color-primary-rgb), 0.1)', border: '1px solid rgba(var(--color-primary-rgb), 0.3)', borderRadius: 'var(--radius-sm)', padding: '0.85rem 1rem', textAlign: 'center' }}>
                  <p style={{ margin: '0 0 0.5rem', fontSize: '0.85rem', fontWeight: '600' }}>
                    Tu navegador permite instalar la app con un solo clic:
                  </p>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleInstallClick}
                    style={{ padding: '0.55rem 1.5rem', fontWeight: '800' }}
                  >
                    ⚡ Instalar App Oficial Ahora
                  </button>
                </div>
              )}

              {/* Instructions per OS */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* Android Chrome */}
                <div
                  style={{
                    background: 'var(--color-bg)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '1rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '1.2rem' }}>🤖</span>
                    <strong style={{ fontSize: '0.9rem', color: 'var(--color-text)' }}>En Android (Google Chrome)</strong>
                  </div>
                  <ol style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.82rem', color: 'var(--color-text-muted)', lineHeight: '1.6' }}>
                    <li>Abre <strong>trabajo-arbitro.vercel.app</strong> en Google Chrome.</li>
                    <li>Toca los <strong>tres puntos (⋮)</strong> en la esquina superior derecha.</li>
                    <li>Selecciona <strong>"Instalar aplicación"</strong> o <strong>"Agregar a la pantalla principal"</strong>.</li>
                    <li>Confirma tocando <strong>Instalar</strong>.</li>
                  </ol>
                </div>

                {/* iPhone Safari */}
                <div
                  style={{
                    background: 'var(--color-bg)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '1rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '1.2rem' }}>🍏</span>
                    <strong style={{ fontSize: '0.9rem', color: 'var(--color-text)' }}>En iPhone / iPad (Safari)</strong>
                  </div>
                  <ol style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.82rem', color: 'var(--color-text-muted)', lineHeight: '1.6' }}>
                    <li>Abre <strong>trabajo-arbitro.vercel.app</strong> obligatoriamente en <strong>Safari</strong>.</li>
                    <li>Toca el botón <strong>Compartir</strong> (el icono de un cuadrado con flecha hacia arriba ⎋ en la barra inferior).</li>
                    <li>Desliza hacia abajo y presiona <strong>"Agregar a la pantalla de inicio"</strong> (con icono ➕).</li>
                    <li>Toca <strong>"Agregar"</strong> en la esquina superior derecha.</li>
                  </ol>
                </div>
              </div>

              {/* Benefits */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', textAlign: 'center' }}>
                <div style={{ padding: '0.5rem', background: 'var(--color-surface)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>
                  <div style={{ fontSize: '1rem' }}>⚡</div>
                  <div style={{ fontSize: '0.72rem', fontWeight: '700', marginTop: '0.2rem' }}>Carga al instante</div>
                </div>
                <div style={{ padding: '0.5rem', background: 'var(--color-surface)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>
                  <div style={{ fontSize: '1rem' }}>📴</div>
                  <div style={{ fontSize: '0.72rem', fontWeight: '700', marginTop: '0.2rem' }}>Modo Offline</div>
                </div>
                <div style={{ padding: '0.5rem', background: 'var(--color-surface)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>
                  <div style={{ fontSize: '1rem' }}>📱</div>
                  <div style={{ fontSize: '0.72rem', fontWeight: '700', marginTop: '0.2rem' }}>App Completa</div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setShowModal(false)}
                style={{ minWidth: '100px' }}
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PwaInstallPrompt;
