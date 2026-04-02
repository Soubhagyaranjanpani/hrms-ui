import React, { useState } from 'react';
import { FaSearch, FaPlus, FaFilter, FaEdit, FaTrash, FaEye, FaUserPlus } from 'react-icons/fa';
import { toast } from 'react-toastify';

const Employees = ({ user }) => {
  const [employees, setEmployees] = useState([
    { id: 1, name: 'Emma Watson', email: 'emma@hrnexus.com', department: 'IT', role: 'Senior Developer', status: 'Active', joinDate: '2023-01-15', phone: '+1 234 567 890', avatar: 'EW' },
    { id: 2, name: 'Liam Brown', email: 'liam@hrnexus.com', department: 'HR', role: 'HR Manager', status: 'Active', joinDate: '2022-06-10', phone: '+1 345 678 901', avatar: 'LB' },
    { id: 3, name: 'Olivia Davis', email: 'olivia@hrnexus.com', department: 'Sales', role: 'Sales Executive', status: 'Leave', joinDate: '2024-02-20', phone: '+1 456 789 012', avatar: 'OD' },
    { id: 4, name: 'Noah Wilson', email: 'noah@hrnexus.com', department: 'IT', role: 'System Admin', status: 'Active', joinDate: '2021-11-01', phone: '+1 567 890 123', avatar: 'NW' },
    { id: 5, name: 'Ava Martinez', email: 'ava@hrnexus.com', department: 'Marketing', role: 'Marketing Lead', status: 'Remote', joinDate: '2023-08-15', phone: '+1 678 901 234', avatar: 'AM' },
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const getStatusBadge = (status) => {
    const badges = {
      Active: 'badge-success',
      Leave: 'badge-warning',
      Remote: 'badge-info'
    };
    return badges[status] || 'badge-secondary';
  };

  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         emp.department.toLowerCase().includes(searchTerm.toLowerCase());
    if (activeTab === 'all') return matchesSearch;
    return matchesSearch && emp.status === activeTab;
  });

  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);
  const paginatedEmployees = filteredEmployees.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this employee?')) {
      setEmployees(employees.filter(emp => emp.id !== id));
      toast.success('Employee deleted successfully');
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <h2 className="mb-0">Employee Directory</h2>
        <button className="btn-gradient" onClick={() => toast.info('Add employee form coming soon')}>
          <FaUserPlus className="me-2" /> Add Employee
        </button>
      </div>

      {/* Search and Filters */}
      <div className="card-modern p-4 mb-4">
        <div className="row g-3">
          <div className="col-md-6">
            <div className="input-group">
              <span className="input-group-text" style={{ background: 'transparent', borderColor: 'rgba(45,156,124,0.3)' }}>
                <FaSearch />
              </span>
              <input
                type="text"
                className="form-control"
                style={{ background: 'transparent', borderColor: 'rgba(45,156,124,0.3)', color: 'white' }}
                placeholder="Search by name, email, department..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="col-md-6">
            <button className="btn-outline-teal w-100">
              <FaFilter className="me-2" /> Advanced Filters
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="nav nav-tabs mt-4" style={{ borderBottomColor: 'rgba(45,156,124,0.3)' }}>
          <button className={`nav-link ${activeTab === 'all' ? 'active' : ''}`} 
                  onClick={() => setActiveTab('all')}
                  style={{ color: activeTab === 'all' ? '#2d9c7c' : 'var(--text-gray)' }}>
            All Employees
          </button>
          <button className={`nav-link ${activeTab === 'Active' ? 'active' : ''}`} 
                  onClick={() => setActiveTab('Active')}>
            Active
          </button>
          <button className={`nav-link ${activeTab === 'Leave' ? 'active' : ''}`} 
                  onClick={() => setActiveTab('Leave')}>
            On Leave
          </button>
          <button className={`nav-link ${activeTab === 'Remote' ? 'active' : ''}`} 
                  onClick={() => setActiveTab('Remote')}>
            Remote
          </button>
        </div>
      </div>

      {/* Employees Table */}
      <div className="card-modern overflow-hidden">
        <div className="table-responsive">
          <table className="table table-custom">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Department</th>
                <th>Role</th>
                <th>Status</th>
                <th>Join Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedEmployees.map(emp => (
                <tr key={emp.id}>
                  <td>
                    <div className="d-flex align-items-center gap-2">
                      <div className="rounded-circle d-flex align-items-center justify-content-center" 
                           style={{ width: '40px', height: '40px', background: 'rgba(45,156,124,0.2)' }}>
                        <span className="fw-bold">{emp.avatar}</span>
                      </div>
                      <div>
                        <div className="fw-semibold">{emp.name}</div>
                        <small className="text-gray">{emp.email}</small>
                      </div>
                    </div>
                  </td>
                  <td>{emp.department}</td>
                  <td>{emp.role}</td>
                  <td><span className={getStatusBadge(emp.status)}>{emp.status}</span></td>
                  <td>{emp.joinDate}</td>
                  <td>
                    <FaEye className="me-2" style={{ color: '#2d9c7c', cursor: 'pointer' }} onClick={() => toast.info('View details')} />
                    <FaEdit className="me-2" style={{ color: '#f4b942', cursor: 'pointer' }} onClick={() => toast.info('Edit employee')} />
                    <FaTrash style={{ color: '#e74c3c', cursor: 'pointer' }} onClick={() => handleDelete(emp.id)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="d-flex justify-content-between align-items-center p-3">
            <button 
              className="btn-outline-teal" 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
            >
              Previous
            </button>
            <span>Page {currentPage} of {totalPages}</span>
            <button 
              className="btn-outline-teal" 
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(currentPage + 1)}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Employees;