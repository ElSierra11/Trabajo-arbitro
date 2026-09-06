import React, { useEffect } from 'react';
import { CloseIcon } from './Icons';

const BottomSheet = ({ isOpen, onClose, title, subtitle, children }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
      }}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(4px)',
          animation: 'fadeIn 0.2s ease-out',
        }}
      />

      {/* Drawer Panel */}
      <div
        style={{
          position: 'relative',
          backgroundColor: 'var(--color-surface)',
          borderTop: '1px solid var(--color-border)',
          borderTopLeftRadius: '20px',
          borderTopRightRadius: '20px',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 -10px 40px rgba(0,0,0,0.5)',
          animation: 'slideUp 0.28s cubic-bezier(0.16, 1, 0.3, 1)',
          paddingBottom: 'max(1rem, env(safe-area-inset-bottom))',
        }}
      >
        {/* Grab bar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            paddingTop: '0.75rem',
            paddingBottom: '0.25rem',
            cursor: 'pointer',
          }}
          onClick={onClose}
        >
          <div
            style={{
              width: '40px',
              height: '4px',
              borderRadius: '2px',
              backgroundColor: 'var(--color-border)',
              opacity: 0.8,
            }}
          />
        </div>

        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.75rem 1.25rem',
            borderBottom: '1px solid var(--color-border)',
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700' }}>{title}</h3>
            {subtitle && (
              <p className="text-muted" style={{ margin: '0.15rem 0 0', fontSize: '0.8rem' }}>
                {subtitle}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'var(--color-surface-hover)',
              border: 'none',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-text-muted)',
              cursor: 'pointer',
            }}
            aria-label="Cerrar"
          >
            <CloseIcon size={18} />
          </button>
        </div>

        {/* Content */}
        <div
          style={{
            padding: '1rem 1.25rem',
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {children}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default BottomSheet;
