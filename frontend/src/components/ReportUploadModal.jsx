import React, { useState, useRef, useCallback, useEffect } from 'react';
import { 
  TrashIcon, 
  DownloadIcon, 
  CloseIcon, 
  PaperclipIcon, 
  FileImageIcon, 
  UploadIcon, 
  CameraIcon, 
  EyeIcon, 
  RotateIcon, 
  FileTextIcon, 
  AlertCircle 
} from './Icons';

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
  return new Date(iso).toLocaleDateString('es-CO', {
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
  const [imageRotation, setImageRotation] = useState(0);
  const [loadingFileId, setLoadingFileId] = useState(null);

  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  useEffect(() => {
    if (match?.id) {
      refreshFiles();
    }
  }, [match?.id]);

  const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
  const MAX_SIZE = 8 * 1024 * 1024; // 8 MB

  const validateFile = (file) => {
    if (!ACCEPTED.includes(file.type)) return 'Formato no compatible. Solo JPG, PNG, WebP o PDF.';
    if (file.size > MAX_SIZE) return `El archivo supera 8 MB (${formatFileSize(file.size)}).`;
    if (files.length >= 10) return 'Límite alcanzado: máximo 10 archivos por partido.';
    return null;
  };

  const handleUploadSingle = async (file) => {
    const err = validateFile(file);
    if (err) { 
      setError(err); 
      return false; 
    }

    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`${API_URL}/matches/${match.id}/reports`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: formData,
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Error al subir el archivo.');
    }
    return true;
  };

  const handleFilesSelected = async (fileList) => {
    if (!fileList || fileList.length === 0) return;
    const incomingFiles = Array.from(fileList);
    
    setError('');
    setUploading(true);
    setUploadProgress(15);

    try {
      for (let i = 0; i < incomingFiles.length; i++) {
        await handleUploadSingle(incomingFiles[i]);
        setUploadProgress(Math.round(((i + 1) / incomingFiles.length) * 100));
      }
      await refreshFiles();
      onFilesChanged && onFilesChanged();
    } catch (e) {
      setError(e.message);
    } finally {
      setTimeout(() => {
        setUploading(false);
        setUploadProgress(0);
      }, 500);
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
    if (!window.confirm('¿Deseas eliminar este informe adjunto? Esta acción no se puede deshacer.')) return;
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
        setError(data.error || 'Error al eliminar el archivo.');
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

  const handleOpenFileViewer = (file) => {
    setImageRotation(0);
    setViewingFile(file);
  };

  const handleRotate = () => {
    setImageRotation(prev => (prev + 90) % 360);
  };

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesSelected(e.dataTransfer.files);
    }
  }, [files]);

  const isPdf = (type) => type === 'application/pdf';

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)',
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
          maxWidth: '560px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 24px 60px rgba(0,0,0,0.6)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* HEADER */}
        <div style={{
          padding: '1.1rem 1.4rem',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0,
          background: 'rgba(0,200,100,0.03)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '38px', height: '38px', borderRadius: '0.5rem',
              background: 'rgba(0,200,100,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '1px solid rgba(0,200,100,0.25)',
              color: 'var(--color-primary)',
            }}>
              <PaperclipIcon size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '700', color: 'var(--color-text)' }}>
                Informes y Planillas Oficiales
              </h3>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                {match.homeTeam} vs {match.awayTeam} &bull; {match.date}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: 'var(--color-text-muted)', padding: '0.4rem',
              borderRadius: '50%', display: 'flex', alignItems: 'center',
            }}
            aria-label="Cerrar ventana"
          >
            <CloseIcon size={20} />
          </button>
        </div>

        {/* BODY */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem 1.4rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* Action Buttons: Camera + File Picker */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
            {/* Camera Button (for smartphones) */}
            <button
              type="button"
              className="btn btn-primary"
              disabled={uploading}
              onClick={() => cameraInputRef.current?.click()}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                padding: '0.7rem 1rem',
                fontSize: '0.85rem',
                fontWeight: '700',
              }}
            >
              <CameraIcon size={18} />
              <span>Tomar Foto</span>
            </button>

            {/* Gallery / File Button */}
            <button
              type="button"
              className="btn btn-secondary"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                padding: '0.7rem 1rem',
                fontSize: '0.85rem',
                fontWeight: '600',
              }}
            >
              <UploadIcon size={18} />
              <span>Subir Archivos</span>
            </button>

            {/* Hidden Input: Camera Capture */}
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              style={{ display: 'none' }}
              onChange={e => {
                if (e.target.files) handleFilesSelected(e.target.files);
                e.target.value = '';
              }}
            />

            {/* Hidden Input: Multi-file picker */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp,application/pdf"
              style={{ display: 'none' }}
              onChange={e => {
                if (e.target.files) handleFilesSelected(e.target.files);
                e.target.value = '';
              }}
            />
          </div>

          {/* Drag & Drop Zone */}
          <div
            onDrop={onDrop}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onClick={() => !uploading && fileInputRef.current?.click()}
            style={{
              border: `2px dashed ${isDragging ? 'var(--color-primary)' : 'var(--color-border)'}`,
              borderRadius: '0.75rem',
              padding: '1.25rem 1rem',
              textAlign: 'center',
              cursor: uploading ? 'not-allowed' : 'pointer',
              background: isDragging ? 'rgba(0,200,100,0.06)' : 'rgba(255,255,255,0.015)',
              transition: 'all 0.2s',
              opacity: uploading ? 0.65 : 1,
            }}
          >
            <p style={{ margin: '0 0 0.25rem', fontWeight: '600', fontSize: '0.85rem', color: 'var(--color-text)' }}>
              {uploading ? 'Subiendo informe...' : (isDragging ? 'Suelta aquí los archivos' : 'O arrastra tus fotos y planillas aquí')}
            </p>
            <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
              Formatos soportados: JPG, PNG, WebP o PDF &bull; Máx. 8 MB por archivo
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
                transition: 'width 0.2s ease',
              }} />
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div style={{
              padding: '0.65rem 0.85rem',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '0.5rem',
              fontSize: '0.8rem',
              color: 'var(--color-red-card)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* File List */}
          {files.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '1.5rem 0', color: 'var(--color-text-muted)' }}>
              <div style={{ color: 'var(--color-text-muted)', opacity: 0.35, display: 'flex', justifyContent: 'center', marginBottom: '0.5rem' }}>
                <FileTextIcon size={40} />
              </div>
              <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: '600' }}>No hay planillas adjuntas aún</p>
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', opacity: 0.7 }}>
                Toma una foto con tu celular o selecciona el informe del partido para adjuntarlo.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Archivos Adjuntos ({files.length})
              </p>
              {files.map((file) => (
                <div
                  key={file.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                    padding: '0.65rem 0.85rem',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '0.6rem',
                  }}
                >
                  {/* Thumbnail / Icon */}
                  <div
                    style={{
                      width: '44px', height: '44px', flexShrink: 0,
                      borderRadius: '0.45rem', overflow: 'hidden',
                      background: 'rgba(0,0,0,0.25)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: file.data ? 'pointer' : 'default',
                      border: '1px solid var(--color-border)',
                      color: 'var(--color-primary)',
                    }}
                    onClick={() => file.data && handleOpenFileViewer(file)}
                    title={file.data ? 'Ver en tamaño completo' : ''}
                  >
                    {file.data && !isPdf(file.type) ? (
                      <img
                        src={`data:${file.type};base64,${file.data}`}
                        alt={file.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      isPdf(file.type) ? <FileTextIcon size={22} /> : <FileImageIcon size={22} />
                    )}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: '0.82rem', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {file.name}
                    </p>
                    <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                      {formatFileSize(file.size)} &bull; {formatDate(file.uploadedAt)}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', gap: '0.35rem', flexShrink: 0 }}>
                    {file.data && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleOpenFileViewer(file)}
                          title="Visualizar informe"
                          style={{
                            background: 'rgba(0,200,100,0.08)',
                            border: '1px solid rgba(0,200,100,0.25)',
                            borderRadius: '0.4rem',
                            padding: '0.35rem 0.55rem',
                            cursor: 'pointer',
                            color: 'var(--color-primary)',
                            display: 'flex',
                            alignItems: 'center',
                          }}
                        >
                          <EyeIcon size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDownload(file)}
                          title="Descargar archivo"
                          style={{
                            background: 'rgba(255,255,255,0.04)',
                            border: '1px solid var(--color-border)',
                            borderRadius: '0.4rem',
                            padding: '0.35rem 0.55rem',
                            cursor: 'pointer',
                            color: 'var(--color-text-muted)',
                            display: 'flex',
                            alignItems: 'center',
                          }}
                        >
                          <DownloadIcon size={14} />
                        </button>
                      </>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDelete(file.id)}
                      title="Eliminar archivo"
                      disabled={loadingFileId === file.id}
                      style={{
                        background: 'rgba(239, 68, 68, 0.08)',
                        border: '1px solid rgba(239, 68, 68, 0.25)',
                        borderRadius: '0.4rem',
                        padding: '0.35rem 0.55rem',
                        cursor: loadingFileId === file.id ? 'not-allowed' : 'pointer',
                        color: 'var(--color-red-card)',
                        opacity: loadingFileId === file.id ? 0.45 : 1,
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      <TrashIcon size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div style={{
          padding: '0.9rem 1.4rem',
          borderTop: '1px solid var(--color-border)',
          flexShrink: 0,
          display: 'flex',
          justifyContent: 'flex-end',
        }}>
          <button className="btn btn-secondary" onClick={onClose} style={{ fontSize: '0.85rem' }}>
            Listo / Cerrar
          </button>
        </div>
      </div>

      {/* FULLSCREEN LIGHTBOX VIEWER */}
      {viewingFile && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 10000,
            background: 'rgba(0,0,0,0.94)',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            padding: '1rem',
          }}
          onClick={() => setViewingFile(null)}
        >
          {/* Top Control Bar */}
          <div
            style={{
              position: 'absolute', top: '1rem', right: '1rem',
              display: 'flex', gap: '0.5rem', alignItems: 'center',
            }}
            onClick={e => e.stopPropagation()}
          >
            {!isPdf(viewingFile.type) && (
              <button
                type="button"
                onClick={handleRotate}
                style={{
                  background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.22)',
                  borderRadius: '0.5rem', padding: '0.45rem 0.85rem',
                  color: '#fff', cursor: 'pointer', fontSize: '0.8rem',
                  display: 'flex', alignItems: 'center', gap: '0.4rem',
                }}
                title="Girar foto 90 grados"
              >
                <RotateIcon size={14} /> Girar
              </button>
            )}
            <button
              type="button"
              onClick={() => handleDownload(viewingFile)}
              style={{
                background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.22)',
                borderRadius: '0.5rem', padding: '0.45rem 0.85rem',
                color: '#fff', cursor: 'pointer', fontSize: '0.8rem',
                display: 'flex', alignItems: 'center', gap: '0.4rem',
              }}
            >
              <DownloadIcon size={14} /> Descargar
            </button>
            <button
              type="button"
              onClick={() => setViewingFile(null)}
              style={{
                background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.22)',
                borderRadius: '0.5rem', padding: '0.45rem',
                color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center',
              }}
              title="Cerrar vista previa"
            >
              <CloseIcon size={18} />
            </button>
          </div>

          {/* Content */}
          {isPdf(viewingFile.type) ? (
            <embed
              src={`data:application/pdf;base64,${viewingFile.data}`}
              type="application/pdf"
              style={{ width: '90vw', height: '85vh', borderRadius: '0.5rem' }}
              onClick={e => e.stopPropagation()}
            />
          ) : (
            <div
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                maxWidth: '92vw', maxHeight: '85vh',
                transition: 'transform 0.25s ease',
                transform: `rotate(${imageRotation}deg)`,
              }}
              onClick={e => e.stopPropagation()}
            >
              <img
                src={`data:${viewingFile.type};base64,${viewingFile.data}`}
                alt={viewingFile.name}
                style={{
                  maxWidth: imageRotation % 180 !== 0 ? '75vh' : '90vw',
                  maxHeight: imageRotation % 180 !== 0 ? '80vw' : '82vh',
                  objectFit: 'contain',
                  borderRadius: '0.5rem',
                  boxShadow: '0 12px 48px rgba(0,0,0,0.8)',
                }}
              />
            </div>
          )}
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem', marginTop: '0.75rem' }}>
            {viewingFile.name} &bull; Toca fuera para cerrar
          </p>
        </div>
      )}
    </div>
  );
};

export default ReportUploadModal;
