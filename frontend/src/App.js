import React, { useState, useEffect, useContext } from 'react';
import { Container, Row, Col, Spinner, Form, Alert } from 'react-bootstrap';
import {
  Search,
  ArrowRight,
  User,
  Calendar,
  DollarSign,
  ArrowLeft,
  ShieldCheck,
  LogOut,
  Users,
} from 'lucide-react';
import axios from 'axios';
import GaugeChart from 'react-gauge-chart';
import CreditForm from './components/CreditForm';
import XaiChart from './components/XaiChart';
import { predictLoan } from './services/api';
import { AuthContext } from './context/AuthContext';
import Login from './components/Login';
import Register from './components/Register';
import Profile from './components/Profile';
import OfficerDashboard from './components/OfficerDashboard';
import MainPage from './components/MainPage';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import ApplicantDashboard from './components/ApplicantDashboard';
import RecordPage from './components/RecordPage';

// Main application view manager. Contains handlers for searching,
// submitting loan forms, rendering results, and user session control.
// GLOBAL API INTERCEPTOR FOR SESSION MANAGEMENT
axios.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Check if the error is a 401/403
    const isAuthError =
      error.response &&
      (error.response.status === 401 || error.response.status === 403);

    // FIX: Use Regex to broadly match ANY login, token, or register endpoint
    const isLoginOrRegister =
      error.config &&
      error.config.url &&
      error.config.url.match(/login|token|register/i);

    // ONLY wipe cache and reload if it's an Auth error AND it's NOT a login/register attempt
    if (isAuthError && !isLoginOrRegister) {
      console.warn(
        'Session invalid or database reset detected. Clearing local cache.',
      );

      localStorage.removeItem('user');
      localStorage.removeItem('token');
      localStorage.removeItem('recent_records');

      if (window.location.pathname !== '/') {
        window.location.href = '/';
      } else {
        window.location.reload();
      }
    }
    return Promise.reject(error);
  },
);

function App() {
  const { user, logout, loading: authLoading } = useContext(AuthContext);

  const [showAuth, setShowAuth] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  const [appToast, setAppToast] = useState(null);
  const [hasGreeted, setHasGreeted] = useState(false);

  const [currentView, setCurrentView] = useState('home');
  const [homeTab, setHomeTab] = useState('apply');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [history, setHistory] = useState([]);

  const [historyPage, setHistoryPage] = useState(1);
  const historyPerPage = 5;

  const [resultView, setResultView] = useState('analysis');
  const [searchError, setSearchError] = useState('');

  useEffect(() => {
    if (user) {
      setShowAuth(false);
      // Show success toast on login, but only once per session
      if (!hasGreeted) {
        setAppToast({ msg: `Welcome, ${user.name}!`, type: 'success' });
        setTimeout(() => setAppToast(null), 3000);
        setHasGreeted(true);
      }
    } else {
      setHasGreeted(false); // Reset greeting when logged out
    }
  }, [user, hasGreeted]);

  useEffect(() => {
    const fetchInitialHistory = async () => {
      if (homeTab === 'record' && user?.role === 'applicant') {
        setSearchQuery('');
        setHistoryPage(1);
        setSearchError('');

        try {
          // --- SECURE & INSTANT SYNC ---
          // Fetch all records belonging to this specific user directly from the database!
          const response = await axios.get(
            `http://127.0.0.1:8000/history/me/all`,
          );
          if (response.data) {
            setHistory(response.data);
            // Optionally update cache for faster subsequent loads
            localStorage.setItem(
              'recent_records',
              JSON.stringify(response.data.slice(0, 50)),
            );
          }
        } catch (err) {
          console.error('Failed to fetch user history:', err);
          setHistory([]);
        }
      }
    };
    fetchInitialHistory();
  }, [homeTab, user]);

  const handleSearch = async (icToSearch = searchQuery) => {
    setSearchError('');

    // NEW: If search bar is empty, automatically fetch all history!
    if (!icToSearch || String(icToSearch).trim() === '') {
      try {
        const response = await axios.get(
          `http://127.0.0.1:8000/history/me/all`,
        );
        setHistory(response.data || []);
        setHistoryPage(1);
      } catch (err) {
        setHistory([]);
      }
      return;
    }

    const cleanIc = String(icToSearch)
      .toUpperCase()
      .replace(/^(AP|OWAP|OWA)/, '')
      .trim();

    try {
      const response = await axios.get(
        `http://127.0.0.1:8000/history/${cleanIc}`,
      );
      if (!response.data || response.data.length === 0) {
        setHistory([]);
        return setSearchError(
          'Record does not exist or you do not have permission to view it.',
        );
      }
      setHistory(response.data);
      setHistoryPage(1);
    } catch (err) {
      setHistory([]);
      setSearchError(
        'Record does not exist or you do not have permission to view it.',
      );
    }
  };

  // Submit application data to the prediction endpoint and persist recent records locally
  const handleFormSubmit = async (data) => {
    setCurrentView('result');
    setLoading(true);
    try {
      const response = await predictLoan(data);
      setResult(response);
      localStorage.setItem('last_ic', data.applicant_ic);
      try {
        const existing = JSON.parse(
          localStorage.getItem('recent_records') || '[]',
        );
        const newRecord = {
          ...response,
          applicant_ic: data.applicant_ic,
          application_date:
            response.application_date || new Date().toISOString(),
          raw_features_log: data,
        };
        const deduped = [
          newRecord,
          ...existing.filter(
            (r) => String(r.applicant_ic) !== String(newRecord.applicant_ic),
          ),
        ];
        // Allow up to 50 records stored locally so pagination works well locally
        localStorage.setItem(
          'recent_records',
          JSON.stringify(deduped.slice(0, 50)),
        );
      } catch (err) {}
    } catch (err) {
      alert('Analysis failed. Check backend connection.');
      setCurrentView('form');
    } finally {
      setLoading(false);
    }
  };

  const handleViewOfficerDetail = async (app) => {
    // FIX: Instantly scroll to the top of the page when opening an application
    window.scrollTo({ top: 0, behavior: 'smooth' });

    setLoading(true);
    setCurrentView('result');
    try {
      const response = await axios.get(
        `http://127.0.0.1:8000/history/${app.applicant_ic}`,
      );
      if (response.data && response.data.length > 0) {
        setResult(response.data[0]);
      } else {
        setResult(app);
      }
    } catch (e) {
      setResult(app);
    }
    setLoading(false);
  };

  const handleLogout = () => {
    logout();
    setHomeTab('apply');
    setCurrentView('home');
    setHistoryPage(1);
  };

  if (authLoading)
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <Spinner animation="border" style={{ color: '#10b981' }} />
      </div>
    );

  if (!user) {
    if (showAuth) {
      return (
        <div
          className="min-vh-100 d-flex flex-column align-items-center justify-content-center"
          style={{ background: '#f8fafc' }}
        >
          <div
            style={{ maxWidth: '500px', width: '100%', paddingLeft: '1rem' }}
          >
            <button
              className="btn btn-back-theme"
              onClick={() => setShowAuth(false)}
            >
              <ArrowLeft size={18} className="me-1" /> Back to Home
            </button>
          </div>
          {showRegister ? (
            <Register switchToLogin={() => setShowRegister(false)} />
          ) : (
            <Login switchToRegister={() => setShowRegister(true)} />
          )}
        </div>
      );
    }
    return <MainPage onLoginClick={() => setShowAuth(true)} />;
  }

  const renderResultView = () => {
    const finalDecision = result?.decision || result?.ai_decision || 'Unknown';
    const riskProb = result?.risk_probability || 0;

    return (
      <div className="fade-in">
        {loading ? (
          <div className="text-center py-5 mt-5">
            <Spinner
              animation="border"
              style={{ color: '#10b981', width: '3rem', height: '3rem' }}
            />
            <h4 className="mt-4 fw-bold text-slate">Analyzing Profile...</h4>
          </div>
        ) : (
          result && (
            <div className="fade-in">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <button
                  className="btn btn-back-theme"
                  onClick={() => {
                    setCurrentView('home');
                    setResultView('analysis');
                  }}
                  style={{ width: '150px' }}
                >
                  <ArrowLeft size={20} className="me-2" /> Back
                </button>

                <div
                  className="p-1 rounded-pill d-inline-flex"
                  style={{
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                  }}
                >
                  <button
                    className="toggle-btn border-0"
                    style={{
                      backgroundColor:
                        resultView === 'record' ? '#e2e8f0' : 'transparent',
                      color: resultView === 'record' ? '#475569' : '#94a3b8',
                      fontWeight: '600',
                      borderRadius: '50rem',
                      transition: 'all 0.2s ease-in-out',
                    }}
                    onClick={() => setResultView('record')}
                  >
                    Form Record
                  </button>
                  <button
                    className="toggle-btn border-0"
                    style={{
                      backgroundColor:
                        resultView === 'analysis' ? '#e2e8f0' : 'transparent',
                      color: resultView === 'analysis' ? '#475569' : '#94a3b8',
                      fontWeight: '600',
                      borderRadius: '50rem',
                      transition: 'all 0.2s ease-in-out',
                    }}
                    onClick={() => setResultView('analysis')}
                  >
                    AI Analysis
                  </button>
                </div>
                <div style={{ width: '150px' }}></div>
              </div>

              {resultView === 'analysis' && (
                <div className="custom-card p-4 p-md-5 slide-down">
                  <Row className="align-items-center border-bottom pb-4 mb-4">
                    <Col md={5} className="text-center">
                      <GaugeChart
                        id="gauge-chart"
                        nrOfLevels={2}
                        colors={['#10b981', '#ef4444']}
                        arcWidth={0.15}
                        percent={finalDecision === 'Approve' ? 0.25 : 0.85}
                        textColor="#0f172a"
                        hideText={true}
                        style={{ width: '80%', margin: '0 auto' }}
                      />
                      <h2
                        className={`fw-bold mt-2 ${finalDecision === 'Approve' ? 'text-emerald' : 'text-danger'}`}
                      >
                        {finalDecision}
                      </h2>
                      <p className="text-muted-custom fw-semibold">
                        Probability of Default : {(riskProb * 100).toFixed(1)}%{' '}
                        <br></br> Score: {((1 - riskProb) * 100).toFixed(1)}
                        /100
                      </p>
                    </Col>
                    <Col md={7}>
                      <h3 className="fw-bold text-slate mb-3">
                        Final Decision
                      </h3>
                      <p className="text-muted-custom mb-4">
                        Based on our ML analysis of your financial profile, your
                        microloan application has been
                        <strong
                          className={
                            finalDecision === 'Approve'
                              ? 'text-emerald'
                              : 'text-danger'
                          }
                        >
                          {' '}
                          {String(finalDecision).toLowerCase()}
                        </strong>
                        .
                      </p>

                      {result.manual_decision ||
                      (result.reviews && result.reviews.length > 0) ? (
                        <div
                          className="mt-4 p-3 rounded-4 border"
                          style={{
                            backgroundColor: '#f8fafc',
                            borderColor: '#cbd5e1',
                          }}
                        >
                          <h6 className="fw-bold d-flex align-items-center gap-2 mb-3 text-slate">
                            <ShieldCheck size={18} color="#645cb4" /> Official
                            Officer Review
                          </h6>

                          {result.reviews && result.reviews.length > 0 ? (
                            <div className="d-flex align-items-start gap-3">
                              <div
                                className="d-flex align-items-center justify-content-center bg-white border rounded-circle flex-shrink-0"
                                style={{ width: 48, height: 48 }}
                              >
                                <Users size={24} color="#475569" />
                              </div>
                              <div className="w-100">
                                <div className="fw-bold fs-6 lh-1 mb-1">
                                  Reviewed by Officer{' '}
                                  <span className="text-primary">
                                    {result.reviews
                                      .map((r) => r.officer_name)
                                      .join(', ')}
                                  </span>
                                </div>
                                <div className="small text-muted mb-2">
                                  Loan Officer Panel
                                </div>

                                <div className="mb-3 d-flex gap-2">
                                  {(() => {
                                    const approves = result.reviews.filter(
                                      (r) => r.decision === 'Approve',
                                    ).length;
                                    const rejects = result.reviews.filter(
                                      (r) => r.decision === 'Reject',
                                    ).length;
                                    const total = result.reviews.length;
                                    const appPct = Math.round(
                                      (approves / total) * 100,
                                    );
                                    const rejPct = Math.round(
                                      (rejects / total) * 100,
                                    );
                                    return (
                                      <>
                                        {approves > 0 && (
                                          <span
                                            className="badge"
                                            style={{
                                              backgroundColor: '#3d9a6e',
                                            }}
                                          >
                                            Approve({approves}) {appPct}%
                                          </span>
                                        )}
                                        {rejects > 0 && (
                                          <span className="badge bg-danger">
                                            Reject({rejects}) {rejPct}%
                                          </span>
                                        )}
                                      </>
                                    );
                                  })()}
                                </div>

                                <div className="d-flex flex-column mt-3 border-top pt-3">
                                  {result.reviews.map((r, idx) => (
                                    <div
                                      key={idx}
                                      className="mb-1 text-dark"
                                      style={{ fontSize: '0.9rem' }}
                                    >
                                      <span className="fw-bold">
                                        Officer {r.officer_name}:
                                      </span>{' '}
                                      <span className="fst-italic text-muted-custom">
                                        "{r.justification}"
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="d-flex align-items-start gap-3">
                              <img
                                src={
                                  result.officer_avatar ||
                                  '/avatars/user_default_pfp_picture.jpg'
                                }
                                alt="Officer"
                                style={{
                                  width: 48,
                                  height: 48,
                                  borderRadius: '50%',
                                  objectFit: 'cover',
                                  border: '2px solid #e2e8f0',
                                }}
                              />
                              <div>
                                <div className="fw-bold fs-6 lh-1 mb-1">
                                  {result.officer_name}
                                </div>
                                <div className="small text-muted mb-2">
                                  Senior Loan Officer
                                </div>
                                <span
                                  className={`badge ${result.manual_decision === 'Approve' ? 'bg-success' : 'bg-danger'} mb-2`}
                                >
                                  Status: {result.manual_decision}
                                </span>
                                <p className="small m-0 text-dark fst-italic">
                                  "{result.officer_justification}"
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="bg-light p-4 rounded-4 border mt-3">
                          <p className="m-0 text-muted-custom fst-italic small">
                            "Summary:{' '}
                            {result.dynamic_explanation ||
                              'Assessment complete.'}
                            "
                          </p>
                          <div className="text-end mt-2">
                            <span className="badge bg-secondary bg-opacity-10 text-secondary border">
                              Pending Human Review
                            </span>
                          </div>
                        </div>
                      )}
                    </Col>
                  </Row>
                  {/* DYNAMIC DUAL-THEMED INSIGHTS SECTION */}
                  {/* DYNAMIC DUAL-THEMED INSIGHTS SECTION */}
                  <Row className="mb-5">
                    <Col xs={12}>
                      {/* Change header to be a bit more neutral since it now contains mixed factors */}
                      <h4 className="fw-bold text-slate mb-3">
                        {finalDecision === 'Approve'
                          ? 'Key Profile Factors and Actionable Insights'
                          : 'Actionable Insights for Improvement'}
                      </h4>

                      <Row>
                        {result.recommendations &&
                          result.recommendations.map((rec, index) => {
                            // FIX: Determine styling based on individual effect, not overall decision
                            const isProtective = rec.effect < 0;

                            return (
                              <Col md={6} key={index}>
                                <div
                                  className="p-3 rounded-3 mb-3 shadow-sm h-100"
                                  style={{
                                    backgroundColor: isProtective
                                      ? 'var(--color-accent-light)'
                                      : '#fce8e8',
                                    borderLeft: isProtective
                                      ? '4px solid #3d9a6e'
                                      : '4px solid #ef4444',
                                  }}
                                >
                                  <strong className="d-block text-dark mb-1">
                                    {rec.feature_name}
                                  </strong>
                                  <p className="mb-2 small text-muted-custom">
                                    {rec.reason}
                                  </p>
                                  <div className="bg-white p-2 rounded border small">
                                    {/* Implemented your cleaner UX phrasing */}
                                    <span
                                      className={`fw-bold ${isProtective ? 'text-slate' : 'text-danger'}`}
                                    >
                                      Recommended Action:
                                    </span>
                                    <span className="text-muted-custom">
                                      {' '}
                                      {rec.action}
                                    </span>
                                  </div>
                                </div>
                              </Col>
                            );
                          })}
                      </Row>
                    </Col>
                  </Row>

                  {/* DYNAMIC DUAL-THEMED XAI CHART SECTION  */}
                  {result.shap_log && result.shap_log.length > 0 && (
                    <Row className="mt-5 pt-3">
                      <Col xs={12}>
                        <h4 className="fw-bold text-slate mb-3">
                          {finalDecision === 'Approve'
                            ? 'AI Approval Confidence'
                            : 'AI Risk Feature Importance'}
                        </h4>
                        <XaiChart
                          data={result.shap_log}
                          decision={finalDecision}
                          recommendations={result.recommendations}
                        />
                      </Col>
                    </Row>
                  )}
                </div>
              )}
              {resultView === 'record' && <RecordPage result={result} />}
            </div>
          )
        )}
      </div>
    );
  };

  // --- NEW: Applicant History Pagination Logic ---
  const indexOfLastHistory = historyPage * historyPerPage;
  const indexOfFirstHistory = indexOfLastHistory - historyPerPage;
  const currentHistory = history.slice(indexOfFirstHistory, indexOfLastHistory);
  const totalHistoryPages = Math.ceil(history.length / historyPerPage);

  return (
    <Container className="py-4" style={{ maxWidth: '1000px' }}>
      <style>{`.btn-animated{transition:transform .15s ease, box-shadow .15s ease;} .btn-animated:hover{transform:translateY(-3px) scale(1.02); box-shadow:0 8px 28px rgba(15,23,42,0.06);} .record-detail-btn{transition: color .12s ease, transform .12s ease;} .record-detail-btn:hover{transform:translateX(6px);}`}</style>
      {/* --- NEW: GLOBAL SUCCESS TOAST --- */}
      {appToast && (
        <div
          style={{
            position: 'fixed',
            top: '30px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor:
              appToast.type === 'success' ? '#3d9a6e' : '#f87171',
            color: '#fff',
            padding: '14px 28px',
            borderRadius: '14px',
            zIndex: 9999,
            fontWeight: '600',
            boxShadow: '0 12px 32px rgba(0,0,0,0.15)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '0.95rem',
            animation: 'fadeIn 0.3s ease',
          }}
        >
          <ShieldCheck size={18} />
          {appToast.msg}
        </div>
      )}
      {(currentView === 'home' || user.role === 'loan_officer') && (
        <div className="app-header mb-4 slide-down d-flex align-items-center position-relative">
          <div className="brand-logo" style={{ width: '500px' }}>
            <div className="brand-logo-mark">C</div>
            <div>
              <p className="brand-name">Credify</p>
              <p className="brand-tagline">
                Microloan Credit Scoring Classification Platform
              </p>
            </div>
          </div>

          <div className="position-absolute start-50 translate-middle-x">
            <div
              className="p-1 rounded-pill d-inline-flex"
              style={{
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
              }}
            >
              {user.role === 'loan_officer' ? (
                <button
                  className="border-0 shadow-sm"
                  style={{
                    backgroundColor: '#ffffff',
                    color: '#0f172a',
                    fontWeight: '600',
                    borderRadius: '50rem',
                    padding: '6px 18px',
                  }}
                  onClick={() => {
                    setHomeTab('dashboard');
                    setCurrentView('home');
                  }}
                >
                  Workspace
                </button>
              ) : (
                <>
                  <button
                    className="border-0"
                    style={{
                      backgroundColor:
                        homeTab === 'apply' ? '#ffffff' : 'transparent',
                      color: homeTab === 'apply' ? '#0f172a' : '#64748b',
                      fontWeight: '600',
                      borderRadius: '50rem',
                      padding: '6px 18px',
                      boxShadow:
                        homeTab === 'apply'
                          ? '0 1px 3px rgba(0,0,0,0.1)'
                          : 'none',
                      transition: 'all 0.2s ease-in-out',
                    }}
                    onClick={() => {
                      setHomeTab('apply');
                      setCurrentView('home');
                    }}
                  >
                    Apply
                  </button>
                  <button
                    className="border-0"
                    style={{
                      backgroundColor:
                        homeTab === 'record' ? '#ffffff' : 'transparent',
                      color: homeTab === 'record' ? '#0f172a' : '#64748b',
                      fontWeight: '600',
                      borderRadius: '50rem',
                      padding: '6px 18px',
                      boxShadow:
                        homeTab === 'record'
                          ? '0 1px 3px rgba(0,0,0,0.1)'
                          : 'none',
                      transition: 'all 0.2s ease-in-out',
                    }}
                    onClick={() => {
                      setHomeTab('record');
                      setCurrentView('home');
                    }}
                  >
                    Record
                  </button>
                </>
              )}
            </div>
          </div>

          <div
            className="d-flex align-items-center gap-3 ms-auto"
            style={{ width: '250px', justifyContent: 'flex-end' }}
          >
            <div
              className="d-flex align-items-center gap-2"
              style={{ cursor: 'pointer' }}
              onClick={() => {
                setHomeTab('profile');
                setCurrentView('home');
              }}
            >
              <div className="d-none d-sm-block text-end">
                <div className="fw-bold lh-1" style={{ fontSize: '0.85rem' }}>
                  {user.name}
                </div>
                <div
                  className="text-muted-custom"
                  style={{ fontSize: '0.7rem', textTransform: 'capitalize' }}
                >
                  {user.role ? user.role.replace('_', ' ') : ''}
                </div>
              </div>
              <img
                src={
                  user.profile_picture_url ||
                  '/avatars/user_default_pfp_picture.jpg'
                }
                alt="Profile"
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '2px solid #e2e8f0',
                }}
              />
            </div>
            <button
              onClick={handleLogout}
              className="btn btn-light border d-flex align-items-center justify-content-center"
              style={{
                width: '36px',
                height: '36px',
                padding: '0',
                borderRadius: '8px',
              }}
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      )}

      {currentView === 'result' ? (
        renderResultView()
      ) : currentView === 'form' ? (
        <CreditForm
          onSubmit={handleFormSubmit}
          onCancel={() => setCurrentView('home')}
        />
      ) : (
        <div className="fade-in">
          {user.role === 'loan_officer' ? (
            homeTab === 'profile' ? (
              <Profile />
            ) : (
              <OfficerDashboard onViewDetails={handleViewOfficerDetail} />
            )
          ) : (
            <>
              {homeTab === 'profile' ? (
                <Profile />
              ) : homeTab === 'apply' ? (
                <ApplicantDashboard
                  onStartApplication={() => setCurrentView('form')}
                />
              ) : (
                <div className="fade-in">
                  <div className="mb-5 d-flex gap-2">
                    <div className="position-relative flex-grow-1">
                      <Search
                        className="position-absolute text-muted-custom"
                        style={{ left: '16px', top: '16px' }}
                        size={20}
                      />
                      <Form.Control
                        type="text"
                        placeholder="Enter ID to Search History Record..."
                        className="custom-input ps-5"
                        value={searchQuery}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSearchQuery(val);
                          if (searchError) setSearchError('');
                          // Auto-fetch all if cleared
                          if (val.trim() === '') {
                            handleSearch('');
                          }
                        }}
                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                      />
                    </div>
                    <button
                      className={`btn btn-dark-custom btn-animated ${!searchQuery ? 'disabled' : ''}`}
                      onClick={() => handleSearch()}
                      disabled={!searchQuery}
                    >
                      Search Record
                    </button>
                  </div>
                  {searchError && (
                    <Alert variant="warning" className="mb-3">
                      {searchError}
                    </Alert>
                  )}
                  <h5 className="fw-bold text-slate mb-3">Past Records</h5>

                  {/* MAP OVER currentHistory INSTEAD OF history */}
                  {currentHistory.map((record, index) => {
                    const ic =
                      record.applicant_ic ||
                      record.raw_features_log?.applicant_ic ||
                      'Unknown';
                    const gender =
                      record.CODE_GENDER ??
                      record.raw_features_log?.CODE_GENDER;
                    const income =
                      record.AMT_INCOME_TOTAL ??
                      record.raw_features_log?.AMT_INCOME_TOTAL;
                    const daysBirth =
                      record.DAYS_BIRTH ?? record.raw_features_log?.DAYS_BIRTH;
                    const ageYears = daysBirth
                      ? Math.floor(Math.abs(daysBirth) / 365.25)
                      : 'N/A';

                    return (
                      <div
                        key={record.id || index}
                        className="record-card bg-white p-4 mb-3"
                      >
                        <div className="d-flex justify-content-between mb-3">
                          <div className="d-flex gap-3 align-items-center">
                            <span className="badge bg-light text-dark border p-2">
                              ID: AP{ic}
                            </span>
                            <span
                              className={`badge ${record.decision === 'Approve' ? 'bg-success' : 'bg-danger'} bg-opacity-10 ${record.decision === 'Approve' ? 'text-success' : 'text-danger'} p-2 px-3`}
                            >
                              Model: {record.decision}
                            </span>

                            {record.manual_decision && (
                              <span
                                className={`badge ${record.manual_decision === 'Approve' ? 'bg-success' : 'bg-danger'} text-white p-2 px-3 shadow-sm`}
                              >
                                Officer: {record.manual_decision}
                              </span>
                            )}
                          </div>
                          <span className="text-muted-custom small">
                            {record.application_date
                              ? new Date(
                                  record.application_date,
                                ).toLocaleString()
                              : 'Just now'}
                          </span>
                        </div>
                        <Row className="align-items-center">
                          <Col
                            xs={3}
                            className="text-muted-custom small d-flex align-items-center gap-2"
                          >
                            <User size={16} />{' '}
                            {gender === 0 || gender === 'F' ? 'Female' : 'Male'}
                          </Col>
                          <Col
                            xs={3}
                            className="text-muted-custom small d-flex align-items-center gap-2"
                          >
                            <Calendar size={16} /> {ageYears} Years Old
                          </Col>
                          <Col
                            xs={3}
                            className="text-muted-custom small d-flex align-items-center gap-2"
                          >
                            <DollarSign size={16} />{' '}
                            {income !== undefined && income !== null
                              ? `$${income.toLocaleString()}`
                              : 'N/A'}
                          </Col>
                          <Col xs={3} className="text-end">
                            <button
                              className="btn p-0 small border-0 bg-transparent text-decoration-none d-inline-flex align-items-center record-detail-btn"
                              onClick={() => {
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                                setResult(record);
                                setCurrentView('result');
                              }}
                            >
                              <span className="link-emerald">
                                Click for Details <ArrowRight size={16} />
                              </span>
                            </button>
                          </Col>
                        </Row>
                      </div>
                    );
                  })}

                  {/* --- NEW: Applicant Pagination UI --- */}
                  {totalHistoryPages > 1 && (
                    <div className="d-flex justify-content-center mt-5 mb-3 fade-in">
                      <div
                        className="d-flex align-items-center gap-1 p-1 rounded-pill shadow-sm"
                        style={{
                          background: '#ffffff',
                          border: '1px solid #e2e8f0',
                        }}
                      >
                        <button
                          className="btn d-flex align-items-center justify-content-center"
                          onClick={() => setHistoryPage(historyPage - 1)}
                          disabled={historyPage === 1}
                          style={{
                            borderRadius: '50rem',
                            padding: '6px 16px',
                            fontSize: '0.85rem',
                            fontWeight: '600',
                            color: historyPage === 1 ? '#94a3b8' : '#475569',
                            background: 'transparent',
                            border: 'none',
                            cursor:
                              historyPage === 1 ? 'not-allowed' : 'pointer',
                            transition: 'all 0.2s ease-in-out',
                          }}
                        >
                          Prev
                        </button>

                        {[...Array(totalHistoryPages)].map((_, i) => (
                          <button
                            key={i}
                            className="btn d-flex align-items-center justify-content-center p-0"
                            onClick={() => setHistoryPage(i + 1)}
                            style={{
                              borderRadius: '50%',
                              width: '32px',
                              height: '32px',
                              fontSize: '0.85rem',
                              fontWeight: '700',
                              color:
                                historyPage === i + 1 ? '#ffffff' : '#64748b',
                              backgroundColor:
                                historyPage === i + 1
                                  ? '#3d9a6e'
                                  : 'transparent',
                              border: 'none',
                              transition: 'all 0.2s ease-in-out',
                              boxShadow:
                                historyPage === i + 1
                                  ? '0 2px 8px rgba(61,154,110,0.35)'
                                  : 'none',
                            }}
                          >
                            {i + 1}
                          </button>
                        ))}

                        <button
                          className="btn d-flex align-items-center justify-content-center"
                          onClick={() => setHistoryPage(historyPage + 1)}
                          disabled={historyPage === totalHistoryPages}
                          style={{
                            borderRadius: '50rem',
                            padding: '6px 16px',
                            fontSize: '0.85rem',
                            fontWeight: '600',
                            color:
                              historyPage === totalHistoryPages
                                ? '#94a3b8'
                                : '#475569',
                            background: 'transparent',
                            border: 'none',
                            cursor:
                              historyPage === totalHistoryPages
                                ? 'not-allowed'
                                : 'pointer',
                            transition: 'all 0.2s ease-in-out',
                          }}
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </Container>
  );
}

export default App;
