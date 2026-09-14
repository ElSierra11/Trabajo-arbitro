import React, { useState, useRef, useCallback } from 'react';
import { TrashIcon, DownloadIcon, CloseIcon, PaperclipIcon, FileImageIcon, UploadIcon } from './Icons';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const getAuthHeaders = () => ({
  'Authorization': `Bearer ${localStorage.getItem('coarc_token') || ''}`,
});

const formatFileSize = (bytes) => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const formatDate = (iso) => {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('es-ES', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

const ReportUploadModal = ({ match, onClose, onFilesChanged }) => {
  const [files, setFiles] = useState(Array.isArray(match?.reportFiles) ? match.reportFiles : []);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [viewingFile, setViewingFile] = useState(null);
  const [loadingFileId, setLoadingFileId] = useState(null);
  const fileInputRef = useRef(null);

  const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
  const MAX_SIZE = 5 * 1024 * 1024;

  const validateFile = (file) => {
    if (!ACCEPTED.includes(file.type)) return 'Tipo no soportado. Usa JPG, PNG, WebP o PDF.';
    if (file.size > MAX_SIZE) return `El archivo supera 5 MB (${formatFileSize(file.size)}).`;
    if (files.length >= 10) return 'Máximo 10 archivos por partido.';
    return null;
  };

  const handleUpload = async (file) => {
    const err = validateFile(file);
    if (err) { setError(err); return; }

    setError('');
    setUploading(true);
    setUploadProgress(0);

    const interval = setInterval(() => {
      setUploadProgress(p => Math.min(p + 12, 88));
    }, 120);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(`${API_URL}/matches/${match.id}/reports`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: formData,
      });

      clearInterval(interval);

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al subir el archivo.');
      }

      setUploadProgress(100);
      await refreshFiles();
      onFilesChanged && onFilesChanged();
    } catch (e) {
      clearInterval(interval);
      setError(e.message);
    } finally {
      setTimeout(() => { setUploading(false); setUploadProgress(0); }, 700);
    }
  };

  const refreshFiles = async () => {
    try {
      const res = await fetch(`${API_URL}/matches/${match.id}/reports`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setFiles(data);
      }
    } catch (_) {}
  };

  const handleDelete = async (fileId) => {
    if (!window.confirm('¿Eliminar este archivo? Esta acción no se puede deshacer.')) return;
    setLoadingFileId(fileId);
    try {
      const res = await fetch(`${API_URL}/matches/${match.id}/reports/${fileId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        setFiles(prev => prev.filter(f => f.id !== fileId));
        onFilesChanged && onFilesChanged();
      } else {
        const data = await res.json();
        setError(data.error || 'Error al eliminar.');
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoadingFileId(null);
    }
  };

  const handleDownload = (file) => {
    const link = document.createElement('a');
    link.href = `data:${file.type};base64,${file.data}`;
    link.download = file.name;
    link.click();
  };

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) handleUpload(droppedFile);
  }, [files]);

  const isPdf = (type) => type === 'application/pdf';

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: '1rem',
          width: '100%',
          maxWidth: '540px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 24px 60px rgba(0,0,0,0.55)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* HEADER */}
        <div style={{
          padding: '1rem 1.3rem',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0,
          background: 'rgba(0,200,100,0.04)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '0.5rem',
              background: 'rgba(0,200,100,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '1px solid rgba(0,200,100,0.2)',
            }}>
              <PaperclipIcon size={17} style={{ color: 'var(--color-primary)' }} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '0.97rem', fontWeight: '700' }}>📋 Planillas del Partido</h3>
              <p style={{ margin: 0, fontSize: '0.73rem', color: 'var(--color-text-muted)' }}>
                {match.homeTeam} vs {match.awayTeam} · {match.date}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: 'var(--color-text-muted)', padding: '0.35rem',
              borderRadius: '50%', display: 'flex', alignItems: 'center',
            }}
          >
            <CloseIcon size={20} />
          </button>
        </div>

        {/* BODY */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.1rem 1.3rem', display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>

          {/* Drop Zone */}
          <div
            onDrop={onDrop}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onClick={() => !uploading && fileInputRef.current?.click()}
            style={{
              border: `2px dashed ${isDragging ? 'var(--color-primary)' : 'var(--color-border)'}`,
              borderRadius: '0.75rem',
              padding: '1.6rem 1rem',
              textAlign: 'center',
              cursor: uploading ? 'not-allowed' : 'pointer',
              background: isDragging ? 'rgba(0,200,100,0.06)' : 'rgba(255,255,255,0.015)',
              transition: 'all 0.2s',
              opacity: uploading ? 0.65 : 1,
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              style={{ display: 'none' }}
              onChange={e => { const f = e.target.files[0]; if (f) handleUpload(f); e.target.value = ''; }}
            />
            <UploadIcon size={28} style={{ color: 'var(--color-primary)', marginBottom: '0.5rem', opacity: 0.85 }} />
            <p style={{ margin: '0 0 0.2rem', fontWeight: '600', fontSize: '0.88rem', color: 'var(--color-text)' }}>
              {uploading ? 'Subiendo archivo...' : (isDragging ? 'Suelta para subir' : 'Arrastra aquí o toca para seleccionar')}
            </p>
            <p style={{ margin: 0, fontSize: '0.73rem', color: 'var(--color-text-muted)' }}>
              JPG · PNG · WebP · PDF &nbsp;|&nbsp; Máx 5 MB · hasta 10 archivos
            </p>
          </div>

          {/* Progress Bar */}
          {uploading && (
            <div style={{ borderRadius: '8px', overflow: 'hidden', background: 'rgba(255,255,255,0.06)', height: '5px' }}>
              <div style={{
                height: '100%',
                width: `${uploadProgress}%`,
                background: 'linear-gradient(90deg, var(--color-primary), #00e5ff)',
                borderRadius: '8px',
                transition: 'width 0.15s ease',
              }} />
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{
              padding: '0.6rem 0.85rem',
              background: 'rgba(255,42,95,0.08)',
              border: '1px solid rgba(255,42,95,0.25)',
              borderRadius: '0.5rem',
              fontSize: '0.79rem',
              color: 'var(--color-red-card)',
            }}>
              ⚠️ {error}
            </div>
          )}

          {/* File List */}
          {files.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '1.2rem 0', color: 'var(--color-text-muted)' }}>
              <div style={{ fontSize: '2.2rem', marginBottom: '0.4rem', opacity: 0.35 }}>📄</div>
              <p style={{ margin: 0, fontSize: '0.83rem' }}>No hay planillas adjuntas aún.</p>
              <p style={{ margin: '0.2rem 0 0', fontSize: '0.73rem', opacity: 0.65 }}>
                Sube la foto de la planilla oficial del partido.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {files.length} archivo{files.length !== 1 ? 's' : ''} adjunto{files.length !== 1 ? 's' : ''}
              </p>
              {files.map((file) => (
                <div
                  key={file.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.7rem',
                    padding: '0.65rem 0.85rem',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '0.6rem',
                    transition: 'background 0.15s',
                  }}
                >
                  {/* Thumb */}
                  <div
                    style={{
                      width: '42px', height: '42px', flexShrink: 0,
                      borderRadius: '0.4rem', overflow: 'hidden',
                      background: 'rgba(0,0,0,0.25)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: file.data ? 'pointer' : 'default',
                      border: '1px solid var(--color-border)',
                    }}
                    onClick={() => file.data && setViewingFile(file)}
                    title={file.data ? 'Ver archivo' : ''}
                  >
                    {file.data && !isPdf(file.type) ? (
                      <img
                        src={`data:${file.type};base64,${file.data}`}
                        alt={file.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <span style={{ fontSize: '1.3rem' }}>{isPdf(file.type) ? '📄' : '🖼️'}</span>
                    )}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: '0.81rem', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {file.name}
                    </p>
                    <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                      {formatFileSize(file.size)} · {formatDate(file.uploadedAt)}
                    </p>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '0.28rem', flexShrink: 0 }}>
                    {file.data && (
                      <>
                        <button
                          onClick={() => setViewingFile(file)}
                          title="Ver archivo"
                          style={{
                            background: 'rgba(0,200,100,0.08)', border: '1px solid rgba(0,200,100,0.2)',
                            borderRadius: '0.4rem', padding: '0.32rem 0.45rem',
                            cursor: 'pointer', color: 'var(--color-primary)',
                            fontSize: '0.78rem', display: 'flex', alignItems: 'center',
                          }}
                        >👁️</button>
                        <button
                          onClick={() => handleDownload(file)}
                          title="Descargar"
                          style={{
                            background: 'rgba(255,255,255,0.04)', border: '1px solid var(--color-border)',
                            borderRadius: '0.4rem', padding: '0.32rem 0.45rem',
                            cursor: 'pointer', color: 'var(--color-text-muted)',
                            display: 'flex', alignItems: 'center',
                          }}
                        >
                          <DownloadIcon size={12} />
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => handleDelete(file.id)}
                      title="Eliminar"
                      disabled={loadingFileId === file.id}
                      style={{
                        background: 'rgba(255,42,95,0.07)', border: '1px solid rgba(255,42,95,0.2)',
                        borderRadius: '0.4rem', padding: '0.32rem 0.45rem',
                        cursor: loadingFileId === file.id ? 'not-allowed' : 'pointer',
                        color: 'var(--color-red-card)',
                        opacity: loadingFileId === file.id ? 0.45 : 1,
                        display: 'flex', alignItems: 'center',
                      }}
                    >
                      <TrashIcon size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div style={{
          padding: '0.85rem 1.3rem',
          borderTop: '1px solid var(--color-border)',
          flexShrink: 0,
          display: 'flex', justifyContent: 'flex-end',
        }}>
          <button className="btn btn-secondary" onClick={onClose} style={{ fontSize: '0.83rem' }}>
            Cerrar
          </button>
        </div>
      </div>

      {/* FILE VIEWER */}
      {viewingFile && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 10000,
            background: 'rgba(0,0,0,0.93)',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            padding: '1rem',
          }}
          onClick={() => setViewingFile(null)}
        >
          <div
            style={{ position: 'absolute', top: '1rem', right: '1rem', display: 'flex', gap: '0.5rem' }}
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => handleDownload(viewingFile)}
              style={{
                background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.22)',
                borderRadius: '0.5rem', padding: '0.45rem 0.85rem',
                color: '#fff', cursor: 'pointer', fontSize: '0.8rem',
                display: 'flex', alignItems: 'center', gap: '0.4rem',
              }}
            >
              <DownloadIcon size={13} /> Descargar
            </button>
            <button
              onClick={() => setViewingFile(null)}
              style={{
                background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.22)',
                borderRadius: '0.5rem', padding: '0.45rem',
                color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center',
              }}
            >
              <CloseIcon size={17} />
            </button>
          </div>

          {isPdf(viewingFile.type) ? (
            <embed
              src={`data:application/pdf;base64,${viewingFile.data}`}
              type="application/pdf"
              style={{ width: '90vw', height: '85vh', borderRadius: '0.5rem' }}
              onClick={e => e.stopPropagation()}
            />
          ) : (
            <img
              src={`data:${viewingFile.type};base64,${viewingFile.data}`}
              alt={viewingFile.name}
              style={{
                maxWidth: '92vw', maxHeight: '86vh',
                objectFit: 'contain', borderRadius: '0.5rem',
                boxShadow: '0 8px 48px rgba(0,0,0,0.7)',
              }}
              onClick={e => e.stopPropagation()}
            />
          )}
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.72rem', marginTop: '0.65rem' }}>
            {viewingFile.name} · Toca fuera para cerrar
          </p>
        </div>
      )}
    </div>
  );
};

export default ReportUploadModal;
