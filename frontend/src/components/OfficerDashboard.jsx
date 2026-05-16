import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Briefcase,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  Activity,
} from 'lucide-react';

const OfficerDashboard = ({ onViewDetails }) => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState(null);
  const [justification, setJustification] = useState('');
  const [overrideDecision, setOverrideDecision] = useState('');

  // Pagination State
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
    return (
      <div className="p-5 text-center text-muted-custom">
        Loading Workspace...
      </div>
    );

  const renderFinalStatus = (app) => {
    if (app.reviews && app.reviews.length > 0) {
      const approves = app.reviews.filter(
        (r) => r.decision === 'Approve',
      ).length;
      const approvePct = Math.round((approves / app.reviews.length) * 100);
      const rejectPct = 100 - approvePct;
      return (
        <div>
          <span
            className="badge"
            style={{ backgroundColor: '#3d9a6e', padding: '6px 10px' }}
          >
            Approve {approvePct}%
          </span>
          {rejectPct > 0 && (
            <span
              className="badge ms-1"
              style={{ backgroundColor: '#ef4444', padding: '6px 10px' }}
            >
              Reject {rejectPct}%
            </span>
          )}
          <div className="small text-muted mt-2 d-flex align-items-center gap-1">
            <img
              src="/avatars/user_default_pfp_picture.jpg"
              alt="officers"
              style={{ width: 16, height: 16, borderRadius: '50%' }}
            />
            <span style={{ fontSize: '0.75rem' }}>
              Reviewed by {app.reviews.map((r) => r.officer_name).join(', ')}
            </span>
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
                app.manual_decision === 'Approve'
                  ? 'var(--color-accent-light)'
                  : '#fce8e8',
              color:
                app.manual_decision === 'Approve'
                  ? 'var(--color-accent)'
                  : '#ef4444',
              border:
                app.manual_decision === 'Approve'
                  ? '1px solid var(--color-accent-mid)'
                  : '1px solid #fca5a5',
              fontSize: '0.75rem',
              padding: '0.5rem 0.75rem',
              borderRadius: '8px',
            }}
          >
            Manual: {app.manual_decision}
          </span>
          <div className="text-muted mt-2 d-flex align-items-center gap-1">
            <img
              src={
                app.officer_avatar || '/avatars/user_default_pfp_picture.jpg'
              }
              alt="officer"
              style={{
                width: 16,
                height: 16,
                borderRadius: '50%',
                objectFit: 'cover',
              }}
            />
            <span style={{ fontSize: '0.75rem' }}>
              Reviewed by {app.officer_name}
            </span>
          </div>
        </div>
      );
    }
    return (
      <span
        className="badge"
        style={{
          backgroundColor: '#f1f5f9',
          color: '#64748b',
          border: '1px solid #e2e8f0',
          padding: '6px 10px',
        }}
      >
        Pending Review
      </span>
    );
  };

  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = applications.slice(
    indexOfFirstRecord,
    indexOfLastRecord,
  );
  const totalPages = Math.ceil(applications.length / recordsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const isSubmitDisabled = !overrideDecision || !justification;

  return (
    <div className="slide-down">
      {/* Header Area */}
      <div className="d-flex align-items-center mb-4 p-4 custom-card border-0">
        <div
          style={{
            width: 56,
            height: 56,
            background: 'var(--color-accent-light)',
            borderRadius: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: '1.25rem',
            boxShadow: '0 4px 12px rgba(61, 154, 110, 0.15)',
          }}
        >
          <Briefcase size={28} color="var(--color-accent)" />
        </div>
        <div>
          <h3 className="fw-bold text-slate mb-3">Officer Workspace</h3>
          <p className="text-muted-custom small m-0 mt-1">
            Review pending applications, verify ML logic, and manage final
            decisions.
          </p>
        </div>
      </div>

      {/* Table Area */}
      <div className="mb-4">
        <div className="table-responsive px-1">
          <table className="table custom-table">
            <thead>
              <tr>
                <th className="px-4">ID & Date</th>
                <th>Applicant</th>
                <th>AI Assessment</th>
                <th>Final Status</th>
                <th className="text-end px-4">Action</th>
              </tr>
            </thead>
            <tbody>
              {currentRecords.map((app) => {
                const isApproved = app.ai_decision === 'Approve';
                const assessmentStyle = {
                  backgroundColor: isApproved ? '#ecfdf5' : '#fce8e8',
                  color: isApproved ? '#166534' : '#b91c1c',
                  padding: '6px 10px',
                  border: `1px solid ${isApproved ? '#a7f3d0' : '#fca5a5'}`,
                };

                return (
                  <React.Fragment key={app.id}>
                    <tr>
                      <td className="px-4 py-3">
                        <div className="mb-2">
                          <span
                            style={{
                              backgroundColor: 'var(--color-accent-light)',
                              color: 'var(--color-accent)',
                              padding: '4px 8px',
                              borderRadius: '6px',
                              fontWeight: '700',
                              fontSize: '0.75rem',
                              letterSpacing: '0.05em',
                            }}
                          >
                            OWAP{app.id}
                          </span>
                        </div>
                        <div className="small fw-bold text-slate mb-1">
                          Ref: AP{app.applicant_ic}
                        </div>
                        <div
                          className="text-muted"
                          style={{ fontSize: '0.75rem' }}
                        >
                          {new Date(app.application_date).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="py-3 fw-bold text-slate">
                        {app.applicant_name}
                      </td>
                      <td className="py-3">
                        <span
                          className="badge d-inline-flex align-items-center gap-1"
                          style={assessmentStyle}
                        >
                          <Activity size={14} />
                          AI: {app.ai_decision} (
                          {(app.risk_probability * 100).toFixed(1)}% Risk)
                        </span>
                      </td>
                      <td className="py-3">{renderFinalStatus(app)}</td>
                      <td className="px-4 py-3 text-end">
                        <button
                          onClick={() => onViewDetails(app)}
                          className="btn btn-sm fw-bold me-2 transition-all"
                          style={{
                            backgroundColor: '#f8fafc',
                            border: '1px solid #cbd5e1',
                            color: '#475569',
                          }}
                          onMouseOver={(e) =>
                            (e.target.style.backgroundColor = '#e2e8f0')
                          }
                          onMouseOut={(e) =>
                            (e.target.style.backgroundColor = '#f8fafc')
                          }
                        >
                          <FileText size={14} className="me-1" /> Details
                        </button>
                        <button
                          onClick={(e) => {
                            setSelectedApp(app);
                            // Smoothly snap the screen to center on this specific application's review panel
                            setTimeout(() => {
                              e.target.scrollIntoView({
                                behavior: 'smooth',
                                block: 'center',
                              });
                            }, 100);
                          }}
                          className="btn btn-sm fw-bold btn-cta"
                          style={{ padding: '6px 14px' }}
                        >
                          Review
                        </button>
                      </td>
                    </tr>

                    {selectedApp?.id === app.id && (
                      <tr>
                        <td colSpan="5" className="p-0 border-0">
                          <div
                            className="custom-card p-4 p-md-5 mt-3"
                            style={{
                              borderRadius: '24px',
                              border: '1px solid var(--color-border-light)',
                              boxShadow: 'var(--shadow-lg)',
                            }}
                          >
                            <div className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom">
                              <div>
                                <h5 className="fw-bold text-slate mb-3">
                                  Manual Review Assessment
                                </h5>
                                <p className="text-muted-custom small m-0 mt-1">
                                  Record OWAP{selectedApp.id} Ref: AP
                                  {selectedApp.applicant_ic}
                                </p>
                              </div>
                              <button
                                className="btn-close"
                                onClick={() => setSelectedApp(null)}
                              ></button>
                            </div>

                            <div
                              className="p-4 mb-4 d-flex gap-3 align-items-start"
                              style={{
                                backgroundColor: 'var(--color-accent-light)',
                                border: '1px solid var(--color-accent-mid)',
                                borderRadius: '16px',
                              }}
                            >
                              <AlertCircle
                                size={24}
                                color="var(--color-accent)"
                                className="mt-1 flex-shrink-0"
                              />
                              <div className="text-start">
                                <strong
                                  style={{
                                    color: 'var(--color-accent)',
                                    fontSize: '1.05rem',
                                  }}
                                >
                                  AI Recommendation: {selectedApp.ai_decision}
                                </strong>
                                <div
                                  style={{
                                    color: '#2a6a4c',
                                    fontSize: '0.9rem',
                                    marginTop: '4px',
                                    lineHeight: '1.5',
                                  }}
                                >
                                  The Machine Learning model evaluated this
                                  applicant with a{' '}
                                  <strong>
                                    {(
                                      selectedApp.risk_probability * 100
                                    ).toFixed(1)}
                                    %
                                  </strong>{' '}
                                  probability of default. Please review the
                                  applicant's details and SHAP explanation chart
                                  before providing your final human
                                  justification.
                                </div>
                              </div>
                            </div>

                            <form onSubmit={handleOverrideSubmit}>
                              <div className="mb-4 text-start">
                                <label className="fw-bold d-block mb-3 text-slate">
                                  1. Final Manual Decision
                                </label>
                                <div className="d-flex gap-3">
                                  <button
                                    type="button"
                                    className="btn flex-fill py-3 fw-bold d-flex justify-content-center align-items-center transition-all"
                                    style={{
                                      border:
                                        overrideDecision === 'Approve'
                                          ? '2px solid var(--color-accent)'
                                          : '2px solid var(--color-border)',
                                      backgroundColor:
                                        overrideDecision === 'Approve'
                                          ? 'var(--color-accent-light)'
                                          : 'transparent',
                                      color:
                                        overrideDecision === 'Approve'
                                          ? 'var(--color-accent)'
                                          : 'var(--color-text-muted)',
                                      borderRadius: '12px',
                                    }}
                                    onClick={() =>
                                      setOverrideDecision('Approve')
                                    }
                                  >
                                    <CheckCircle size={20} className="me-2" />{' '}
                                    Approve Application
                                  </button>
                                  <button
                                    type="button"
                                    className="btn flex-fill py-3 fw-bold d-flex justify-content-center align-items-center transition-all"
                                    style={{
                                      border:
                                        overrideDecision === 'Reject'
                                          ? '2px solid #ef4444'
                                          : '2px solid var(--color-border)',
                                      backgroundColor:
                                        overrideDecision === 'Reject'
                                          ? '#fce8e8'
                                          : 'transparent',
                                      color:
                                        overrideDecision === 'Reject'
                                          ? '#ef4444'
                                          : 'var(--color-text-muted)',
                                      borderRadius: '12px',
                                    }}
                                    onClick={() =>
                                      setOverrideDecision('Reject')
                                    }
                                  >
                                    <XCircle size={20} className="me-2" />{' '}
                                    Reject Application
                                  </button>
                                </div>
                              </div>

                              <div className="mb-4 text-start">
                                <label className="fw-bold d-block mb-2 text-slate">
                                  2. Officer Justification & Comments
                                </label>
                                <p className="small text-muted-custom mb-3">
                                  Provide reasoning for confirming or overriding
                                  the AI's decision. This will be stored for
                                  compliance auditing.
                                </p>
                                <textarea
                                  className="form-control p-3"
                                  rows="4"
                                  placeholder="Enter your detailed reasoning here..."
                                  value={justification}
                                  onChange={(e) =>
                                    setJustification(e.target.value)
                                  }
                                  style={{
                                    resize: 'none',
                                    backgroundColor: 'var(--color-surface-2)',
                                    border: '1px solid var(--color-border)',
                                    borderRadius: '12px',
                                    fontSize: '0.95rem',
                                  }}
                                  required
                                />
                              </div>

                              <button
                                type="submit"
                                className="btn w-100 fw-bold py-3 mt-2 transition-all"
                                style={{
                                  backgroundColor: isSubmitDisabled
                                    ? '#e2e8e0'
                                    : 'var(--color-accent)',
                                  color: isSubmitDisabled ? '#94a3b8' : 'white',
                                  border: 'none',
                                  borderRadius: '12px',
                                  boxShadow: isSubmitDisabled
                                    ? 'none'
                                    : '0 8px 24px rgba(61, 154, 110, 0.25)',
                                  cursor: isSubmitDisabled
                                    ? 'not-allowed'
                                    : 'pointer',
                                }}
                                disabled={isSubmitDisabled}
                              >
                                Sign & Submit Final Decision
                              </button>
                            </form>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modern Pagination UI */}
      {totalPages > 1 && (
        <div className="d-flex justify-content-center mb-5 mt-2">
          <ul
            className="pagination pagination-modern shadow-sm p-1 rounded-pill"
            style={{ background: 'var(--color-surface)' }}
          >
            <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
              <button
                className="page-link"
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
                <button className="page-link" onClick={() => paginate(i + 1)}>
                  {i + 1}
                </button>
              </li>
            ))}
            <li
              className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}
            >
              <button
                className="page-link"
                onClick={() => paginate(currentPage + 1)}
              >
                Next
              </button>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default OfficerDashboard;
