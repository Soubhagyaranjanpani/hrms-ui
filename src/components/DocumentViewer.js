import React, { useState, useEffect } from 'react';
import { FaTimes, FaDownload, FaSearchPlus, FaSearchMinus, FaExpand, FaCompress } from 'react-icons/fa';

/**
 * DocumentViewer - Reusable document viewer modal
 *
 * Props:
 *   url        {string}   - The full URL to view (required)
 *   fileName   {string}   - Display name shown in header (required)
 *   onClose    {function} - Called when user closes the viewer (required)
 *   onDownload {function} - Called when user clicks download (optional)
 */
const DocumentViewer = ({ url, fileName, onClose, onDownload }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [fullscreen, setFullscreen] = useState(false);

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  // Prevent body scroll while modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const getFileExtension = (name) => {
    if (!name) return '';
    return name.split('.').pop().toLowerCase();
  };

  const ext = getFileExtension(fileName);
  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(ext);
  const isPdf = ext === 'pdf';
  const isOffice = ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(ext);
  const isText = ['txt', 'csv', 'json', 'xml'].includes(ext);

  const handleZoomIn = () => setZoom(z => Math.min(z + 25, 200));
  const handleZoomOut = () => setZoom(z => Math.max(z - 25, 50));
  const toggleFullscreen = () => setFullscreen(f => !f);

  const modalStyle = {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    zIndex: 9999,
    background: 'rgba(0, 0, 0, 0.75)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  };

  const containerStyle = {
    background: '#fff',
    borderRadius: fullscreen ? 0 : '16px',
    display: 'flex',
    flexDirection: 'column',
    width: fullscreen ? '100vw' : 'min(90vw, 1000px)',
    height: fullscreen ? '100vh' : 'min(90vh, 800px)',
    overflow: 'hidden',
    boxShadow: '0 25px 60px rgba(0,0,0,0.4)',
  };

  const headerStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 20px',
    borderBottom: '1px solid #e2e8f0',
    background: '#f8fafc',
    flexShrink: 0,
    gap: '12px',
  };

  const toolbarStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  };

  const iconBtnStyle = {
    background: 'none',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '6px 10px',
    cursor: 'pointer',
    color: '#475569',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '13px',
    fontWeight: '500',
    transition: 'all 0.15s',
  };

  const closeStyle = {
    ...iconBtnStyle,
    border: 'none',
    color: '#64748b',
    padding: '6px 8px',
  };

  const bodyStyle = {
    flex: 1,
    overflow: 'auto',
    display: 'flex',
    alignItems: isImage ? 'center' : 'stretch',
    justifyContent: isImage ? 'center' : 'stretch',
    background: '#f1f5f9',
    position: 'relative',
  };

  const renderContent = () => {
    if (error) {
      return (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
          <p style={{ fontSize: '16px', fontWeight: '500', marginBottom: '8px' }}>
            Unable to display this file
          </p>
          <small>Try downloading the file to view it on your device.</small>
        </div>
      );
    }

    if (isPdf) {
      return (
        <>
          {loading && <LoadingOverlay />}
          <iframe
            src={url}
            title={fileName}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              display: loading ? 'none' : 'block',
            }}
            onLoad={() => setLoading(false)}
            onError={() => { setLoading(false); setError(true); }}
          />
        </>
      );
    }

    if (isImage) {
      return (
        <>
          {loading && <LoadingOverlay />}
          <img
            src={url}
            alt={fileName}
            style={{
              maxWidth: `${zoom}%`,
              maxHeight: '100%',
              objectFit: 'contain',
              display: loading ? 'none' : 'block',
              transition: 'max-width 0.2s ease',
            }}
            onLoad={() => setLoading(false)}
            onError={() => { setLoading(false); setError(true); }}
          />
        </>
      );
    }

    if (isOffice) {
      // Use Google Docs viewer for Office files
      const googleViewerUrl = `https://docs.google.com/gview?url=${encodeURIComponent(url)}&embedded=true`;
      return (
        <>
          {loading && <LoadingOverlay />}
          <iframe
            src={googleViewerUrl}
            title={fileName}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              display: loading ? 'none' : 'block',
            }}
            onLoad={() => setLoading(false)}
            onError={() => { setLoading(false); setError(true); }}
          />
        </>
      );
    }

    if (isText) {
      return (
        <>
          {loading && <LoadingOverlay />}
          <iframe
            src={url}
            title={fileName}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              background: '#fff',
              display: loading ? 'none' : 'block',
              fontFamily: 'monospace',
            }}
            onLoad={() => setLoading(false)}
            onError={() => { setLoading(false); setError(true); }}
          />
        </>
      );
    }

    // Unsupported format
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📄</div>
        <p style={{ fontSize: '16px', fontWeight: '500', marginBottom: '8px' }}>
          Preview not available for this file type
        </p>
        <small>Download the file to open it with an appropriate application.</small>
        {onDownload && (
          <div style={{ marginTop: '20px' }}>
            <button
              onClick={onDownload}
              style={{
                padding: '10px 24px',
                background: '#2d9c7c',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '500',
              }}
            >
              Download File
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={modalStyle} onClick={onClose}>
      <div style={containerStyle} onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div style={headerStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
            <FileTypeIcon ext={ext} />
            <span style={{
              fontSize: '14px',
              fontWeight: '500',
              color: '#1e293b',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: '300px',
            }}>
              {fileName}
            </span>
          </div>

          <div style={toolbarStyle}>
            {/* Zoom controls only for images */}
            {isImage && (
              <>
                <button
                  style={iconBtnStyle}
                  onClick={handleZoomOut}
                  disabled={zoom <= 50}
                  title="Zoom out"
                >
                  <FaSearchMinus size={12} />
                </button>
                <span style={{ fontSize: '12px', color: '#64748b', minWidth: '40px', textAlign: 'center' }}>
                  {zoom}%
                </span>
                <button
                  style={iconBtnStyle}
                  onClick={handleZoomIn}
                  disabled={zoom >= 200}
                  title="Zoom in"
                >
                  <FaSearchPlus size={12} />
                </button>
                <div style={{ width: '1px', height: '20px', background: '#e2e8f0', margin: '0 4px' }} />
              </>
            )}

            {/* Fullscreen toggle */}
            <button style={iconBtnStyle} onClick={toggleFullscreen} title={fullscreen ? 'Exit fullscreen' : 'Fullscreen'}>
              {fullscreen ? <FaCompress size={12} /> : <FaExpand size={12} />}
            </button>

            {/* Download */}
            {onDownload && (
              <button style={{ ...iconBtnStyle, color: '#3498db' }} onClick={onDownload} title="Download">
                <FaDownload size={12} /> Download
              </button>
            )}

            {/* Close */}
            <button style={closeStyle} onClick={onClose} title="Close (Esc)">
              <FaTimes size={14} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={bodyStyle}>
          {renderContent()}
        </div>

      </div>
    </div>
  );
};

// ── Internal sub-components ───────────────────────────────────────────────────

const LoadingOverlay = () => (
  <div style={{
    position: 'absolute',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#f1f5f9',
    zIndex: 1,
  }}>
    <div style={{
      width: '40px',
      height: '40px',
      borderRadius: '50%',
      border: '3px solid #e2e8f0',
      borderTopColor: '#2d9c7c',
      animation: 'spin 0.8s linear infinite',
      marginBottom: '14px',
    }} />
    <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>Loading document...</p>
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

const FileTypeIcon = ({ ext }) => {
  const iconMap = {
    pdf: { bg: '#fef2f2', color: '#e74c3c', label: 'PDF' },
    doc: { bg: '#eff6ff', color: '#3498db', label: 'DOC' },
    docx: { bg: '#eff6ff', color: '#3498db', label: 'DOC' },
    xls: { bg: '#f0fdf4', color: '#27ae60', label: 'XLS' },
    xlsx: { bg: '#f0fdf4', color: '#27ae60', label: 'XLS' },
    jpg: { bg: '#fffbeb', color: '#f39c12', label: 'IMG' },
    jpeg: { bg: '#fffbeb', color: '#f39c12', label: 'IMG' },
    png: { bg: '#fffbeb', color: '#f39c12', label: 'IMG' },
    gif: { bg: '#fffbeb', color: '#f39c12', label: 'IMG' },
    txt: { bg: '#f8fafc', color: '#64748b', label: 'TXT' },
  };
  const icon = iconMap[ext] || { bg: '#f8fafc', color: '#64748b', label: 'FILE' };
  return (
    <div style={{
      background: icon.bg,
      color: icon.color,
      borderRadius: '6px',
      padding: '3px 7px',
      fontSize: '11px',
      fontWeight: '600',
      letterSpacing: '0.5px',
      flexShrink: 0,
    }}>
      {icon.label}
    </div>
  );
};

export default DocumentViewer;