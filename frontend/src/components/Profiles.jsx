import React, { useState } from 'react';
import { useRefContext } from '../context/RefContext';
import { DownloadIcon, UploadIcon, PlusIcon, TrashIcon, EditIcon } from './Icons';

const Profiles = () => {
  const { 
    profiles, 
    activeProfileId, 
    setActiveProfileId, 
    addProfile, 
    updateProfile, 
    deleteProfile,
    exportData,
    importData
  } = useRefContext();

  // State for creating a new profile
  const [newName, setNewName] = useState('');
  const [newRefNumber, setNewRefNumber] = useState('');
  const [newDefaultFee, setNewDefaultFee] = useState(50000);
  const [isAdding, setIsAdding] = useState(false);

  // State for editing an existing profile
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editRefNumber, setEditRefNumber] = useState('');
  const [editDefaultFee, setEditDefaultFee] = useState(0);

  const [importStatus, setImportStatus] = useState(null);

  const handleAddProfile = (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    addProfile(newName.trim(), newRefNumber.trim(), newDefaultFee);
    setNewName('');
    setNewRefNumber('');
    setNewDefaultFee(50000);
    setIsAdding(false);
  };

  const handleStartEdit = (profile) => {
    setEditingId(profile.id);
    setEditName(profile.name);
    setEditRefNumber(profile.refNumber || '');
    setEditDefaultFee(profile.defaultFee || 0);
  };

  const handleSaveEdit = (id) => {
    if (!editName.trim()) return;
    updateProfile(id, {
      name: editName.trim(),
      refNumber: editRefNumber.trim(),
      defaultFee: Number(editDefaultFee) || 0
    });
    setEditingId(null);
  };

  const handleDelete = (id, name) => {
    if (profiles.length <= 1) {
      alert("No puedes eliminar el único perfil activo.");
      return;
    }
    if (window.confirm(`¿Estás seguro de eliminar el perfil de "${name}"? Se borrarán de forma permanente todos sus partidos registrados.`)) {
      deleteProfile(id);
    }
  };

  const handleImportFile = (e) => {
    const fileReader = new FileReader();
    const file = e.target.files[0];
    if (!file) return;

    fileReader.onload = (event) => {
      const result = importData(event.target.result);
      if (result.success) {
        setImportStatus({ success: true, message: 'Datos importados exitosamente.' });
        setTimeout(() => setImportStatus(null), 4000);
      } else {
        setImportStatus({ success: false, message: `Error al importar: ${result.error}` });
      }
    };
    fileReader.readAsText(file);
  };

  return (
    <div className="grid-cols-3">
      
      {/* Profiles list management (Span 2 columns) */}
      <section className="card" style={{ gridColumn: window.innerWidth > 768 ? 'span 2' : 'span 1', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div className="flex-between">
          <h3 style={{ fontSize: '1.2rem' }}>Colegas y Perfiles de Árbitros</h3>
          {!isAdding && (
            <button 
              className="btn btn-secondary" 
              style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
              onClick={() => setIsAdding(true)}
            >
              <PlusIcon size={14} />
              <span>Nuevo Árbitro</span>
            </button>
          )}
        </div>

        {/* Add Profile Form (Inline collapsible) */}
        {isAdding && (
          <form onSubmit={handleAddProfile} className="card" style={{ backgroundColor: 'rgba(0,0,0,0.15)', borderColor: 'var(--color-primary-glow)' }}>
            <h4 style={{ marginBottom: '1rem', fontSize: '1rem', color: 'var(--color-primary)' }}>Registrar Nuevo Árbitro</h4>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Nombre Completo *</label>
                <input 
                  type="text" 
                  value={newName} 
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Ej: Juan Pérez"
                  className="form-control"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Nro Carnet / Colegiado</label>
                <input 
                  type="text" 
                  value={newRefNumber} 
                  onChange={(e) => setNewRefNumber(e.target.value)}
                  placeholder="Ej: COARC-45"
                  className="form-control"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Tarifa Predeterminada por Partido ($ COP)</label>
              <input 
                type="number" 
                value={newDefaultFee} 
                onChange={(e) => setNewDefaultFee(Math.max(0, parseInt(e.target.value, 10) || 0))}
                className="form-control"
                style={{ borderColor: 'rgba(0, 240, 255, 0.2)' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setIsAdding(false)}>Cancelar</button>
              <button type="submit" className="btn btn-primary">Registrar Perfil</button>
            </div>
          </form>
        )}

        {/* Profiles List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {profiles.map(profile => {
            const isActive = profile.id === activeProfileId;
            const isEditing = profile.id === editingId;

            return (
              <div 
                key={profile.id} 
                className="card" 
                style={{ 
                  borderColor: isActive ? 'var(--color-primary)' : 'var(--color-border)',
                  backgroundColor: isActive ? 'rgba(204, 255, 0, 0.02)' : 'var(--color-surface)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem'
                }}
              >
                {isEditing ? (
                  /* Edit Mode */
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Nombre</label>
                        <input 
                          type="text" 
                          value={editName} 
                          onChange={(e) => setEditName(e.target.value)}
                          className="form-control"
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Colegiado/Registro</label>
                        <input 
                          type="text" 
                          value={editRefNumber} 
                          onChange={(e) => setEditRefNumber(e.target.value)}
                          className="form-control"
                        />
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Tarifa por defecto ($ COP)</label>
                      <input 
                        type="number" 
                        value={editDefaultFee} 
                        onChange={(e) => setEditDefaultFee(Math.max(0, parseInt(e.target.value, 10) || 0))}
                        className="form-control"
                      />
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <button className="btn btn-secondary" onClick={() => setEditingId(null)}>Cancelar</button>
                      <button className="btn btn-primary" onClick={() => handleSaveEdit(profile.id)}>Guardar</button>
                    </div>
                  </div>
                ) : (
                  /* Normal Profile Card Display */
                  <div className="flex-between" style={{ flexWrap: 'wrap', gap: '1rem' }}>
                    <div 
                      style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, cursor: 'pointer' }}
                      onClick={() => setActiveProfileId(profile.id)}
                    >
                      <div 
                        style={{ 
                          width: '42px', 
                          height: '42px', 
                          borderRadius: '50%', 
                          background: isActive 
                            ? 'linear-gradient(135deg, var(--color-primary), var(--color-accent))' 
                            : 'var(--color-border)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: isActive ? 'var(--color-text-dark)' : 'var(--color-text)',
                          fontWeight: '700',
                          fontFamily: 'var(--font-display)'
                        }}
                      >
                        {profile.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontWeight: '700', fontSize: '1rem' }}>{profile.name}</span>
                          {isActive && <span className="badge badge-paid" style={{ fontSize: '0.65rem' }}>Activo</span>}
                        </div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                          Registro: {profile.refNumber || 'Sin carnet'} • Tarifa: {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(profile.defaultFee || 0)}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button 
                        className="btn-icon-only" 
                        onClick={() => handleStartEdit(profile)}
                        title="Editar perfil de árbitro"
                      >
                        <EditIcon size={16} />
                      </button>
                      
                      {profiles.length > 1 && (
                        <button 
                          className="btn-icon-only" 
                          onClick={() => handleDelete(profile.id, profile.name)}
                          style={{ color: 'var(--color-red-card)', borderColor: 'rgba(255, 42, 95, 0.2)' }}
                          title="Eliminar árbitro"
                        >
                          <TrashIcon size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Backup and Restore utilities (Column 3) */}
      <section className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <h3 style={{ fontSize: '1.2rem' }}>Copia de Seguridad</h3>
        <p className="text-muted" style={{ fontSize: '0.85rem' }}>
          Respalda tus registros de partidos dirigidos para no perder la información, o compártela con otros árbitros de COARC.
        </p>

        {/* Export Data Button */}
        <div style={{ marginTop: '1rem' }}>
          <button 
            className="btn btn-secondary btn-block" 
            onClick={exportData}
            style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}
          >
            <DownloadIcon size={18} />
            <span>Respaldar Base de Datos (JSON)</span>
          </button>
        </div>

        <hr style={{ border: '0', borderTop: '1px solid var(--color-border)', margin: '0.5rem 0' }} />

        {/* Import Data Field */}
        <div>
          <label 
            className="btn btn-primary btn-block" 
            style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', cursor: 'pointer' }}
            htmlFor="import-file-input"
          >
            <UploadIcon size={18} />
            <span>Restaurar Copia de Seguridad</span>
          </label>
          <input 
            type="file" 
            id="import-file-input"
            accept=".json"
            onChange={handleImportFile}
            style={{ display: 'none' }}
          />
        </div>

        {importStatus && (
          <div 
            style={{ 
              padding: '0.75rem 1rem', 
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.8rem',
              fontWeight: '600',
              marginTop: '0.5rem',
              backgroundColor: importStatus.success ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 42, 95, 0.15)',
              color: importStatus.success ? 'var(--color-success)' : 'var(--color-red-card)',
              border: `1px solid ${importStatus.success ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255, 42, 95, 0.3)'}`
            }}
          >
            {importStatus.message}
          </div>
        )}
      </section>

    </div>
  );
};

export default Profiles;
