import React, { useState, useMemo } from 'react';
import { useRefContext } from '../context/RefContext';
import { generateInvoicePDF } from '../utils/invoiceGenerator';
import { useAuth } from '../context/AuthContext';

const formatCurrency = (val) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(val || 0);

const InvoiceModal = ({ isOpen, onClose }) => {
  const { matches } = useRefContext();
  const { user } = useAuth();

  const [selectedTournament, setSelectedTournament] = useState('Todos');
  const [invoiceNumber, setInvoiceNumber] = useState(`CC-${Math.floor(100 + Math.random() * 900)}`);
  const [clientName, setClientName] = useState('');
  const [clientNit, setClientNit] = useState('');
  const [bank, setBank] = useState('Bancolombia');
  const [accountType, setAccountType] = useState('Ahorros');
  const [accountNumber, setAccountNumber] = useState('');
  const [selectedMatchIds, setSelectedMatchIds] = useState([]);

  // Pending matches available for invoicing
  const pendingMatches = useMemo(() => {
    return matches.filter(m => m.paymentStatus === 'Pendiente');
  }, [matches]);

  // Extract unique tournaments with pending debt
  const tournamentsWithDebt = useMemo(() => {
    const set = new Set();
    pendingMatches.forEach(m => {
      if (m.tournament) set.add(m.tournament);
    });
    return Array.from(set);
  }, [pendingMatches]);

  // Filtered pending matches by tournament
  const displayMatches = useMemo(() => {
    if (selectedTournament === 'Todos') return pendingMatches;
    return pendingMatches.filter(m => m.tournament === selectedTournament);
  }, [pendingMatches, selectedTournament]);

  // Pre-select matches when tournament changes
  React.useEffect(() => {
    if (isOpen) {
      setSelectedMatchIds(displayMatches.map(m => m.id));
      if (selectedTournament !== 'Todos') {
        setClientName(selectedTournament);
      }
    }
  }, [selectedTournament, isOpen, displayMatches]);

  const toggleSelectMatch = (id) => {
    setSelectedMatchIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedMatchIds.length === displayMatches.length) {
      setSelectedMatchIds([]);
    } else {
      setSelectedMatchIds(displayMatches.map(m => m.id));
    }
  };

  const handleGenerate = () => {
    const matchesToInvoice = matches.filter(m => selectedMatchIds.includes(m.id));
    if (matchesToInvoice.length === 0) {
      alert('Debes seleccionar al menos un partido para cobrar.');
      return;
    }

    generateInvoicePDF({
      invoiceNumber,
      clientName: clientName || selectedTournament || 'Liga de Fútbol',
      clientNit,
      matches: matchesToInvoice,
      bankInfo: {
        bank: bank || 'Bancolombia',
        accountType: accountType || 'Ahorros',
        accountNumber: accountNumber || '123-456789-00',
        holder: user?.name || 'Árbitro COARC'
      },
      refereeInfo: {
        name: user?.name || 'Árbitro COARC',
        refNumber: user?.refNumber || 'COARC-01'
      }
    });

    onClose();
  };

  if (!isOpen) return null;

  const totalAmount = matches.filter(m => selectedMatchIds.includes(m.id)).reduce((s, m) => s + (m.fee || 0), 0);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '640px' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.2rem' }}>Generar Cuenta de Cobro</h3>
            <p className="text-muted" style={{ fontSize: '0.8rem' }}>Documento oficial COARC en PDF para cobros corporativos</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', fontSize: '1.2rem' }}>✕</button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          
          {/* Tournament selector */}
          <div className="form-group">
            <label className="form-label" style={{ fontSize: '0.8rem' }}>Filtrar por Liga / Torneo Deudor</label>
            <select
              className="form-control"
              value={selectedTournament}
              onChange={e => setSelectedTournament(e.target.value)}
            >
              <option value="Todos">Todos los torneos con deuda ({tournamentsWithDebt.length})</option>
              {tournamentsWithDebt.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <div>
              <label className="form-label" style={{ fontSize: '0.8rem' }}>N° de Cuenta de Cobro</label>
              <input
                type="text"
                className="form-control"
                value={invoiceNumber}
                onChange={e => setInvoiceNumber(e.target.value)}
              />
            </div>
            <div>
              <label className="form-label" style={{ fontSize: '0.8rem' }}>Nombre del Cliente / Torneo</label>
              <input
                type="text"
                className="form-control"
                placeholder="Ej. Liga Sub-15 de Córdoba"
                value={clientName}
                onChange={e => setClientName(e.target.value)}
              />
            </div>
          </div>

          <div className="form-row">
            <div>
              <label className="form-label" style={{ fontSize: '0.8rem' }}>Banco para la Transferencia</label>
              <input
                type="text"
                className="form-control"
                placeholder="Ej. Bancolombia / Nequi / Daviplata"
                value={bank}
                onChange={e => setBank(e.target.value)}
              />
            </div>
            <div>
              <label className="form-label" style={{ fontSize: '0.8rem' }}>Número de Cuenta Bancaria / Celular</label>
              <input
                type="text"
                className="form-control"
                placeholder="Ej. 300 123 4567 o 123456789"
                value={accountNumber}
                onChange={e => setAccountNumber(e.target.value)}
              />
            </div>
          </div>

          {/* Matches Checklist */}
          <div>
            <div className="flex-between" style={{ marginBottom: '0.5rem' }}>
              <label className="form-label" style={{ fontSize: '0.85rem', fontWeight: '700' }}>
                Seleccionar Partidos a Cobrar ({selectedMatchIds.length})
              </label>
              <button
                type="button"
                onClick={selectAll}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary)', fontSize: '0.78rem', fontWeight: '700' }}
              >
                {selectedMatchIds.length === displayMatches.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
              </button>
            </div>

            {displayMatches.length === 0 ? (
              <div style={{ padding: '1.5rem', textAlign: 'center', background: 'var(--color-surface-hover)', borderRadius: 'var(--radius-sm)', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                No hay partidos pendientes de cobro para este filtro.
              </div>
            ) : (
              <div style={{ maxHeight: '180px', overflowY: 'auto', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '0.5rem' }}>
                {displayMatches.map(m => (
                  <label key={m.id} style={{ display: 'flex', alignItems: 'center', justifyBetween: 'space-between', padding: '0.5rem', borderRadius: '4px', cursor: 'pointer', borderBottom: '1px solid var(--color-border)' }}>
                    <input
                      type="checkbox"
                      checked={selectedMatchIds.includes(m.id)}
                      onChange={() => toggleSelectMatch(m.id)}
                      style={{ marginRight: '0.75rem', width: '16px', height: '16px', accentColor: 'var(--color-primary)' }}
                    />
                    <div style={{ flex: 1, fontSize: '0.83rem' }}>
                      <span style={{ fontWeight: '600' }}>{m.homeTeam} vs {m.awayTeam}</span>
                      <span style={{ color: 'var(--color-text-muted)', marginLeft: '0.5rem' }}>({m.date})</span>
                    </div>
                    <span style={{ fontWeight: '700', color: 'var(--color-accent)', fontSize: '0.85rem' }}>
                      {formatCurrency(m.fee)}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Summary Total */}
          <div style={{ background: 'rgba(0,200,100,0.08)', border: '1px solid rgba(0,200,100,0.25)', borderRadius: 'var(--radius-sm)', padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>Total a cobrar en este PDF:</span>
            <span style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--color-primary)' }}>{formatCurrency(totalAmount)}</span>
          </div>

        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
          <button type="button" className="btn btn-primary" onClick={handleGenerate} disabled={selectedMatchIds.length === 0}>
            📄 Generar PDF Cuenta de Cobro
          </button>
        </div>
      </div>
    </div>
  );
};

export default InvoiceModal;
