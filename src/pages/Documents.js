import React, { useState } from 'react';
import { FaFilePdf, FaFileWord, FaFileExcel, FaFileImage, FaDownload, FaEye, FaTrash, FaUpload, FaFolder } from 'react-icons/fa';
import { toast } from 'react-toastify';

const Documents = ({ user }) => {
  const [documents] = useState([
    { id: 1, name: 'Employment Contract.pdf', type: 'PDF', size: '2.4 MB', category: 'Contracts', uploadedBy: 'HR Team', date: '2024-03-15', icon: <FaFilePdf color="#e74c3c" /> },
    { id: 2, name: 'Annual Review.docx', type: 'DOCX', size: '1.1 MB', category: 'Reviews', uploadedBy: 'Emma Watson', date: '2024-03-20', icon: <FaFileWord color="#3498db" /> },
    { id: 3, name: 'Payroll Summary.xlsx', type: 'XLSX', size: '3.2 MB', category: 'Finance', uploadedBy: 'Finance Team', date: '2024-03-25', icon: <FaFileExcel color="#27ae60" /> },
    { id: 4, name: 'Company Policy.pdf', type: 'PDF', size: '5.1 MB', category: 'Policies', uploadedBy: 'Admin', date: '2024-03-10', icon: <FaFilePdf color="#e74c3c" /> },
    { id: 5, name: 'Profile Photo.jpg', type: 'JPG', size: '0.8 MB', category: 'Personal', uploadedBy: 'Olivia Davis', date: '2024-03-18', icon: <FaFileImage color="#f39c12" /> },
  ]);

  const categories = ['All', 'Contracts', 'Reviews', 'Finance', 'Policies', 'Personal'];
  const [selectedCategory, setSelectedCategory] = useState('All');

  const filteredDocs = selectedCategory === 'All' 
    ? documents 
    : documents.filter(doc => doc.category === selectedCategory);

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">Document Management</h2>
        <button className="btn-gradient" onClick={() => toast.info('Upload document')}>
          <FaUpload className="me-2" /> Upload Document
        </button>
      </div>

      {/* Categories */}
      <div className="card-modern p-4 mb-4">
        <div className="d-flex gap-2 flex-wrap">
          {categories.map(cat => (
            <button
              key={cat}
              className={`btn ${selectedCategory === cat ? 'btn-gradient' : 'btn-outline-teal'}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Documents Table */}
      <div className="card-modern overflow-hidden">
        <div className="table-responsive">
          <table className="table table-custom">
            <thead>
              <tr>
                <th>File Name</th>
                <th>Category</th>
                <th>Size</th>
                <th>Uploaded By</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDocs.map(doc => (
                <tr key={doc.id}>
                  <td>
                    <div className="d-flex align-items-center gap-2">
                      {doc.icon}
                      <span className="fw-semibold">{doc.name}</span>
                    </div>
                  </td>
                  <td>
                    <span className="badge-info">{doc.category}</span>
                  </td>
                  <td>{doc.size}</td>
                  <td>{doc.uploadedBy}</td>
                  <td>{doc.date}</td>
                  <td>
                    <FaEye className="me-2" style={{ color: '#2d9c7c', cursor: 'pointer' }} onClick={() => toast.info('Preview')} />
                    <FaDownload className="me-2" style={{ color: '#3498db', cursor: 'pointer' }} onClick={() => toast.info('Downloading')} />
                    <FaTrash style={{ color: '#e74c3c', cursor: 'pointer' }} onClick={() => toast.error('Delete document')} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Storage Usage */}
      <div className="card-modern p-4 mt-4">
        <h5 className="mb-3">Storage Usage</h5>
        <div className="row align-items-center">
          <div className="col-md-8">
            <div className="progress-modern mb-2">
              <div className="progress-bar" style={{ width: '65%' }}></div>
            </div>
            <div className="d-flex justify-content-between">
              <span>Used: 6.5 GB</span>
              <span>Total: 10 GB</span>
            </div>
          </div>
          <div className="col-md-4 text-end">
            <div className="text-teal fw-bold">65% Used</div>
            <small className="text-gray">Upgrade for more space</small>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Documents;