import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Briefcase, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const OfficerDashboard = ({ onViewDetails }) => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState(null);
  const [justification, setJustification] = useState('');
  const [overrideDecision, setOverrideDecision] = useState('');

  // --- NEW: Pagination State ---
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 5;

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const res = await axios.get('http://127.0.0.1:8000/ml/all-applications');
      setApplications(res.data);
    } catch (err) {}
    setLoading(false);
  };

  const handleOverrideSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`http://127.0.0.1:8000/ml/override/${selectedApp.id}`, {
        manual_decision: overrideDecision,
        officer_justification: justification,
      });
      fetchApplications();
      setSelectedApp(null);
      setJustification('');
      setOverrideDecision('');
    } catch (err) {
      alert('Failed to submit override.');
    }
  };

  if (loading)
    return <div className="p-5 text-center">Loading Officer Dashboard...</div>;

  // --- Multi-Officer UI Helper ---
  const renderFinalStatus = (app) => {
    if (app.reviews && app.reviews.length > 0) {
      const approves = app.reviews.filter(
        (r) => r.decision === 'Approve',
      ).length;
      const approvePct = Math.round((approves / app.reviews.length) * 100);
      const rejectPct = 100 - approvePct;
      return (
        <div>
          <span className="badge" style={{ backgroundColor: '#16a34a' }}>
            Approve {approvePct}%
          </span>
          {rejectPct > 0 && (
            <span className="badge bg-danger ms-1">Reject {rejectPct}%</span>
          )}
          <div className="small text-muted mt-1 d-flex align-items-center gap-1">
            <img
              src="/avatars/user_default_pfp_picture.jpg"
              alt="officers"
              style={{ width: 14, height: 14, borderRadius: '50%' }}
            />
            Reviewed by {app.reviews.map((r) => r.officer_name).join(', ')}
          </div>
        </div>
      );
    }
    if (app.manual_decision) {
      return (
        <div>
          <span
            className="badge"
            style={{
              backgroundColor:
                app.manual_decision === 'Approve' ? '#3d9a6e' : '#f87171',
              fontSize: '0.75rem',
              padding: '0.4rem 0.6rem',
            }}
          >
            Manual: {app.manual_decision}
          </span>
          <div
            className="small text-muted mt-1 d-flex align-items-center gap-1"
            style={{ fontSize: '0.8rem' }}
          >
            <img
              src={
                app.officer_avatar || '/avatars/user_default_pfp_picture.jpg'
              }
              alt="officer"
              style={{
                width: 14,
                height: 14,
                borderRadius: '50%',
                objectFit: 'cover',
              }}
            />
            Reviewed by {app.officer_name}
          </div>
        </div>
      );
    }
    return <span className="badge bg-secondary">Pending Review</span>;
  };

  // --- NEW: Pagination Logic ---
  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = applications.slice(
    indexOfFirstRecord,
    indexOfLastRecord,
  );
  const totalPages = Math.ceil(applications.length / recordsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className="slide-down">
      <div className="d-flex align-items-center mb-4">
        <div
          style={{
            width: 48,
            height: 48,
            background: '#e0e7ff',
            borderRadius: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: '1rem',
          }}
        >
          <Briefcase size={24} color="#4338ca" />
        </div>
        <div>
          <h3 className="fw-bold m-0" style={{ fontFamily: 'Fraunces, serif' }}>
            Officer Workspace
          </h3>
          <p className="text-muted-custom small m-0">
            Review pending applications and manage final decisions.
          </p>
        </div>
      </div>

      <div className="custom-card p-0 overflow-hidden mb-4">
        <table className="table mb-0 align-middle">
          <thead className="bg-light">
            <tr>
              <th className="px-4 py-3 small text-muted border-0">ID & Date</th>
              <th className="py-3 small text-muted border-0">Applicant</th>
              <th className="py-3 small text-muted border-0">AI Assessment</th>
              <th className="py-3 small text-muted border-0">Final Status</th>
              <th className="px-4 py-3 small text-muted text-end border-0">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {/* Map over currentRecords instead of all applications */}
            {currentRecords.map((app) => (
              <tr key={app.id}>
                <td className="px-4 py-3">
                  <div
                    className="fw-bold"
                    style={{ color: 'var(--color-primary)' }}
                  >
                    OWA{app.id}
                  </div>
                  <div className="small fw-semibold text-muted mb-1">
                    App Ref: AP{app.applicant_ic}
                  </div>
                  <div
                    className="small text-muted"
                    style={{ fontSize: '0.75rem' }}
                  >
                    {new Date(app.application_date).toLocaleDateString()}
                  </div>
                </td>
                <td className="py-3 fw-semibold">{app.applicant_name}</td>
                <td className="py-3">
                  <span
                    className="badge text-dark"
                    style={{ backgroundColor: '#fce8e8', color: '#f87171' }}
                  >
                    AI: {app.ai_decision} (
                    {(app.risk_probability * 100).toFixed(1)}% Risk)
                  </span>
                </td>
                <td className="py-3">{renderFinalStatus(app)}</td>
                <td className="px-4 py-3 text-end">
                  <button
                    onClick={() => onViewDetails(app)}
                    className="btn btn-sm fw-bold me-2"
                    style={{
                      backgroundColor: '#f8fafc',
                      border: '1px solid #cbd5e1',
                      color: '#334155',
                    }}
                  >
                    View Details
                  </button>
                  <button
                    onClick={() => setSelectedApp(app)}
                    className="btn btn-sm btn-outline-dark fw-bold"
                    style={{ border: '1px solid #0f172a' }}
                  >
                    Review File
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* --- NEW: Pagination UI --- */}
      {totalPages > 1 && (
        <div className="d-flex justify-content-center mb-4">
          <ul className="pagination pagination-sm shadow-sm m-0">
            <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
              <button
                className="page-link text-primary"
                onClick={() => paginate(currentPage - 1)}
              >
                Prev
              </button>
            </li>
            {[...Array(totalPages)].map((_, i) => (
              <li
                key={i}
                className={`page-item ${currentPage === i + 1 ? 'active' : ''}`}
              >
                <button
                  className={`page-link ${currentPage === i + 1 ? 'bg-primary border-primary text-white' : 'text-primary'}`}
                  onClick={() => paginate(i + 1)}
                >
                  {i + 1}
                </button>
              </li>
            ))}
            <li
              className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}
            >
              <button
                className="page-link text-primary"
                onClick={() => paginate(currentPage + 1)}
              >
                Next
              </button>
            </li>
          </ul>
        </div>
      )}

      {/* --- REVIEW PANEL --- */}
      {selectedApp && (
        <div
          className="custom-card p-4 slide-down"
          style={{
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
          }}
        >
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h5 className="fw-bold m-0 text-slate">
              Review Workspace Record OWAP{selectedApp.applicant_ic}
            </h5>
            <button
              className="btn-close"
              onClick={() => setSelectedApp(null)}
            ></button>
          </div>

          <div
            className="p-3 mb-4 d-flex gap-3 align-items-start"
            style={{
              backgroundColor: '#f0fdf4',
              border: '1px solid #74bd9b',
              borderRadius: '8px',
            }}
          >
            <AlertCircle
              size={20}
              color="#3d9a6e"
              className="mt-1 flex-shrink-0"
            />
            <div className="text-start">
              <strong style={{ color: '#3d9a6e' }}>
                AI Recommendation: {selectedApp.ai_decision}
              </strong>
              <div
                style={{
                  color: '#3d9a6e',
                  fontSize: '0.85rem',
                  marginTop: '2px',
                }}
              >
                The AI evaluated this applicant with a{' '}
                {(selectedApp.risk_probability * 100).toFixed(1)}% probability
                of default. Please provide your final human justification.
              </div>
            </div>
          </div>

          <form onSubmit={handleOverrideSubmit}>
            <div className="mb-4 text-start">
              <label className="fw-bold small d-block mb-2 text-slate">
                Final Manual Decision
              </label>
              <div className="d-flex gap-3">
                <button
                  type="button"
                  className="btn flex-fill py-2 fw-semibold d-flex justify-content-center align-items-center transition-all"
                  style={{
                    border:
                      overrideDecision === 'Approve'
                        ? '3px solid #3d9a6e'
                        : '1px solid #3d9a6e',
                    backgroundColor: 'transparent',
                    color: '#3d9a6e',
                    borderRadius: '6px',
                  }}
                  onClick={() => setOverrideDecision('Approve')}
                >
                  <CheckCircle size={18} className="me-2" /> Approve
                </button>
                <button
                  type="button"
                  className="btn flex-fill py-2 fw-semibold d-flex justify-content-center align-items-center transition-all"
                  style={{
                    border:
                      overrideDecision === 'Reject'
                        ? '3px solid #f87171'
                        : '1px solid #f87171',
                    backgroundColor: 'transparent',
                    color: '#f87171',
                    borderRadius: '6px',
                  }}
                  onClick={() => setOverrideDecision('Reject')}
                >
                  <XCircle size={18} className="me-2" /> Reject
                </button>
              </div>
            </div>
            <div className="mb-4 text-start">
              <label className="fw-bold small d-block mb-2 text-slate">
                Officer Justification & Comments
              </label>
              <textarea
                className="form-control"
                rows="3"
                placeholder="Enter your reasoning for overriding or confirming the AI..."
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                style={{
                  resize: 'none',
                  backgroundColor: '#fafafa',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                }}
                required
              />
            </div>
            <button
              type="submit"
              className="btn w-100 fw-bold"
              style={{
                backgroundColor: '#5a5a5a',
                color: '#cccccc',
                border: 'none',
                padding: '12px',
                borderRadius: '8px',
              }}
              disabled={!overrideDecision || !justification}
            >
              Submit Final Decision
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default OfficerDashboard;
