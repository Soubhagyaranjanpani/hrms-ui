import React, { useState, useEffect } from 'react';
import { 
  FaSearch, FaUserTie, FaTimes, FaUpload, FaFilePdf, FaFileWord, 
  FaFileImage, FaDownload, FaTrash, FaEye, FaFolder, FaFolderOpen,
  FaCloudUploadAlt, FaCheckCircle, FaExclamationTriangle, FaFileAlt,
  FaCalendarAlt, FaBuilding, FaChartLine, FaExchangeAlt, FaTrophy, 
  FaRupeeSign, FaChalkboardTeacher, FaClock, FaPlus, FaEdit, FaSave, FaArrowLeft
} from 'react-icons/fa';
import { toast } from '../components/Toast';

const ServiceBookDocumentRepository = ({ employeeId, initialData, onSuccess, onCancel }) => {
  const [documents, setDocuments] = useState([
    { id: 1, category: 'appointment', title: 'Appointment Order', fileName: 'Appointment_Order.pdf', fileType: 'pdf', fileSize: '1.2 MB', date: '2020-01-15', uploadedBy: 'HR Admin', uploadedOn: '2020-01-15', employeeName: 'John Doe', employeeId: 1 },
    { id: 2, category: 'promotion', title: 'Promotion Order', fileName: 'Promotion_Order.pdf', fileType: 'pdf', fileSize: '856 KB', date: '2021-03-01', uploadedBy: 'HR Manager', uploadedOn: '2021-03-01', employeeName: 'John Doe', employeeId: 1 },
    { id: 3, category: 'transfer', title: 'Transfer Order', fileName: 'Transfer_Order.pdf', fileType: 'pdf', fileSize: '654 KB', date: '2022-06-01', uploadedBy: 'HR Admin', uploadedOn: '2022-06-01', employeeName: 'Jane Smith', employeeId: 2 },
    { id: 4, category: 'salaryRevision', title: 'Salary Revision', fileName: 'Salary_Revision.pdf', fileType: 'pdf', fileSize: '432 KB', date: '2023-01-01', uploadedBy: 'Payroll Manager', uploadedOn: '2023-01-01', employeeName: 'Mike Johnson', employeeId: 3 },
    { id: 5, category: 'training', title: 'Training Certificate', fileName: 'Training_Certificate.jpg', fileType: 'jpg', fileSize: '2.1 MB', date: '2021-08-10', uploadedBy: 'Employee', uploadedOn: '2021-08-15', employeeName: 'Sarah Williams', employeeId: 4 },
    { id: 6, category: 'award', title: 'Award Certificate', fileName: 'Award_Certificate.pdf', fileType: 'pdf', fileSize: '1.5 MB', date: '2022-01-20', uploadedBy: 'CEO Office', uploadedOn: '2022-01-20', employeeName: 'David Brown', employeeId: 5 }
  ]);
  
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const [showForm, setShowForm] = useState(false);
const [editingDoc, setEditingDoc] = useState(null);
  const [uploadErrors, setUploadErrors] = useState({});
  const [viewingDoc, setViewingDoc] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage] = useState(4);
  const [uploadData, setUploadData] = useState({
  category: '',
  title: '',
  date: '',
  file: null,
  fileName: '',
  fileData: ''
});
const [employeeSearchTerm, setEmployeeSearchTerm] = useState('');
const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false); 

  const DUMMY_EMPLOYEES = [
    { id: 1, name: 'John Doe', code: 'EMP001', department: 'IT', designation: 'Software Engineer' },
    { id: 2, name: 'Jane Smith', code: 'EMP002', department: 'HR', designation: 'HR Manager' },
    { id: 3, name: 'Mike Johnson', code: 'EMP003', department: 'IT', designation: 'Senior Developer' },
    { id: 4, name: 'Sarah Williams', code: 'EMP004', department: 'Sales', designation: 'Sales Manager' },
    { id: 5, name: 'David Brown', code: 'EMP005', department: 'Finance', designation: 'Accountant' }
  ];

  const documentCategories = [
    { id: 'appointment', label: 'Appointment Orders', icon: <FaFileAlt />, color: '#4f46e5', bg: '#e0e7ff' },
    { id: 'promotion', label: 'Promotion Orders', icon: <FaChartLine />, color: '#f59e0b', bg: '#fed7aa' },
    { id: 'transfer', label: 'Transfer Orders', icon: <FaExchangeAlt />, color: '#06b6d4', bg: '#cffafe' },
    { id: 'salaryRevision', label: 'Salary Revision Orders', icon: <FaRupeeSign />, color: '#ec489a', bg: '#fce7f3' },
    { id: 'training', label: 'Training Certificates', icon: <FaChalkboardTeacher />, color: '#8b5cf6', bg: '#ede9fe' },
    { id: 'award', label: 'Awards', icon: <FaTrophy />, color: '#ef4444', bg: '#fee2e2' },
    { id: 'retirement', label: 'Retirement Documents', icon: <FaClock />, color: '#64748b', bg: '#f1f5f9' }
  ];

 const filteredEmployees = DUMMY_EMPLOYEES.filter(emp => {
  const search = employeeSearchTerm.toLowerCase();  
  return emp.name.toLowerCase().includes(search) || emp.code.toLowerCase().includes(search);
});

  // Filter documents
 const getFilteredDocuments = () => {
  let docs = documents;
  
  if (searchTerm.trim()) {
    const search = searchTerm.toLowerCase();
    docs = docs.filter(doc => 
      doc.employeeName.toLowerCase().includes(search) ||
      doc.title.toLowerCase().includes(search) ||
      doc.fileName.toLowerCase().includes(search)
    );
  }
  
  if (selectedEmployee) {
    docs = docs.filter(doc => doc.employeeId === selectedEmployee.id);
  }
  
  if (activeCategory !== 'all') {
    docs = docs.filter(doc => doc.category === activeCategory);
  }
  
  return docs;
};
  const filteredDocs = getFilteredDocuments();
  
  // Pagination
  const totalItems = filteredDocs.length;
  const totalPages = Math.ceil(totalItems / rowsPerPage);
  const startIndex = page * rowsPerPage;
  const currentDocs = filteredDocs.slice(startIndex, startIndex + rowsPerPage);

  const getPaginationRange = () => {
    const delta = 2;
    const range = [];
    const left = Math.max(0, page - delta);
    const right = Math.min(totalPages - 1, page + delta);
    if (left > 0) { range.push(0); if (left > 1) range.push('...'); }
    for (let i = left; i <= right; i++) range.push(i);
    if (right < totalPages - 1) { if (right < totalPages - 2) range.push('...'); range.push(totalPages - 1); }
    return range;
  };

  const handleEmployeeSelect = (employee) => {
    setSelectedEmployee(employee);
    setSearchTerm('');
    setShowDropdown(false);
    setActiveCategory('all');
    setPage(0);
    toast.success('Employee Selected', `Showing documents for ${employee.name}`);
  };

  const handleClearEmployee = () => {
    setSelectedEmployee(null);
    setSearchTerm('');
    setActiveCategory('all');
    setPage(0);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        toast.warning('Invalid File Type', 'Only PDF, DOCX, JPG, PNG files are allowed');
        return;
      }
      
      if (file.size > 20 * 1024 * 1024) {
        toast.warning('File too large', 'Maximum file size is 20 MB');
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadData({
          ...uploadData,
          file: file,
          fileName: file.name,
          fileData: reader.result
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = () => {
    const errors = {};
    if (!uploadData.category) errors.category = 'Category is required';
    if (!uploadData.title) errors.title = 'Title is required';
    if (!uploadData.date) errors.date = 'Date is required';
    if (!uploadData.file) errors.file = 'File is required';
    
    if (Object.keys(errors).length > 0) {
      setUploadErrors(errors);
      toast.warning('Missing Fields', 'Please fill all required fields');
      return;
    }
    
    const selectedEmp = selectedEmployee || { id: null, name: 'Unknown' };
    
    const newDocument = {
      id: documents.length + 1,
      category: uploadData.category,
      title: uploadData.title,
      fileName: uploadData.fileName,
      fileType: uploadData.fileName.split('.').pop(),
      fileSize: (uploadData.file.size / (1024 * 1024)).toFixed(2) + ' MB',
      date: uploadData.date,
      uploadedBy: 'Current User',
      uploadedOn: new Date().toISOString().split('T')[0],
      fileData: uploadData.fileData,
      employeeId: selectedEmp.id,
      employeeName: selectedEmp.name
    };
    
    setDocuments([newDocument, ...documents]);
    toast.success('Success', 'Document uploaded successfully');
setShowForm(false);
    resetUploadForm();
    setPage(0);
  };

  const resetUploadForm = () => {
    setUploadData({
      category: '',
      title: '',
      date: '',
      file: null,
      fileName: '',
      fileData: ''
    });
    setUploadErrors({});
  };

  const handleSubmit = (e) => {
  e.preventDefault();
  
  const errors = {};
  if (!selectedEmployee) errors.employee = 'Please select an employee';
  if (!uploadData.category) errors.category = 'Category is required';
  if (!uploadData.title) errors.title = 'Title is required';
  if (!uploadData.date) errors.date = 'Date is required';
 if (!editingDoc && !uploadData.file) {
    errors.file = 'File is required';
  }  
  if (Object.keys(errors).length > 0) {
    setUploadErrors(errors);
    toast.warning('Missing Fields', 'Please fill all required fields');
    return;
  }
  
  const newDocument = {
    id: documents.length + 1,
    category: uploadData.category,
    title: uploadData.title,
    fileName: uploadData.fileName,
    fileType: uploadData.fileName.split('.').pop(),
 fileSize: uploadData.file && uploadData.file.size ? 
  (uploadData.file.size / (1024 * 1024)).toFixed(2) + ' MB' : 
  (editingDoc && editingDoc.fileSize ? editingDoc.fileSize : ''),    date: uploadData.date,
    uploadedBy: 'Current User',
    uploadedOn: new Date().toISOString().split('T')[0],
    fileData: uploadData.fileData,
    employeeId: selectedEmployee.id,
    employeeName: selectedEmployee.name
  };
  
  setDocuments([newDocument, ...documents]);
  toast.success('Success', 'Document uploaded successfully');
  resetUploadForm();
  setShowForm(false);
  setSelectedEmployee(null);
  setEmployeeSearchTerm('');
  setPage(0);
};

  const handleDelete = (docId) => {
    setDocuments(documents.filter(doc => doc.id !== docId));
    toast.success('Success', 'Document deleted successfully');
  };

 const handleEdit = (doc) => {
  setEditingDoc(doc);
  setUploadData({
    category: doc.category,
    title: doc.title,
    date: doc.date,
    file: null,
    fileName: doc.fileName,
    fileData: doc.fileData || ''
  });
  setSelectedEmployee(DUMMY_EMPLOYEES.find(e => e.id === doc.employeeId) || null);
  setEmployeeSearchTerm(doc.employeeName);
  setShowForm(true);
};

  const handleDownload = (doc) => {
    const link = document.createElement('a');
    link.href = doc.fileData;
    link.download = doc.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Success', 'Download started');
  };

  const handleCancel = () => {
    if (onCancel) onCancel();
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const getCategoryInfo = (categoryId) => {
    return documentCategories.find(cat => cat.id === categoryId) || documentCategories[0];
  };

  const getFileIcon = (fileType) => {
    if (fileType === 'pdf') return <FaFilePdf style={{ color: '#dc2626' }} size={24} />;
    if (fileType === 'docx' || fileType === 'doc') return <FaFileWord style={{ color: '#2563eb' }} size={24} />;
    if (fileType === 'jpg' || fileType === 'jpeg' || fileType === 'png') return <FaFileImage style={{ color: '#10b981' }} size={24} />;
    return <FaFileAlt style={{ color: '#6b7280' }} size={24} />;
  };

  // Stats
  const totalDocs = documents.length;
  const filteredTotal = filteredDocs.length;
const FieldError = ({ msg }) => msg ? <span className="text-danger small">{msg}</span> : null;
  return (
    

  <div className="cert-root">
    {/* ===== HEADER ===== */}
    <div className="cert-header">
      <div>
        <h1 className="cert-title">Service Book Document Repository</h1>
        <p className="cert-subtitle">Centralized employee document storage</p>
      </div>
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        {!showForm && (
          <button className="cert-add-btn" onClick={() => { resetUploadForm(); setShowForm(true); setEditingDoc(null); }}>
            <FaPlus size={13} /> Upload Document
          </button>
        )}
        {showForm && (
          <button type="button" className="cert-back-btn" onClick={() => { resetUploadForm(); setShowForm(false); setEditingDoc(null); setSelectedEmployee(null); setEmployeeSearchTerm(''); }}>
            <FaArrowLeft size={12} /> Back
          </button>
        )}
        {onCancel && (
          <button className="cert-cancel-btn" onClick={handleCancel}>
            <FaTimes size={13} /> Cancel
          </button>
        )}
      </div>
    </div>

    {showForm ? (
      /* ===== FORM VIEW ===== */
      <div className="cert-form-wrap mb-4">
        <form onSubmit={handleSubmit} className="cert-form-compact">
          <div className="cert-form-section-compact">
            <div className="cert-section-label">{editingDoc ? 'Edit Document' : 'Upload New Document'}</div>
            <div className="cert-form-grid-3col">
              {/* Employee Selection */}
<div className="cert-field-compact" style={{ gridColumn: 'span 3' }}>
  <label className="required">Employee Name</label>
  <div className="position-relative">
    <div className="input-group">
      <span className="input-group-text bg-light">
        <FaSearch size={14} className="text-muted" />
      </span>
      <input
        type="text"
        className="form-control"
        placeholder="Type employee name to search..."
        value={employeeSearchTerm}
        onChange={(e) => {
          setEmployeeSearchTerm(e.target.value);
          setShowEmployeeDropdown(true);
        }}
        onFocus={() => setShowEmployeeDropdown(true)}
      />
    </div>
    
    {showEmployeeDropdown && employeeSearchTerm && (
      <div className="card position-absolute top-100 start-0 end-0 mt-1 shadow-lg" style={{ zIndex: 1000, maxHeight: '250px', overflow: 'auto' }}>
        <div className="card-body p-2">
          {filteredEmployees.length > 0 ? (
            filteredEmployees.map(emp => (
              <div
                key={emp.id}
                className="d-flex justify-content-between align-items-center p-2 rounded cursor-pointer hover-bg-light"
                style={{ cursor: 'pointer' }}
                onClick={() => {
                  setSelectedEmployee(emp);
                  setEmployeeSearchTerm(emp.name);
                  setShowEmployeeDropdown(false);
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <div>
                  <div className="fw-bold">{emp.name}</div>
                  <small className="text-muted">Code: {emp.code} | Dept: {emp.department}</small>
                </div>
                <div>
                  <span className="badge bg-light text-dark">{emp.designation}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-3 text-muted">
              <small>No employees found</small>
            </div>
          )}
        </div>
      </div>
    )}
  </div>
</div>

{/* Employee Code - Auto Populate */}
<div className="cert-field-compact">
  <label>Employee Code</label>
  <input type="text" className="form-control bg-light" value={selectedEmployee?.code || ''} readOnly placeholder="Auto-populated" />
</div>

{/* Department - Auto Populate */}
<div className="cert-field-compact">
  <label>Department</label>
  <input type="text" className="form-control bg-light" value={selectedEmployee?.department || ''} readOnly placeholder="Auto-populated" />
</div>

{/* Designation - Auto Populate */}
<div className="cert-field-compact">
  <label>Designation</label>
  <input type="text" className="form-control bg-light" value={selectedEmployee?.designation || ''} readOnly placeholder="Auto-populated" />
</div>
              <div className={`cert-field-compact ${uploadErrors.category ? 'has-error' : ''}`}>
                <label className="required">Document Category</label>
                <select 
                  value={uploadData.category} 
                  onChange={(e) => {
                    setUploadData({...uploadData, category: e.target.value});
                    setUploadErrors({...uploadErrors, category: ''});
                  }}
                >
                  <option value="">Select Category</option>
                  {documentCategories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.label}</option>
                  ))}
                </select>
                <FieldError msg={uploadErrors.category} />
              </div>
              
              <div className={`cert-field-compact ${uploadErrors.date ? 'has-error' : ''}`}>
                <label className="required">Document Date</label>
                <input 
                  type="date" 
                  value={uploadData.date}
                  onChange={(e) => {
                    setUploadData({...uploadData, date: e.target.value});
                    setUploadErrors({...uploadErrors, date: ''});
                  }}
                />
                <FieldError msg={uploadErrors.date} />
              </div>
              
              <div className={`cert-field-compact ${uploadErrors.title ? 'has-error' : ''}`}>
                <label className="required">Document Title</label>
                <input 
                  type="text" 
                  placeholder="e.g., Appointment Order, Promotion Letter"
                  value={uploadData.title}
                  onChange={(e) => {
                    setUploadData({...uploadData, title: e.target.value});
                    setUploadErrors({...uploadErrors, title: ''});
                  }}
                />
                <FieldError msg={uploadErrors.title} />
              </div>
              
              <div className={`cert-field-compact ${uploadErrors.file ? 'has-error' : ''}`} style={{ gridColumn: 'span 3' }}>
                <label className="required">Upload File</label>
                <div className="border rounded p-3 text-center bg-light">
                  <input 
                    type="file" 
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" 
                    onChange={handleFileChange} 
                    style={{ display: 'none' }} 
                    id="doc-upload-form" 
                  />
                  <label htmlFor="doc-upload-form" className="btn btn-outline-primary btn-sm" style={{ cursor: 'pointer' }}>
                    <FaUpload className="me-1" /> Choose File
                  </label>
                  {uploadData.fileName && (
                    <div className="mt-2 text-primary">
                      {uploadData.fileName.endsWith('.pdf') ? <FaFilePdf /> : uploadData.fileName.endsWith('.jpg') || uploadData.fileName.endsWith('.png') ? <FaFileImage /> : <FaFileWord />} {uploadData.fileName}
                    </div>
                  )}
                  <small className="text-muted d-block mt-2">Supported: PDF, DOCX, JPG, PNG (Max 20MB)</small>
                </div>
                <FieldError msg={uploadErrors.file} />
              </div>
            </div>
          </div>
          
          <div className="cert-form-actions">
            <button type="button" className="cert-cancel-btn" onClick={() => { resetUploadForm(); setShowForm(false); setEditingDoc(null); }}>Cancel</button>
            <button type="submit" className="cert-add-btn" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <FaSave size={12} /> {editingDoc ? 'Update Document' : 'Upload Document'}
            </button>
          </div>
        </form>
      </div>
    ) : (
      <>
        {/* Search Bar */}
        <div className="emp-search-bar">
          <div className="emp-search-wrap">
            <FaSearch className="cert-search-icon" size={12} />
            <input
              className="emp-search-input"
              type="text"
              placeholder="Search by employee name or document title..."
              value={searchTerm}
              onChange={(e) => { 
                setSearchTerm(e.target.value); 
                setPage(0);
              }}
            />
            {searchTerm && (
              <button className="cert-search-clear" onClick={() => { setSearchTerm(''); setPage(0); }}>
                <FaTimes size={11} />
              </button>
            )}
          </div>
        </div>

        {/* Documents Table */}
        <div className="cert-table-card">
          <div className="cert-table-wrap">
            <table className="cert-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Employee</th>
                  <th>Document Title</th>
                  <th>Category</th>
                  <th>Date</th>
                  <th>File Name</th>
                  <th>Size</th>
                  <th style={{ width: 100 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentDocs.length > 0 ? (
                  currentDocs.map((doc, idx) => {
                    const category = getCategoryInfo(doc.category);
                    return (
                      <tr key={doc.id}>
                        <td className="text-center">{startIndex + idx + 1}</td>
                        <td className="fw-bold">{doc.employeeName}</td>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            {getFileIcon(doc.fileType)}
                            <strong>{doc.title}</strong>
                          </div>
                        </td>
                        <td>
                          <span className="badge" style={{ backgroundColor: category.bg, color: category.color, padding: '4px 8px' }}>
                            {category.icon} {category.label}
                          </span>
                        </td>
                        <td>{formatDate(doc.date)}</td>
                        <td>{doc.fileName}</td>
                        <td>{doc.fileSize}</td>
                        <td className="text-center">
                          <div className="cert-actions">
                            <button className="cert-act cert-act--edit" onClick={() => handleEdit(doc)} title="Edit">
  <FaEdit size={12} />
</button>
                            <button className="cert-act cert-act--del" onClick={() => handleDelete(doc.id)} title="Delete">
                              <FaTrash size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="8" className="text-center py-5">No documents found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          
       {/* Pagination */}
{totalItems > 0 && (
  <div className="emp-pagination" style={{ justifyContent: 'space-between', flexWrap: 'wrap' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <span className="emp-page-info">
        Showing {startIndex + 1}–{Math.min(startIndex + rowsPerPage, totalItems)} of {totalItems} events
      </span>
    </div>
    <div className="emp-page-controls">
      <button 
        className="emp-page-btn" 
        disabled={page === 0} 
        onClick={() => setPage(page - 1)}
      >
        ← Prev
      </button>
      {getPaginationRange().map((pg, i) =>
        pg === '...' ? (
          <span key={`dots-${i}`} className="emp-page-dots">…</span>
        ) : (
          <button 
            key={pg} 
            className={`emp-page-num ${pg === page ? 'active' : ''}`} 
            onClick={() => setPage(pg)}
          >
            {pg + 1}
          </button>
        )
      )}
      <button 
        className="emp-page-btn" 
        disabled={page + 1 >= totalPages} 
        onClick={() => setPage(page + 1)}
      >
        Next →
      </button>
    </div>
  </div>
)}
        </div>
      </>
    )}

    {/* ===== VIEW MODAL ===== */}
    {showViewModal && viewingDoc && (
      <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content">
            <div className="modal-header bg-primary text-white">
              <h5 className="modal-title"><FaFileAlt className="mr-2" /> Document Preview</h5>
              <button type="button" className="close text-white" onClick={() => setShowViewModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="row mb-3">
                <div className="col-md-6"><p><strong>Title:</strong> {viewingDoc.title}</p></div>
                <div className="col-md-6"><p><strong>Employee:</strong> {viewingDoc.employeeName}</p></div>
                <div className="col-md-6"><p><strong>Date:</strong> {formatDate(viewingDoc.date)}</p></div>
                <div className="col-md-6"><p><strong>File Name:</strong> {viewingDoc.fileName}</p></div>
                <div className="col-md-6"><p><strong>File Size:</strong> {viewingDoc.fileSize}</p></div>
                <div className="col-md-6"><p><strong>Uploaded By:</strong> {viewingDoc.uploadedBy}</p></div>
              </div>
              <hr />
              <div className="text-center">
                {viewingDoc.fileType === 'pdf' ? (
                  <iframe src={viewingDoc.fileData} title="PDF Preview" style={{ width: '100%', height: '400px', border: 'none' }} />
                ) : viewingDoc.fileType === 'jpg' || viewingDoc.fileType === 'jpeg' || viewingDoc.fileType === 'png' ? (
                  <img src={viewingDoc.fileData} alt={viewingDoc.title} style={{ maxWidth: '100%', maxHeight: '300px' }} />
                ) : (
                  <div className="py-5">
                    <FaFileWord size={64} className="text-primary mb-3" />
                    <p>Preview not available for this file type</p>
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowViewModal(false)}>Close</button>
              <button className="btn btn-primary" onClick={() => handleDownload(viewingDoc)}><FaDownload className="mr-1" /> Download</button>
            </div>
          </div>
        </div>
      </div>
    )}
  

      {/* View Document Modal */}
      {showViewModal && viewingDoc && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title"><FaFileAlt className="mr-2" /> Document Preview</h5>
                <button type="button" className="close text-white" onClick={() => setShowViewModal(false)}>×</button>
              </div>
              <div className="modal-body">
                <div className="row mb-3">
                  <div className="col-md-6"><p><strong>Title:</strong> {viewingDoc.title}</p></div>
                  <div className="col-md-6"><p><strong>Employee:</strong> {viewingDoc.employeeName}</p></div>
                  <div className="col-md-6"><p><strong>Date:</strong> {formatDate(viewingDoc.date)}</p></div>
                  <div className="col-md-6"><p><strong>File Name:</strong> {viewingDoc.fileName}</p></div>
                  <div className="col-md-6"><p><strong>File Size:</strong> {viewingDoc.fileSize}</p></div>
                  <div className="col-md-6"><p><strong>Uploaded By:</strong> {viewingDoc.uploadedBy}</p></div>
                </div>
                <hr />
                <div className="text-center">
                  {viewingDoc.fileType === 'pdf' ? (
                    <iframe src={viewingDoc.fileData} title="PDF Preview" style={{ width: '100%', height: '400px', border: 'none' }} />
                  ) : viewingDoc.fileType === 'jpg' || viewingDoc.fileType === 'jpeg' || viewingDoc.fileType === 'png' ? (
                    <img src={viewingDoc.fileData} alt={viewingDoc.title} style={{ maxWidth: '100%', maxHeight: '300px' }} />
                  ) : (
                    <div className="py-5">
                      <FaFileWord size={64} className="text-primary mb-3" />
                      <p>Preview not available for this file type</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowViewModal(false)}>Close</button>
                <button className="btn btn-primary" onClick={() => handleDownload(viewingDoc)}><FaDownload className="mr-1" /> Download</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceBookDocumentRepository;