import React, { useState, useEffect } from 'react';
import { 
  FaSearch, FaUserTie, FaTimes, FaUpload, FaFilePdf, FaFileWord, 
  FaFileImage, FaDownload, FaTrash, FaEye, FaFolder, FaFolderOpen,
  FaCloudUploadAlt, FaCheckCircle, FaExclamationTriangle, FaFileAlt,
  FaCalendarAlt, FaBuilding, FaChartLine, FaExchangeAlt, FaTrophy, 
  FaRupeeSign, FaChalkboardTeacher, FaClock
} from 'react-icons/fa';
import { toast } from '../components/Toast';

const ServiceBookDocumentRepository = ({ employeeId, initialData }) => {
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const [documents, setDocuments] = useState([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadData, setUploadData] = useState({
    category: '',
    title: '',
    date: '',
    file: null,
    fileName: '',
    fileData: ''
  });
  const [uploadErrors, setUploadErrors] = useState({});
  const [viewingDoc, setViewingDoc] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);

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

  // Dummy documents data
  const getDummyDocuments = (employee) => {
    if (!employee) return [];
    
    return [
      {
        id: 1,
        category: 'appointment',
        title: 'Appointment Order',
        fileName: 'Appointment_Order_John_Doe.pdf',
        fileType: 'pdf',
        fileSize: '1.2 MB',
        date: '2020-01-15',
        uploadedBy: 'HR Admin',
        uploadedOn: '2020-01-15',
        fileData: '#'
      },
      {
        id: 2,
        category: 'promotion',
        title: 'Promotion Order - Senior Software Engineer',
        fileName: 'Promotion_Order_Senior_Engineer.pdf',
        fileType: 'pdf',
        fileSize: '856 KB',
        date: '2021-03-01',
        uploadedBy: 'HR Manager',
        uploadedOn: '2021-03-01',
        fileData: '#'
      },
      {
        id: 3,
        category: 'transfer',
        title: 'Transfer Order - Mumbai to Bangalore',
        fileName: 'Transfer_Order_Mumbai_Bangalore.pdf',
        fileType: 'pdf',
        fileSize: '654 KB',
        date: '2022-06-01',
        uploadedBy: 'HR Admin',
        uploadedOn: '2022-06-01',
        fileData: '#'
      },
      {
        id: 4,
        category: 'salaryRevision',
        title: 'Salary Revision - Annual Increment 2023',
        fileName: 'Salary_Revision_2023.pdf',
        fileType: 'pdf',
        fileSize: '432 KB',
        date: '2023-01-01',
        uploadedBy: 'Payroll Manager',
        uploadedOn: '2023-01-01',
        fileData: '#'
      },
      {
        id: 5,
        category: 'training',
        title: 'Leadership Program Certificate',
        fileName: 'Leadership_Certificate.jpg',
        fileType: 'jpg',
        fileSize: '2.1 MB',
        date: '2021-08-10',
        uploadedBy: 'Employee',
        uploadedOn: '2021-08-15',
        fileData: '#'
      },
      {
        id: 6,
        category: 'award',
        title: 'Star Performer of the Year',
        fileName: 'Star_Performer_Award.pdf',
        fileType: 'pdf',
        fileSize: '1.5 MB',
        date: '2022-01-20',
        uploadedBy: 'CEO Office',
        uploadedOn: '2022-01-20',
        fileData: '#'
      }
    ];
  };

  const filteredEmployees = DUMMY_EMPLOYEES.filter(emp => {
    const search = searchTerm.toLowerCase();
    return emp.name.toLowerCase().includes(search) || emp.code.toLowerCase().includes(search);
  });

  const getFileIcon = (fileType) => {
    if (fileType === 'pdf') return <FaFilePdf style={{ color: '#dc2626' }} size={24} />;
    if (fileType === 'docx' || fileType === 'doc') return <FaFileWord style={{ color: '#2563eb' }} size={24} />;
    if (fileType === 'jpg' || fileType === 'jpeg' || fileType === 'png') return <FaFileImage style={{ color: '#10b981' }} size={24} />;
    return <FaFileAlt style={{ color: '#6b7280' }} size={24} />;
  };

  const handleEmployeeSelect = (employee) => {
    setSelectedEmployee(employee);
    setDocuments(getDummyDocuments(employee));
    setSearchTerm('');
    setShowDropdown(false);
    setActiveCategory('all');
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        toast.warning('Invalid File Type', 'Only PDF, DOCX, JPG, PNG files are allowed');
        return;
      }
      
      // Validate file size (20 MB = 20 * 1024 * 1024)
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
      fileData: uploadData.fileData
    };
    
    setDocuments([newDocument, ...documents]);
    toast.success('Success', 'Document uploaded successfully');
    setShowUploadModal(false);
    resetUploadForm();
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

  const handleDelete = (docId) => {
    setDocuments(documents.filter(doc => doc.id !== docId));
    toast.success('Success', 'Document deleted successfully');
  };

  const handleView = (doc) => {
    setViewingDoc(doc);
    setShowViewModal(true);
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

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const filteredDocuments = activeCategory === 'all' 
    ? documents 
    : documents.filter(doc => doc.category === activeCategory);

  const getCategoryInfo = (categoryId) => {
    return documentCategories.find(cat => cat.id === categoryId) || documentCategories[0];
  };

  // Stats
  const totalDocs = documents.length;
  const totalSize = documents.reduce((sum, doc) => sum + parseFloat(doc.fileSize), 0).toFixed(2);

  return (
    <div className="container-fluid p-4">
      {/* Header */}
      <div className="d-flex align-items-center gap-3 mb-4 pb-2 border-bottom">
        <div className="bg-primary bg-opacity-10 p-3 rounded-circle">
          <FaFolderOpen className="text-primary" size={24} />
        </div>
        <div>
          <h5 className="mb-0">Service Book Document Repository</h5>
          <p className="text-muted mb-0 small">Centralized employee document storage</p>
        </div>
      </div>

      {/* Stats */}
      {selectedEmployee && (
        <div className="row g-3 mb-4">
          <div className="col-md-4">
            <div className="card bg-primary bg-opacity-10">
              <div className="card-body d-flex align-items-center gap-3">
                <div className="bg-primary text-white p-3 rounded-circle">
                  <FaFileAlt size={20} />
                </div>
                <div>
                  <h4 className="mb-0">{totalDocs}</h4>
                  <small className="text-muted">Total Documents</small>
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card bg-success bg-opacity-10">
              <div className="card-body d-flex align-items-center gap-3">
                <div className="bg-success text-white p-3 rounded-circle">
                  <FaFolder size={20} />
                </div>
                <div>
                  <h4 className="mb-0">{documentCategories.length}</h4>
                  <small className="text-muted">Categories</small>
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card bg-warning bg-opacity-10">
              <div className="card-body d-flex align-items-center gap-3">
                <div className="bg-warning text-white p-3 rounded-circle">
                  <FaCloudUploadAlt size={20} />
                </div>
                <div>
                  <h4 className="mb-0">{totalSize} MB</h4>
                  <small className="text-muted">Total Storage</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search Employee */}
      <div className="card shadow-sm mb-4">
        <div className="card-header bg-light">
          <h6 className="mb-0">Select Employee</h6>
        </div>
        <div className="card-body">
            <div className="row">
            <div className="col-md-12">
          <div className="position-relative">
            <div className="input-group">
        
                <span className="input-group-text bg-light">
                  <FaSearch size={14} />
                </span>
    
              <input
                type="text"
                className="form-control"
                placeholder="Search by name or code..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
              />
              {selectedEmployee && (
                
                  <button className="btn btn-outline-danger" onClick={() => { setSelectedEmployee(null); setDocuments([]); }}>
                    Cancel
                  </button>
               
              )}
            </div>
            
            {showDropdown && searchTerm && (
              <div className="dropdown-menu show w-100 mt-1" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {filteredEmployees.length > 0 ? (
                  filteredEmployees.map(emp => (
                    <button key={emp.id} className="dropdown-item" onClick={() => handleEmployeeSelect(emp)}>
                      <div className="font-weight-bold">{emp.name}</div>
                      <small className="text-muted">{emp.code} | {emp.department} | {emp.designation}</small>
                    </button>
                  ))
                ) : (
                  <div className="dropdown-item text-center text-muted">No employees found</div>
                )}
              </div>
            )}
          </div>
                           <small className="text-muted mt-2 d-block">Type employee name or code to search</small>

          {selectedEmployee && (
            <div className="alert alert-info mt-3 mb-0 py-2 d-flex justify-content-between align-items-center">
              <div>
                <FaUserTie className="mr-2" /> 
                <strong>{selectedEmployee.name}</strong> ({selectedEmployee.code}) | 
                {selectedEmployee.department} | {selectedEmployee.designation}
              </div>
              <button className="btn btn-primary btn-sm" onClick={() => setShowUploadModal(true)}>
                <FaUpload className="mr-1" /> Upload Document
              </button>
            </div>
          )}
        </div>
      </div>
</div>
</div>
      {/* Document Repository */}
      {selectedEmployee && (
        <>
          {/* Category Filters */}
          <div className="card shadow-sm mb-4">
            <div className="card-header bg-light">
              <h6 className="mb-0">Document Categories</h6>
            </div>
            <div className="card-body">
              <div className="d-flex flex-wrap gap-2">
                <button
                  className={`btn ${activeCategory === 'all' ? 'btn-primary' : 'btn-outline-secondary'}`}
                  onClick={() => setActiveCategory('all')}
                >
                  All Documents ({totalDocs})
                </button>
                {documentCategories.map(cat => (
                  <button
                    key={cat.id}
                    className={`btn ${activeCategory === cat.id ? 'btn-primary' : 'btn-outline-secondary'}`}
                    onClick={() => setActiveCategory(cat.id)}
                  >
                    {cat.icon} <span className="ml-1">{cat.label}</span>
                    <span className="badge ml-1">{documents.filter(d => d.category === cat.id).length}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Documents List */}
          {filteredDocuments.length > 0 ? (
            <div className="card shadow-sm">
              <div className="card-header bg-light">
                <h6 className="mb-0">
                  {activeCategory === 'all' ? 'All Documents' : getCategoryInfo(activeCategory).label}
                </h6>
              </div>
              <div className="table-responsive">
                <table className="table table-bordered mb-0">
                  <thead className="thead-light">
                    <tr>
                      <th style={{ width: 40 }}>#</th>
                      <th>Document Title</th>
                      <th>Category</th>
                      <th>Date</th>
                      <th>File Name</th>
                      <th>Size</th>
                      <th>Uploaded By</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDocuments.map((doc, idx) => {
                      const category = getCategoryInfo(doc.category);
                      return (
                        <tr key={doc.id}>
                          <td className="text-center">{idx + 1}</td>
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
                          <td>
                            <div>{doc.uploadedBy}</div>
                            <small className="text-muted">{formatDate(doc.uploadedOn)}</small>
                          </td>
                          <td className="text-center">
                            <button className="btn btn-sm btn-outline-info mr-1" onClick={() => handleView(doc)} title="View">
                              <FaEye size={12} />
                            </button>
                            <button className="btn btn-sm btn-outline-success mr-1" onClick={() => handleDownload(doc)} title="Download">
                              <FaDownload size={12} />
                            </button>
                            <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(doc.id)} title="Delete">
                              <FaTrash size={12} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="text-center py-5 bg-light rounded">
              <FaFolderOpen size={48} className="text-muted mb-3" />
              <h6>No Documents Found</h6>
              <p className="text-muted small">Upload documents for {selectedEmployee.name}</p>
              <button className="btn btn-primary btn-sm" onClick={() => setShowUploadModal(true)}>
                <FaUpload className="mr-1" /> Upload First Document
              </button>
            </div>
          )}
        </>
      )}

    
      {/* Upload Modal */}
      {showUploadModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title"><FaUpload className="mr-2" /> Upload Document</h5>
                <button type="button" className="close text-white" onClick={() => { setShowUploadModal(false); resetUploadForm(); }}>
                  <span>&times;</span>
                </button>
              </div>
              <div className="modal-body">
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-bold">Document Category <span className="text-danger">*</span></label>
                    <select 
                      className={`form-control ${uploadErrors.category ? 'is-invalid' : ''}`}
                      value={uploadData.category}
                      onChange={(e) => setUploadData({...uploadData, category: e.target.value})}
                    >
                      <option value="">Select Category</option>
                      {documentCategories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.label}</option>
                      ))}
                    </select>
                    {uploadErrors.category && <small className="text-danger">{uploadErrors.category}</small>}
                  </div>
                  
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-bold">Document Date <span className="text-danger">*</span></label>
                    <input 
                      type="date" 
                      className={`form-control ${uploadErrors.date ? 'is-invalid' : ''}`}
                      value={uploadData.date}
                      onChange={(e) => setUploadData({...uploadData, date: e.target.value})}
                    />
                    {uploadErrors.date && <small className="text-danger">{uploadErrors.date}</small>}
                  </div>
                  
                  <div className="col-12 mb-3">
                    <label className="form-label fw-bold">Document Title <span className="text-danger">*</span></label>
                    <input 
                      type="text" 
                      className={`form-control ${uploadErrors.title ? 'is-invalid' : ''}`}
                      placeholder="e.g., Appointment Order, Promotion Letter"
                      value={uploadData.title}
                      onChange={(e) => setUploadData({...uploadData, title: e.target.value})}
                    />
                    {uploadErrors.title && <small className="text-danger">{uploadErrors.title}</small>}
                  </div>
                  
                  <div className="col-12 mb-3">
                    <label className="form-label fw-bold">Upload File <span className="text-danger">*</span></label>
                    <div className={`border rounded p-3 text-center bg-light ${uploadErrors.file ? 'border-danger' : ''}`}>
                      <input 
                        type="file" 
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" 
                        onChange={handleFileChange} 
                        style={{ display: 'none' }} 
                        id="doc-upload" 
                      />
                      <label htmlFor="doc-upload" className="btn btn-outline-primary btn-sm">
                        <FaUpload className="mr-1" /> Choose File
                      </label>
                      {uploadData.fileName && (
                        <div className="mt-2 text-primary">
                          {uploadData.fileName.endsWith('.pdf') ? 
                            <FaFilePdf className="mr-1" /> : uploadData.fileName.endsWith('.doc') || uploadData.fileName.endsWith('.docx') ?
                            <FaFileWord className="mr-1" /> : <FaFileImage className="mr-1" />}
                          {uploadData.fileName}
                        </div>
                      )}
                      <small className="text-muted d-block mt-2">Supported: PDF, DOCX, JPG, PNG (Max 20MB)</small>
                    </div>
                    {uploadErrors.file && <small className="text-danger">{uploadErrors.file}</small>}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => { setShowUploadModal(false); resetUploadForm(); }}>Cancel</button>
                <button className="btn btn-primary" onClick={handleUpload}><FaCloudUploadAlt className="mr-1" /> Upload Document</button>
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
              <div className="modal-header btn btn-primary text-white">
                <h5 className="modal-title text-white"><FaFileAlt className="mr-2" /> Document Preview</h5>
               
              </div>
              <div className="modal-body">
                <div className="row mb-3">
                  <div className="col-md-6">
                    <p><strong>Title:</strong> {viewingDoc.title}</p>
                  </div>
                  <div className="col-md-6">
                    <p><strong>Date:</strong> {formatDate(viewingDoc.date)}</p>
                  </div>
                  <div className="col-md-6">
                    <p><strong>File Name:</strong> {viewingDoc.fileName}</p>
                  </div>
                  <div className="col-md-6">
                    <p><strong>File Size:</strong> {viewingDoc.fileSize}</p>
                  </div>
                  <div className="col-md-6">
                    <p><strong>Uploaded By:</strong> {viewingDoc.uploadedBy}</p>
                  </div>
                  <div className="col-md-6">
                    <p><strong>Uploaded On:</strong> {formatDate(viewingDoc.uploadedOn)}</p>
                  </div>
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