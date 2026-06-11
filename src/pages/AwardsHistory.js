import React, { useState, useEffect } from 'react';
import { 
  FaSave, FaTimes, FaTrophy, FaCalendarAlt, FaBuilding, 
  FaUpload, FaFilePdf, FaFileImage, FaEdit, FaTrash, FaPlus,
  FaFileAlt, FaSearch, FaAward, FaUserTie, FaEye, FaDownload, FaStar
} from 'react-icons/fa';
import { toast } from '../components/Toast';

const AwardsHistory = ({ employeeId, initialData, onSuccess, onCancel }) => {
  const [awards, setAwards] = useState(initialData?.awards || []);
  const [editingAward, setEditingAward] = useState(null);
  const [formData, setFormData] = useState({
    awardName: '',
    awardDate: '',
    awardType: 'Performance',
    issuedBy: '',
    description: '',
    certificateFile: null,
    certificateFileData: null,
    certificateFileName: null
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingAward, setViewingAward] = useState(null);

  const DUMMY_EMPLOYEES = [
    { id: 1, name: 'John Doe', code: 'EMP001', department: 'IT', designation: 'Software Engineer' },
    { id: 2, name: 'Jane Smith', code: 'EMP002', department: 'HR', designation: 'HR Manager' },
    { id: 3, name: 'Mike Johnson', code: 'EMP003', department: 'IT', designation: 'Senior Developer' },
    { id: 4, name: 'Sarah Williams', code: 'EMP004', department: 'Sales', designation: 'Sales Manager' },
    { id: 5, name: 'David Brown', code: 'EMP005', department: 'Finance', designation: 'Accountant' }
  ];

  const filteredEmployees = DUMMY_EMPLOYEES.filter(emp => {
    const search = searchTerm.toLowerCase();
    return emp.name.toLowerCase().includes(search) || emp.code.toLowerCase().includes(search);
  });

  const awardTypes = [
    { value: 'Performance', label: 'Performance Award' },
    { value: 'Innovation', label: 'Innovation Award' },
    { value: 'Leadership', label: 'Leadership Award' },
    { value: 'Teamwork', label: 'Teamwork Award' },
    { value: 'Customer Service', label: 'Customer Service Award' },
    { value: 'Long Service', label: 'Long Service Award' },
    { value: 'Spot Award', label: 'Spot Award' },
    { value: 'Star Performer', label: 'Star Performer' },
    { value: 'Employee of Month', label: 'Employee of the Month' },
    { value: 'Employee of Year', label: 'Employee of the Year' }
  ];

  const issuedByOptions = [
    { value: 'CEO', label: 'CEO Office' },
    { value: 'HR Department', label: 'HR Department' },
    { value: 'Managing Director', label: 'Managing Director' },
    { value: 'Department Head', label: 'Department Head' },
    { value: 'Client', label: 'Client' },
    { value: 'External Organization', label: 'External Organization' }
  ];

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    if (touched[field]) {
      validateField(field, value);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.warning('File too large', 'Maximum file size is 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({
          ...formData,
          certificateFile: file,
          certificateFileData: reader.result,
          certificateFileName: file.name
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const validateField = (field, value) => {
    let error = '';
    
    if (field === 'awardName' && !value) error = 'Award Name is required';
    else if (field === 'awardDate' && !value) error = 'Award Date is required';
    else if (field === 'awardType' && !value) error = 'Award Type is required';
    else if (field === 'issuedBy' && !value) error = 'Issued By is required';
    
    setErrors(prev => ({ ...prev, [field]: error }));
    return error === '';
  };

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    validateField(field, formData[field]);
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.awardName) newErrors.awardName = 'Award Name is required';
    if (!formData.awardDate) newErrors.awardDate = 'Award Date is required';
    if (!formData.awardType) newErrors.awardType = 'Award Type is required';
    if (!formData.issuedBy) newErrors.issuedBy = 'Issued By is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.warning('Validation Error', 'Please fill all required fields');
      return;
    }
    
    const awardData = {
      ...formData,
      employeeId: selectedEmployee?.id || employeeId,
      employeeName: selectedEmployee?.name,
      createdAt: new Date().toISOString()
    };
    
    if (editingAward) {
      const updated = awards.map(a =>
        a.id === editingAward.id ? { ...awardData, id: a.id } : a
      );
      setAwards(updated);
      toast.success('Success', 'Award updated successfully');
    } else {
      const newAward = { id: Date.now(), ...awardData };
      setAwards([newAward, ...awards]);
      toast.success('Success', 'Award added successfully');
    }
    resetForm();
  };

  const handleEdit = (award) => {
    setEditingAward(award);
    setSelectedEmployee({ id: award.employeeId, name: award.employeeName });
    setFormData({
      awardName: award.awardName,
      awardDate: award.awardDate,
      awardType: award.awardType,
      issuedBy: award.issuedBy,
      description: award.description || '',
      certificateFile: null,
      certificateFileData: award.certificateFileData,
      certificateFileName: award.certificateFileName
    });
  };

  const handleView = (award) => {
    setViewingAward(award);
    setShowViewModal(true);
  };

  const handleDelete = (id) => {
    setAwards(awards.filter(a => a.id !== id));
    toast.success('Success', 'Award deleted successfully');
  };

  const handleEmployeeSelect = (employee) => {
    setSelectedEmployee(employee);
    setSearchTerm('');
    setShowDropdown(false);
  };

  const resetForm = () => {
    setFormData({
      awardName: '',
      awardDate: '',
      awardType: 'Performance',
      issuedBy: '',
      description: '',
      certificateFile: null,
      certificateFileData: null,
      certificateFileName: null
    });
    setErrors({});
    setTouched({});
    setEditingAward(null);
  };

  return (
    <div className="container-fluid p-4">
      {/* Header */}
      <div className="d-flex align-items-center gap-3 mb-4 pb-2 border-bottom">
        <div className="bg-primary bg-opacity-10 p-3 rounded-circle">
          <FaTrophy className="text-primary" size={24} />
        </div>
        <div>
          <h5 className="mb-0">Awards & Recognition History</h5>
          <p className="text-muted mb-0 small">Manage employee awards and recognitions</p>
        </div>
      </div>

      {/* Stats */}
      {selectedEmployee && awards.length > 0 && (
        <div className="row g-3 mb-4">
          <div className="col-md-6">
            <div className="card bg-warning bg-opacity-10">
              <div className="card-body d-flex align-items-center gap-3">
                <div className="bg-warning text-white p-3 rounded-circle">
                  <FaTrophy size={20} />
                </div>
                <div>
                  <h4 className="mb-0">{awards.length}</h4>
                  <small className="text-muted">Total Awards</small>
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-6">
            <div className="card bg-success bg-opacity-10">
              <div className="card-body d-flex align-items-center gap-3">
                <div className="bg-success text-white p-3 rounded-circle">
                  <FaStar size={20} />
                </div>
                <div>
                  <h4 className="mb-0">{awards.filter(a => a.awardType === 'Employee of Year').length}</h4>
                  <small className="text-muted">Top Awards</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search Employee */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-header bg-light">
          <h6 className="mb-0 fw-bold">Search Employee</h6>
        </div>
        <div className="card-body">
          <div className="position-relative">
            <div className="input-group">
                <span className="input-group-text bg-light">
                               <FaSearch size={14} className="text-muted" />
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
                  <button className="btn btn-outline-danger" onClick={() => { setSelectedEmployee(null); setSearchTerm(''); resetForm(); }}>
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
                      <small className="text-muted">{emp.code} | {emp.department}</small>
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
            <div className="alert alert-info mt-3 mb-0 py-2">
              <FaUserTie className="mr-2" /> Selected: {selectedEmployee.name} ({selectedEmployee.code})
            </div>
          )}
          
          
        </div>
      </div>

      {/* Form - 2 columns per row */}
      {selectedEmployee && (
        <div className="card shadow-sm mb-4">
          <div className="card-header bg-light">
            <h6 className="mb-0">{editingAward ? 'Edit Award' : 'New Award'}</h6>
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="row">
                {/* Award Name - col 6 */}
                <div className="col-md-6 mb-3">
                  <label className="form-label fw-bold">
                    Award Name <span className="text-danger">*</span>
                  </label>
                  <input 
                    type="text" 
                    className={`form-control ${errors.awardName ? 'is-invalid' : ''}`} 
                    placeholder="e.g., Best Employee of the Year"
                    value={formData.awardName} 
                    onChange={(e) => handleChange('awardName', e.target.value)} 
                    onBlur={() => handleBlur('awardName')}
                  />
                  {errors.awardName && <small className="text-danger">{errors.awardName}</small>}
                </div>

                {/* Award Date - col 6 */}
                <div className="col-md-6 mb-3">
                  <label className="form-label fw-bold">
                    Award Date <span className="text-danger">*</span>
                  </label>
                  <input 
                    type="date" 
                    className={`form-control ${errors.awardDate ? 'is-invalid' : ''}`} 
                    value={formData.awardDate} 
                    onChange={(e) => handleChange('awardDate', e.target.value)} 
                    onBlur={() => handleBlur('awardDate')}
                  />
                  {errors.awardDate && <small className="text-danger">{errors.awardDate}</small>}
                </div>

                {/* Award Type - col 6 */}
                <div className="col-md-6 mb-3">
                  <label className="form-label fw-bold">
                    Award Type <span className="text-danger">*</span>
                  </label>
                  <select 
                    className={`form-control ${errors.awardType ? 'is-invalid' : ''}`} 
                    value={formData.awardType} 
                    onChange={(e) => handleChange('awardType', e.target.value)} 
                    onBlur={() => handleBlur('awardType')}
                  >
                    {awardTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                  {errors.awardType && <small className="text-danger">{errors.awardType}</small>}
                </div>

                {/* Issued By - col 6 */}
                <div className="col-md-6 mb-3">
                  <label className="form-label fw-bold">
                    Issued By <span className="text-danger">*</span>
                  </label>
                  <select 
                    className={`form-control ${errors.issuedBy ? 'is-invalid' : ''}`} 
                    value={formData.issuedBy} 
                    onChange={(e) => handleChange('issuedBy', e.target.value)} 
                    onBlur={() => handleBlur('issuedBy')}
                  >
                    <option value="">Select Issued By</option>
                    {issuedByOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  {errors.issuedBy && <small className="text-danger">{errors.issuedBy}</small>}
                </div>

                {/* Description - col 12 (full width) */}
                <div className="col-12 mb-3">
                  <label className="form-label fw-bold">Description</label>
                  <textarea 
                    rows="3" 
                    className="form-control" 
                    placeholder="Brief description of the award and achievement..."
                    value={formData.description} 
                    onChange={(e) => handleChange('description', e.target.value)}
                  />
                </div>

                {/* Certificate Upload - col 12 */}
                <div className="col-12 mb-3">
                  <label className="form-label fw-bold">Award Certificate</label>
                  <div className="border rounded p-3 text-center bg-light">
                    <input 
                      type="file" 
                      accept=".pdf,.jpg,.jpeg,.png" 
                      onChange={handleFileChange} 
                      style={{ display: 'none' }} 
                      id="certificate-upload" 
                    />
                    <label htmlFor="certificate-upload" className="btn btn-outline-primary btn-sm">
                      <FaUpload className="mr-1" /> Choose File
                    </label>
                    {formData.certificateFileName && (
                      <div className="mt-2 text-primary">
                        {formData.certificateFileName.endsWith('.pdf') ? 
                          <FaFilePdf className="mr-1" /> : <FaFileImage className="mr-1" />}
                        {formData.certificateFileName}
                      </div>
                    )}
                    <small className="text-muted d-block mt-2">Supported: PDF, JPG, PNG (Max 5MB)</small>
                  </div>
                </div>
              </div>

              <div className="d-flex justify-content-end gap-2 mt-3 pt-3 border-top">
                <button type="button" className="btn btn-outline-secondary" onClick={resetForm}>Clear</button>
                <button type="submit" className="btn btn-primary"><FaSave className="mr-1" /> {editingAward ? 'Update' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Table */}
      {selectedEmployee && awards.length > 0 && (
        <div className="card shadow-sm">
          <div className="card-header bg-light">
            <h6 className="mb-0">Awards & Recognition - {selectedEmployee.name}</h6>
          </div>
          <div className="table-responsive">
            <table className="table table-bordered mb-0">
              <thead className="thead-light">
                <tr>
                  <th>Award Name</th>
                  <th>Award Date</th>
                  <th>Award Type</th>
                  <th>Issued By</th>
                  <th>Description</th>
                  <th>Certificate</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {awards.map((award) => (
                  <tr key={award.id}>
                    <td><strong>{award.awardName}</strong></td>
                    <td>{formatDate(award.awardDate)}</td>
                    <td>{award.awardType}</td>
                    <td>{award.issuedBy}</td>
                    <td>{award.description || '—'}</td>
                    <td className="text-center">
                      {award.certificateFileName ? (
                        <a href={award.certificateFileData} download={award.certificateFileName} className="btn btn-sm btn-outline-primary">
                          <FaFileAlt size={12} /> View
                        </a>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td>
                      <button className="btn btn-sm btn-outline-info mr-1" onClick={() => handleView(award)}><FaEye size={12} /></button>
                      <button className="btn btn-sm btn-outline-primary mr-1" onClick={() => handleEdit(award)}><FaEdit size={12} /></button>
                      <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(award.id)}><FaTrash size={12} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

     
      {/* View Modal */}
      {showViewModal && viewingAward && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title"><FaTrophy className="mr-2" /> Award Details</h5>
                <button type="button" className="close text-white" onClick={() => setShowViewModal(false)}>
                  <span>&times;</span>
                </button>
              </div>
              <div className="modal-body">
                <p><strong>Award Name:</strong> {viewingAward.awardName}</p>
                <p><strong>Award Date:</strong> {formatDate(viewingAward.awardDate)}</p>
                <p><strong>Award Type:</strong> {viewingAward.awardType}</p>
                <p><strong>Issued By:</strong> {viewingAward.issuedBy}</p>
                <p><strong>Description:</strong> {viewingAward.description || '—'}</p>
                {viewingAward.certificateFileName && (
                  <a href={viewingAward.certificateFileData} download={viewingAward.certificateFileName} className="btn btn-sm btn-primary mt-2">Download Certificate</a>
                )}
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowViewModal(false)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AwardsHistory;