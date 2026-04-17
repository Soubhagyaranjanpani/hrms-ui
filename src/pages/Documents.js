import React, { useState, useEffect, useCallback } from 'react';
import { 
  FaFilePdf, FaFileWord, FaFileExcel, FaFileImage, FaFile,
  FaDownload, FaEye, FaTrash, FaUpload, FaTimes, FaFolder
} from 'react-icons/fa';
import { toast } from '../components/Toast';
import { BASE_URL, STORAGE_KEYS } from '../config/api.config';
import axios from 'axios';
import DocumentViewer from '../components/DocumentViewer'; // adjust path as needed

const Documents = ({ user }) => {
  const [view, setView] = useState('list');
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState(null);

  // ── Viewer state ─────────────────────────────────────────────────────────────
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerUrl, setViewerUrl] = useState('');
  const [viewerFileName, setViewerFileName] = useState('');
  const [viewerDocId, setViewerDocId] = useState(null); // kept for download callback
  // ─────────────────────────────────────────────────────────────────────────────
  
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadCategory, setUploadCategory] = useState('OTHER');
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const getEmployeeId = () => {
    if (user?.employeeId) return user.employeeId;
    if (user?.id) return user.id;
    if (user?.empId) return user.empId;
    
    const userData = localStorage.getItem(STORAGE_KEYS.USER_DATA);
    if (userData) {
      try {
        const parsed = JSON.parse(userData);
        return parsed.employeeId || parsed.id || parsed.empId;
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }
    
    const empId = localStorage.getItem(STORAGE_KEYS.EMPLOYEE_ID);
    if (empId) return empId;
    
    return null;
  };

  const employeeId = getEmployeeId();

  const categories = ['All', 'SERVICE_BOOK', 'EDUCATION', 'ID_PROOF', 'EXPERIENCE', 'MEDICAL', 'OTHER'];
  
  const categoryDisplayNames = {
    'SERVICE_BOOK': 'Service Book',
    'EDUCATION': 'Education',
    'ID_PROOF': 'ID Proof',
    'EXPERIENCE': 'Experience',
    'MEDICAL': 'Medical',
    'OTHER': 'Other'
  };

  const categoryColors = {
    'SERVICE_BOOK': '#3498db',
    'EDUCATION': '#2d9c7c',
    'ID_PROOF': '#e74c3c',
    'EXPERIENCE': '#f39c12',
    'MEDICAL': '#e74c3c',
    'OTHER': '#95a5a6'
  };

  const getAuthToken = () => localStorage.getItem(STORAGE_KEYS.JWT_TOKEN);
  const axiosConfig = {
    headers: {
      Authorization: `Bearer ${getAuthToken()}`,
      'Content-Type': 'application/json'
    }
  };

  // ── Build authenticated URL for a document ───────────────────────────────────
  // mode: 'V' = view inline, 'D' = force download
  const buildDocumentUrl = (documentId, mode = 'V') => {
    const token = getAuthToken();
    // We pass the JWT as a query param so the browser's native iframe/img
    // src can include auth. Your Spring Security must accept ?token= as well,
    // OR you can use the blob approach below (handleViewDocument) instead.
    return `${BASE_URL}/api/documents/file/${documentId}?mode=${mode}&token=${token}`;
  };

  // Alternative approach: fetch as blob → create object URL (works with
  // Authorization header, no need to expose JWT in query string).
  const fetchDocumentBlob = async (documentId, mode = 'V') => {
    const token = getAuthToken();
    const response = await fetch(
      `${BASE_URL}/api/documents/file/${documentId}?mode=${mode}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    if (!response.ok) {
      throw new Error(`Failed to load document: ${response.status}`);
    }
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  };
  // ─────────────────────────────────────────────────────────────────────────────

  const fetchDocuments = useCallback(async () => {
    if (!employeeId) {
      console.error('No employee ID found');
      setLoading(false);
      toast.error('Error', 'Employee ID not found. Please login again.');
      return;
    }
    
    setLoading(true);
    try {
      const response = await axios.get(
        `${BASE_URL}/api/documents/employee/${employeeId}`,
        axiosConfig
      );
      
      if (response.data?.status === 200 && response.data?.response) {
        const transformedDocs = transformDocuments(response.data.response);
        setDocuments(transformedDocs);
      } else {
        setDocuments([]);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast.error('Error', error.response?.data?.message || 'Failed to fetch documents');
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  }, [employeeId]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // Revoke blob URLs when viewer closes to avoid memory leaks
  const handleViewerClose = useCallback(() => {
    if (viewerUrl.startsWith('blob:')) {
      URL.revokeObjectURL(viewerUrl);
    }
    setViewerOpen(false);
    setViewerUrl('');
    setViewerFileName('');
    setViewerDocId(null);
  }, [viewerUrl]);

  // ── Open the viewer ───────────────────────────────────────────────────────────
  const handleViewDocument = async (doc) => {
    try {
      toast.info('Loading', `Opening ${doc.name}...`);

      // Use blob approach so Authorization header is sent (no JWT in URL)
      const blobUrl = await fetchDocumentBlob(doc.id, 'V');

      setViewerUrl(blobUrl);
      setViewerFileName(doc.name);
      setViewerDocId(doc.id);
      setViewerOpen(true);
    } catch (error) {
      console.error('View error:', error);
      toast.error('Error', 'Failed to load document for viewing');
    }
  };
  // ─────────────────────────────────────────────────────────────────────────────

  // ── Download ──────────────────────────────────────────────────────────────────
  const handleDownload = async (doc) => {
    try {
      toast.info('Download', `Downloading ${doc.name}...`);
      const blobUrl = await fetchDocumentBlob(doc.id, 'D');

      // Trigger browser download
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = doc.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Error', 'Failed to download document');
    }
  };

  // Download from inside the viewer (uses the already-open doc's id)
  const handleViewerDownload = useCallback(async () => {
    if (!viewerDocId || !viewerFileName) return;
    await handleDownload({ id: viewerDocId, name: viewerFileName });
  }, [viewerDocId, viewerFileName]);
  // ─────────────────────────────────────────────────────────────────────────────

  const transformDocuments = (apiDocs) => {
    if (!apiDocs || !Array.isArray(apiDocs)) return [];
    
    return apiDocs.map(doc => ({
      id: doc.id,
      name: doc.fileName,
      type: doc.documentType || getFileExtension(doc.fileName),
      size: formatFileSize(doc.fileSize || 0),
      category: doc.category,
      uploadedBy: doc.uploadedBy || user?.username || user?.name || 'System',
      date: formatDate(doc.uploadedAt),
      icon: getFileIcon(doc.fileName),
      filePath: doc.filePath
    }));
  };

  const getFileIcon = (fileName) => {
    if (!fileName) return <FaFile color="#95a5a6" />;
    const ext = fileName.split('.').pop().toLowerCase();
    switch(ext) {
      case 'pdf': return <FaFilePdf color="#e74c3c" />;
      case 'doc':
      case 'docx': return <FaFileWord color="#3498db" />;
      case 'xls':
      case 'xlsx': return <FaFileExcel color="#27ae60" />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif': return <FaFileImage color="#f39c12" />;
      default: return <FaFile color="#95a5a6" />;
    }
  };

  const getFileExtension = (fileName) => {
    if (!fileName) return 'UNKNOWN';
    return fileName.split('.').pop().toUpperCase();
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getCategoryDisplayName = (category) => {
    return categoryDisplayNames[category] || category;
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setErrors({});
    }
  };

  const validateUpload = () => {
    const errs = {};
    if (!selectedFile) {
      errs.file = 'Please select a file to upload';
    } else {
      const maxSize = 10 * 1024 * 1024;
      if (selectedFile.size > maxSize) {
        errs.file = 'File size should be less than 10MB';
      }
    }
    if (!uploadCategory) {
      errs.category = 'Please select a category';
    }
    return errs;
  };

  const handleUploadDocument = async () => {
    const errs = validateUpload();
    setErrors(errs);
    setTouched({ file: true, category: true });
    
    if (Object.keys(errs).length > 0) {
      toast.warning('Validation Error', 'Please fix the highlighted fields');
      return;
    }

    if (!employeeId) {
      toast.error('Error', 'Employee ID not found. Please login again.');
      return;
    }

    setUploading(true);
    try {
      const token = localStorage.getItem(STORAGE_KEYS.JWT_TOKEN);
      const formData = new FormData();
      formData.append('employeeId', employeeId);
      formData.append('category', uploadCategory);
      formData.append('file', selectedFile);

      const response = await axios.post(
        `${BASE_URL}/api/documents/upload`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          }
        }
      );

      if (response.data?.status === 200) {
        toast.success('Success', 'Document uploaded successfully');
        setView('list');
        resetUploadForm();
        fetchDocuments();
      } else {
        toast.error('Error', response.data?.message || 'Failed to upload document');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Error', error.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const resetUploadForm = () => {
    setSelectedFile(null);
    setUploadCategory('OTHER');
    setErrors({});
    setTouched({});
  };

  const handleExtractDocument = async (documentId) => {
    try {
      toast.info('Processing', 'Extracting document data...');
      const token = localStorage.getItem(STORAGE_KEYS.JWT_TOKEN);
      
      const response = await axios.post(
        `${BASE_URL}/api/documents/extract/${documentId}`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          }
        }
      );
      
      if (response.data?.status === 200) {
        toast.success('Success', 'Document data extracted successfully');
      }
    } catch (error) {
      toast.error('Error', 'Failed to extract document data');
    }
  };

  const confirmDelete = (doc) => {
    setDocumentToDelete(doc);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!documentToDelete) return;
    
    try {
      toast.success('Success', `${documentToDelete.name} deleted successfully`);
      setShowDeleteModal(false);
      setDocumentToDelete(null);
      fetchDocuments();
    } catch (error) {
      toast.error('Error', 'Failed to delete document');
    }
  };

  const filteredDocs = selectedCategory === 'All' 
    ? documents 
    : documents.filter(doc => doc.category === selectedCategory);

  const LoadingSpinner = () => (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '400px',
      background: 'white',
      borderRadius: '20px',
      padding: '40px'
    }}>
      <div style={{ position: 'relative', width: '60px', height: '60px', marginBottom: '20px' }}>
        <div style={{
          position: 'absolute', width: '100%', height: '100%', borderRadius: '50%',
          border: '3px solid transparent', borderTopColor: '#2d9c7c', borderRightColor: '#2d9c7c',
          animation: 'spin 1s linear infinite'
        }}></div>
        <div style={{
          position: 'absolute', width: '70%', height: '70%', top: '15%', left: '15%',
          borderRadius: '50%', border: '3px solid transparent',
          borderBottomColor: '#f4b942', borderLeftColor: '#f4b942',
          animation: 'spin 1s linear infinite reverse'
        }}></div>
      </div>
      <p style={{ color: '#64748b', fontSize: '16px', margin: 0, fontWeight: '500' }}>
        Loading documents...
      </p>
      <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (loading) {
    return (
      <div className="emp-root">
        <div className="emp-header">
          <div className="emp-header-left">
            <div>
              <h1 className="emp-title">Document Management</h1>
              <p className="emp-subtitle">Loading your documents...</p>
            </div>
          </div>
        </div>
        <LoadingSpinner />
      </div>
    );
  }

  if (!employeeId) {
    return (
      <div className="emp-root">
        <div className="emp-header">
          <div className="emp-header-left">
            <div>
              <h1 className="emp-title">Document Management</h1>
              <p className="emp-subtitle">Error</p>
            </div>
          </div>
        </div>
        <div className="emp-table-card">
          <div className="emp-empty-inner">
            <span className="emp-empty-icon">⚠️</span>
            <p>Employee ID not found</p>
            <small>Please login again or contact administrator</small>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="emp-root">

      {/* ── DocumentViewer modal — rendered here, driven by state ─────────────── */}
      {viewerOpen && (
        <DocumentViewer
          url={viewerUrl}
          fileName={viewerFileName}
          onClose={handleViewerClose}
          onDownload={handleViewerDownload}
        />
      )}
      {/* ──────────────────────────────────────────────────────────────────────── */}

      {/* Header */}
      <div className="emp-header" style={view === 'upload' ? { justifyContent: 'space-between' } : {}}>
        {view === 'upload' ? (
          <>
            <div>
              <h1 className="emp-title">Upload Document</h1>
              <p className="emp-subtitle">Select a file and category to upload</p>
            </div>
            <button className="emp-back-btn" onClick={() => { setView('list'); resetUploadForm(); }}>
              <FaTimes size={12} style={{ marginRight: '6px' }} /> Cancel
            </button>
          </>
        ) : (
          <>
            <div className="emp-header-left">
              <div>
                <h1 className="emp-title">Document Management</h1>
                <p className="emp-subtitle">{documents.length} documents</p>
              </div>
            </div>
            <button className="emp-add-btn" onClick={() => setView('upload')}>
              <FaUpload size={13} /> Upload Document
            </button>
          </>
        )}
      </div>

      {/* List View */}
      {view === 'list' && (
        <>
          {/* Categories Filter */}
          <div className="emp-search-bar" style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '20px',
                    border: selectedCategory === cat ? '2px solid #2d9c7c' : '1px solid #e2e8f0',
                    background: selectedCategory === cat ? '#2d9c7c' : 'white',
                    color: selectedCategory === cat ? 'white' : '#475569',
                    fontSize: '13px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {cat === 'All' ? 'All' : getCategoryDisplayName(cat)}
                </button>
              ))}
            </div>
          </div>

          {/* Documents Table */}
          <div className="emp-table-card">
            <div className="emp-table-wrap">
              <table className="emp-table">
                <thead>
                  <tr>
                    <th style={{ width: 44 }}>#</th>
                    <th>File Name</th>
                    <th>Category</th>
                    <th>Size</th>
                    <th>Uploaded</th>
                    <th style={{ width: 120, textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDocs.length > 0 ? filteredDocs.map((doc, idx) => (
                    <tr key={doc.id} className="emp-row">
                      <td className="emp-sno">{idx + 1}</td>
                      <td>
                        <div className="emp-info-cell">
                          <div className="emp-avatar" style={{ 
                            background: '#f0fdf4', 
                            color: categoryColors[doc.category] || '#2d9c7c',
                            fontSize: '16px'
                          }}>
                            {doc.icon}
                          </div>
                          <div>
                            <div className="emp-name">{doc.name}</div>
                            <div className="emp-email">{doc.type} • {doc.uploadedBy}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="emp-pill" style={{ 
                          background: (categoryColors[doc.category] || '#95a5a6') + '20',
                          color: categoryColors[doc.category] || '#95a5a6'
                        }}>
                          {getCategoryDisplayName(doc.category)}
                        </span>
                      </td>
                      <td className="emp-branch">{doc.size}</td>
                      <td className="emp-date">{doc.date}</td>
                      <td>
                        <div className="emp-actions">
                          {/* ── View button now opens DocumentViewer ── */}
                          <button 
                            className="emp-act emp-act--edit" 
                            onClick={() => handleViewDocument(doc)}
                            title="View Document"
                          >
                            <FaEye size={12} />
                          </button>
                          {/* <button 
                            className="emp-act" 
                            onClick={() => handleDownload(doc)}
                            title="Download"
                            style={{ color: '#3498db' }}
                          >
                            <FaDownload size={12} />
                          </button>
                          <button 
                            className="emp-act emp-act--del" 
                            onClick={() => confirmDelete(doc)}
                            title="Delete"
                          >
                            <FaTrash size={12} />
                          </button> */}
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="6" className="emp-empty">
                        <div className="emp-empty-inner">
                          <span className="emp-empty-icon"><FaFolder size={48} color="#cbd5e1" /></span>
                          <p>No documents found</p>
                          <small>Upload your first document to get started</small>
                          <button 
                            className="emp-add-btn" 
                            onClick={() => setView('upload')}
                            style={{ marginTop: '16px' }}
                          >
                            <FaUpload size={13} /> Upload Document
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Upload Form View */}
      {view === 'upload' && (
        <div className="emp-form-wrap">
          <div className="emp-form-section">
            <div className="emp-section-label">Document Details</div>
            <div className="emp-form-grid">
              
              <div className={`emp-field ${errors.category ? 'has-error' : ''}`}>
                <label>Category <span className="req">*</span></label>
                <select
                  value={uploadCategory}
                  onChange={(e) => {
                    setUploadCategory(e.target.value);
                    if (touched.category) {
                      setErrors(prev => ({ ...prev, category: '' }));
                    }
                  }}
                  onBlur={() => setTouched(prev => ({ ...prev, category: true }))}
                >
                  {categories.filter(c => c !== 'All').map(cat => (
                    <option key={cat} value={cat}>{getCategoryDisplayName(cat)}</option>
                  ))}
                </select>
                {errors.category && (
                  <span className="field-err">
                    <FaTimes size={10} /> {errors.category}
                  </span>
                )}
              </div>

              <div className={`emp-field ${errors.file ? 'has-error' : ''}`} style={{ gridColumn: 'span 2' }}>
                <label>Select File <span className="req">*</span></label>
                <div 
                  onClick={() => document.getElementById('fileInput').click()}
                  style={{
                    border: `2px dashed ${errors.file ? '#e74c3c' : '#2d9c7c'}`,
                    borderRadius: '12px',
                    padding: '40px',
                    textAlign: 'center',
                    background: '#f8fafc',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <input
                    id="fileInput"
                    type="file"
                    style={{ display: 'none' }}
                    onChange={handleFileSelect}
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                  />
                  <FaUpload style={{ fontSize: '48px', color: errors.file ? '#e74c3c' : '#2d9c7c', marginBottom: '16px' }} />
                  {selectedFile ? (
                    <div>
                      <p style={{ fontWeight: '600', marginBottom: '4px', color: '#1e293b' }}>
                        {selectedFile.name}
                      </p>
                      <p style={{ fontSize: '13px', color: '#64748b' }}>
                        {formatFileSize(selectedFile.size)}
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p style={{ fontWeight: '600', marginBottom: '4px', color: '#1e293b' }}>
                        Click to select a file
                      </p>
                      <p style={{ fontSize: '13px', color: '#64748b' }}>
                        or drag and drop here
                      </p>
                    </div>
                  )}
                </div>
                {errors.file && (
                  <span className="field-err">
                    <FaTimes size={10} /> {errors.file}
                  </span>
                )}
                <small className="emp-hint-text" style={{ marginTop: '8px', display: 'block' }}>
                  Supported formats: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG (Max 10MB)
                </small>
              </div>
            </div>
          </div>

          <div className="emp-form-footer">
            <button 
              type="button" 
              className="emp-cancel-btn" 
              onClick={() => { setView('list'); resetUploadForm(); }}
            >
              Cancel
            </button>
            <button 
              type="button" 
              className="emp-submit-btn" 
              onClick={handleUploadDocument}
              disabled={uploading}
            >
              {uploading ? (
                <><span className="emp-spinner" /> Uploading...</>
              ) : (
                <><FaUpload size={12} /> Upload Document</>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && documentToDelete && (
        <div className="emp-modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="emp-modal" onClick={(e) => e.stopPropagation()}>
            <div className="emp-modal-icon"><FaTrash size={18} /></div>
            <h3 className="emp-modal-title">Delete Document</h3>
            <p className="emp-modal-body">
              You're about to permanently delete <strong>{documentToDelete.name}</strong>.
            </p>
            <p className="emp-modal-warn">This action cannot be undone.</p>
            <div className="emp-modal-actions">
              <button className="emp-modal-cancel" onClick={() => setShowDeleteModal(false)}>
                Cancel
              </button>
              <button className="emp-modal-confirm" onClick={handleDelete}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Documents;