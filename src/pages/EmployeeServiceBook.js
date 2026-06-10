
import React, { useState } from 'react';
import { FaPlus, FaEdit, FaTrash, FaSave, FaTimes, FaChartLine, FaExchangeAlt, FaBriefcase, FaCalendarAlt, FaArrowUp, FaBuilding } from 'react-icons/fa';
import { toast } from '../components/Toast';

const EmployeeServiceBook = ({ employeeId, initialData }) => {
  const [activeTab, setActiveTab] = useState('promotions');
  
  // Promotion State
  const [promotions, setPromotions] = useState(initialData?.promotions || []);
  const [showPromoForm, setShowPromoForm] = useState(false);
  const [editingPromo, setEditingPromo] = useState(null);
  const [promoForm, setPromoForm] = useState({
    date: '',
    fromDesignation: '',
    toDesignation: '',
    salaryHike: '',
    orderNo: '',
    remarks: ''
  });

  // Transfer State
  const [transfers, setTransfers] = useState(initialData?.transfers || []);
  const [showTransferForm, setShowTransferForm] = useState(false);
  const [editingTransfer, setEditingTransfer] = useState(null);
  const [transferForm, setTransferForm] = useState({
    date: '',
    fromBranch: '',
    toBranch: '',
    fromDepartment: '',
    toDepartment: '',
    reason: ''
  });

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', year: 'numeric' });
  };

  // Promotion Functions
  const addPromotion = () => {
    if (!promoForm.date || !promoForm.fromDesignation || !promoForm.toDesignation) {
      toast.warning('Missing Fields', 'Please fill all required fields');
      return;
    }

    if (editingPromo !== null) {
      const updated = [...promotions];
      updated[editingPromo] = { ...promoForm, id: promotions[editingPromo].id };
      setPromotions(updated);
      toast.success('Success', 'Promotion updated successfully');
    } else {
      const newPromo = { id: Date.now(), ...promoForm };
      setPromotions([newPromo, ...promotions]);
      toast.success('Success', 'Promotion added successfully');
    }
    resetPromoForm();
  };

  const editPromotion = (index) => {
    setEditingPromo(index);
    setPromoForm(promotions[index]);
    setShowPromoForm(true);
  };

  const deletePromotion = (id) => {
    setPromotions(promotions.filter(p => p.id !== id));
    toast.success('Success', 'Promotion deleted');
  };

  const resetPromoForm = () => {
    setPromoForm({ date: '', fromDesignation: '', toDesignation: '', salaryHike: '', orderNo: '', remarks: '' });
    setEditingPromo(null);
    setShowPromoForm(false);
  };

  // Transfer Functions
  const addTransfer = () => {
    if (!transferForm.date || !transferForm.fromBranch || !transferForm.toBranch) {
      toast.warning('Missing Fields', 'Please fill all required fields');
      return;
    }

    if (editingTransfer !== null) {
      const updated = [...transfers];
      updated[editingTransfer] = { ...transferForm, id: transfers[editingTransfer].id };
      setTransfers(updated);
      toast.success('Success', 'Transfer updated successfully');
    } else {
      const newTransfer = { id: Date.now(), ...transferForm };
      setTransfers([newTransfer, ...transfers]);
      toast.success('Success', 'Transfer added successfully');
    }
    resetTransferForm();
  };

  const editTransfer = (index) => {
    setEditingTransfer(index);
    setTransferForm(transfers[index]);
    setShowTransferForm(true);
  };

  const deleteTransfer = (id) => {
    setTransfers(transfers.filter(t => t.id !== id));
    toast.success('Success', 'Transfer deleted');
  };

  const resetTransferForm = () => {
    setTransferForm({ date: '', fromBranch: '', toBranch: '', fromDepartment: '', toDepartment: '', reason: '' });
    setEditingTransfer(null);
    setShowTransferForm(false);
  };

  // Calculate stats
  const totalHike = promotions.reduce((sum, p) => sum + (parseFloat(p.salaryHike) || 0), 0);

  return (
    <div className="container-fluid p-3">
      
      {/* Header */}
      <div className="d-flex align-items-center gap-3 mb-4 pb-2 border-bottom">
        <div className="bg-primary bg-opacity-10 p-3 rounded-circle">
          <FaBriefcase className="text-primary" size={24} />
        </div>
        <div>
          <h3 className="mb-0">Employee Service Book</h3>
          <p className="text-muted mb-0 small">Track promotions and transfers</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <div className="card border-0 shadow-sm bg-primary bg-opacity-10">
            <div className="card-body d-flex align-items-center gap-3">
              <div className="bg-primary text-white p-3 rounded-circle">
                <FaChartLine size={20} />
              </div>
              <div>
                <h4 className="mb-0">{promotions.length}</h4>
                <small className="text-muted">Total Promotions</small>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card border-0 shadow-sm bg-success bg-opacity-10">
            <div className="card-body d-flex align-items-center gap-3">
              <div className="bg-success text-white p-3 rounded-circle">
                <FaExchangeAlt size={20} />
              </div>
              <div>
                <h4 className="mb-0">{transfers.length}</h4>
                <small className="text-muted">Total Transfers</small>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card border-0 shadow-sm bg-warning bg-opacity-10">
            <div className="card-body d-flex align-items-center gap-3">
              <div className="bg-warning text-white p-3 rounded-circle">
                <FaArrowUp size={20} />
              </div>
              <div>
                <h4 className="mb-0">{totalHike}%</h4>
                <small className="text-muted">Total Hike</small>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button 
            className={`nav-link ${activeTab === 'promotions' ? 'active' : ''}`}
            onClick={() => setActiveTab('promotions')}
          >
            <FaChartLine className="me-2" /> Promotions
            {promotions.length > 0 && <span className="badge bg-secondary ms-2">{promotions.length}</span>}
          </button>
        </li>
        <li className="nav-item">
          <button 
            className={`nav-link ${activeTab === 'transfers' ? 'active' : ''}`}
            onClick={() => setActiveTab('transfers')}
          >
            <FaExchangeAlt className="me-2" /> Transfers
            {transfers.length > 0 && <span className="badge bg-secondary ms-2">{transfers.length}</span>}
          </button>
        </li>
      </ul>

      {/* Promotions Tab */}
      {activeTab === 'promotions' && (
        <div>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="mb-0">📈 Promotion History</h5>
            {!showPromoForm && (
              <button className="btn btn-primary btn-sm" onClick={() => setShowPromoForm(true)}>
                <FaPlus className="me-1" size={12} /> Add Promotion
              </button>
            )}
          </div>

          {/* Promotion Form */}
          {showPromoForm && (
            <div className="card border mb-4 shadow-sm">
              <div className="card-header bg-light d-flex justify-content-between align-items-center">
                <h6 className="mb-0">{editingPromo !== null ? 'Edit Promotion' : 'Add New Promotion'}</h6>
                <button className="btn-close" onClick={resetPromoForm}></button>
              </div>
              <div className="card-body">
                <div className="row g-3">
                  <div className="col-md-4">
                    <label className="form-label small fw-bold">Promotion Date *</label>
                    <input 
                      type="month" 
                      className="form-control form-control-sm"
                      value={promoForm.date} 
                      onChange={(e) => setPromoForm({...promoForm, date: e.target.value})}
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label small fw-bold">From Designation *</label>
                    <input 
                      type="text" 
                      className="form-control form-control-sm"
                      placeholder="Previous designation"
                      value={promoForm.fromDesignation} 
                      onChange={(e) => setPromoForm({...promoForm, fromDesignation: e.target.value})}
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label small fw-bold">To Designation *</label>
                    <input 
                      type="text" 
                      className="form-control form-control-sm"
                      placeholder="New designation"
                      value={promoForm.toDesignation} 
                      onChange={(e) => setPromoForm({...promoForm, toDesignation: e.target.value})}
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label small fw-bold">Salary Hike (%)</label>
                    <input 
                      type="number" 
                      className="form-control form-control-sm"
                      placeholder="e.g., 15"
                      value={promoForm.salaryHike} 
                      onChange={(e) => setPromoForm({...promoForm, salaryHike: e.target.value})}
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label small fw-bold">Order No.</label>
                    <input 
                      type="text" 
                      className="form-control form-control-sm"
                      placeholder="Order reference"
                      value={promoForm.orderNo} 
                      onChange={(e) => setPromoForm({...promoForm, orderNo: e.target.value})}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small fw-bold">Remarks</label>
                    <input 
                      type="text" 
                      className="form-control form-control-sm"
                      placeholder="Additional remarks"
                      value={promoForm.remarks} 
                      onChange={(e) => setPromoForm({...promoForm, remarks: e.target.value})}
                    />
                  </div>
                </div>
                <div className="mt-3 d-flex justify-content-end gap-2">
                  <button className="btn btn-secondary btn-sm" onClick={resetPromoForm}>Cancel</button>
                  <button className="btn btn-primary btn-sm" onClick={addPromotion}>
                    <FaSave className="me-1" size={12} /> {editingPromo !== null ? 'Update' : 'Save'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Promotions Table */}
          {promotions.length > 0 ? (
            <div className="table-responsive">
              <table className="table table-bordered table-hover align-middle">
                <thead className="table-light">
                  <tr>
                    <th style={{ width: '15%' }}>Date</th>
                    <th style={{ width: '25%' }}>From Designation</th>
                    <th style={{ width: '25%' }}>To Designation</th>
                    <th style={{ width: '10%' }}>Hike</th>
                    <th style={{ width: '15%' }}>Order No.</th>
                    <th style={{ width: '10%' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {promotions.map((promo, idx) => (
                    <tr key={promo.id}>
                      <td>
                        <span className="badge bg-primary bg-opacity-10 text-primary">
                          <FaCalendarAlt className="me-1" size={10} /> {formatDate(promo.date)}
                        </span>
                      </td>
                      <td>{promo.fromDesignation}</td>
                      <td><strong>{promo.toDesignation}</strong></td>
                      <td>
                        {promo.salaryHike && (
                          <span className="badge bg-success">{promo.salaryHike}% ↑</span>
                        )}
                      </td>
                      <td>{promo.orderNo || '—'}</td>
                      <td>
                        <button className="btn btn-sm btn-outline-primary me-1" onClick={() => editPromotion(idx)} title="Edit">
                          <FaEdit size={12} />
                        </button>
                        <button className="btn btn-sm btn-outline-danger" onClick={() => deletePromotion(promo.id)} title="Delete">
                          <FaTrash size={12} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            !showPromoForm && (
              <div className="text-center py-5 bg-light rounded">
                <div className="display-4 mb-3">📈</div>
                <h6>No Promotions Yet</h6>
                <p className="text-muted small">Add your first promotion to track career growth</p>
                <button className="btn btn-primary btn-sm" onClick={() => setShowPromoForm(true)}>
                  <FaPlus className="me-1" size={12} /> Add First Promotion
                </button>
              </div>
            )
          )}
        </div>
      )}

      {/* Transfers Tab */}
      {activeTab === 'transfers' && (
        <div>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="mb-0">📍 Transfer History</h5>
            {!showTransferForm && (
              <button className="btn btn-primary btn-sm" onClick={() => setShowTransferForm(true)}>
                <FaPlus className="me-1" size={12} /> Add Transfer
              </button>
            )}
          </div>

          {/* Transfer Form */}
          {showTransferForm && (
            <div className="card border mb-4 shadow-sm">
              <div className="card-header bg-light d-flex justify-content-between align-items-center">
                <h6 className="mb-0">{editingTransfer !== null ? 'Edit Transfer' : 'Add New Transfer'}</h6>
                <button className="btn-close" onClick={resetTransferForm}></button>
              </div>
              <div className="card-body">
                <div className="row g-3">
                  <div className="col-md-3">
                    <label className="form-label small fw-bold">Transfer Date *</label>
                    <input 
                      type="month" 
                      className="form-control form-control-sm"
                      value={transferForm.date} 
                      onChange={(e) => setTransferForm({...transferForm, date: e.target.value})}
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label small fw-bold">From Branch *</label>
                    <input 
                      type="text" 
                      className="form-control form-control-sm"
                      placeholder="Previous branch"
                      value={transferForm.fromBranch} 
                      onChange={(e) => setTransferForm({...transferForm, fromBranch: e.target.value})}
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label small fw-bold">To Branch *</label>
                    <input 
                      type="text" 
                      className="form-control form-control-sm"
                      placeholder="New branch"
                      value={transferForm.toBranch} 
                      onChange={(e) => setTransferForm({...transferForm, toBranch: e.target.value})}
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label small fw-bold">Order No.</label>
                    <input 
                      type="text" 
                      className="form-control form-control-sm"
                      placeholder="Order reference"
                      value={transferForm.orderNo} 
                      onChange={(e) => setTransferForm({...transferForm, orderNo: e.target.value})}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small fw-bold">From Department</label>
                    <input 
                      type="text" 
                      className="form-control form-control-sm"
                      placeholder="Previous department"
                      value={transferForm.fromDepartment} 
                      onChange={(e) => setTransferForm({...transferForm, fromDepartment: e.target.value})}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small fw-bold">To Department</label>
                    <input 
                      type="text" 
                      className="form-control form-control-sm"
                      placeholder="New department"
                      value={transferForm.toDepartment} 
                      onChange={(e) => setTransferForm({...transferForm, toDepartment: e.target.value})}
                    />
                  </div>
                  <div className="col-12">
                    <label className="form-label small fw-bold">Reason for Transfer</label>
                    <textarea 
                      rows="2" 
                      className="form-control form-control-sm"
                      placeholder="Reason for transfer..."
                      value={transferForm.reason} 
                      onChange={(e) => setTransferForm({...transferForm, reason: e.target.value})}
                    />
                  </div>
                </div>
                <div className="mt-3 d-flex justify-content-end gap-2">
                  <button className="btn btn-secondary btn-sm" onClick={resetTransferForm}>Cancel</button>
                  <button className="btn btn-primary btn-sm" onClick={addTransfer}>
                    <FaSave className="me-1" size={12} /> {editingTransfer !== null ? 'Update' : 'Save'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Transfers Table */}
          {transfers.length > 0 ? (
            <div className="table-responsive">
              <table className="table table-bordered table-hover align-middle">
                <thead className="table-light">
                  <tr>
                    <th style={{ width: '12%' }}>Date</th>
                    <th style={{ width: '20%' }}>From Branch</th>
                    <th style={{ width: '20%' }}>To Branch</th>
                    <th style={{ width: '15%' }}>From Dept</th>
                    <th style={{ width: '15%' }}>To Dept</th>
                    <th style={{ width: '10%' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {transfers.map((transfer, idx) => (
                    <tr key={transfer.id}>
                      <td>
                        <span className="badge bg-info bg-opacity-10 text-info">
                          <FaCalendarAlt className="me-1" size={10} /> {formatDate(transfer.date)}
                        </span>
                      </td>
                      <td><FaBuilding className="me-1" size={10} /> {transfer.fromBranch}</td>
                      <td><strong><FaBuilding className="me-1" size={10} /> {transfer.toBranch}</strong></td>
                      <td>{transfer.fromDepartment || '—'}</td>
                      <td>{transfer.toDepartment || '—'}</td>
                      <td>
                        <button className="btn btn-sm btn-outline-primary me-1" onClick={() => editTransfer(idx)} title="Edit">
                          <FaEdit size={12} />
                        </button>
                        <button className="btn btn-sm btn-outline-danger" onClick={() => deleteTransfer(transfer.id)} title="Delete">
                          <FaTrash size={12} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            !showTransferForm && (
              <div className="text-center py-5 bg-light rounded">
                <div className="display-4 mb-3">📍</div>
                <h6>No Transfers Yet</h6>
                <p className="text-muted small">Add transfer history to track location changes</p>
                <button className="btn btn-primary btn-sm" onClick={() => setShowTransferForm(true)}>
                  <FaPlus className="me-1" size={12} /> Add First Transfer
                </button>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
};

export default EmployeeServiceBook;