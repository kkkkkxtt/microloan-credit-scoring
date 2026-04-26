import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Spinner, Form } from 'react-bootstrap';
import {
  Search,
  ArrowRight,
  Info,
  User,
  Calendar,
  DollarSign,
  ArrowLeft,
} from 'lucide-react';
import axios from 'axios';
import GaugeChart from 'react-gauge-chart';
import CreditForm from './components/CreditForm';
import XaiChart from './components/XaiChart';
import { predictLoan } from './services/api';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';

function App() {
  const [currentView, setCurrentView] = useState('home');
  const [homeTab, setHomeTab] = useState('apply');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [history, setHistory] = useState([]);
  const [resultView, setResultView] = useState('analysis');

  useEffect(() => {
    const fetchInitialHistory = async () => {
      if (homeTab === 'record') {
        // 1. Force the search bar to stay completely empty!
        setSearchQuery('');

        // 2. Optimistically load the 5 recent records from local storage
        const recentJson = localStorage.getItem('recent_records');
        if (recentJson) {
          try {
            const recent = JSON.parse(recentJson || '[]');
            setHistory(recent.slice(0, 5));
          } catch (err) {
            console.error('Failed to parse recent_records from localStorage');
          }
        }

        // 3. Background Check: Was the database completely reset?
        const savedIC = localStorage.getItem('last_ic');
        if (savedIC) {
          try {
            // Just ask the DB if our most recent application still exists
            const response = await axios.get(
              `http://127.0.0.1:8000/history/${savedIC}`,
            );

            // If the database returns an empty array, it means you dropped the tables!
            if (!response.data || response.data.length === 0) {
              console.warn(
                'Database reset detected. Clearing outdated local cache.',
              );
              localStorage.removeItem('recent_records');
              localStorage.removeItem('last_ic');
              setHistory([]);
            }
            // CRITICAL FIX: If the DB *does* have it, we do NOTHING.
            // We leave the 5 local records on the screen instead of overwriting them!
          } catch (err) {
            console.error('History fetch error');
          }
        }
      }
    };
    fetchInitialHistory();
  }, [homeTab]);

  const handleSearch = async (icToSearch = searchQuery) => {
    if (!icToSearch) return;
    try {
      const response = await axios.get(
        `http://127.0.0.1:8000/history/${icToSearch}`,
      );
      setHistory(response.data.slice(0, 5));
    } catch (err) {
      console.error('History fetch error');
    }
  };

  const handleFormSubmit = async (data) => {
    setCurrentView('result');
    setLoading(true);
    try {
      const response = await predictLoan(data);
      setResult(response);

      // 1. Save the last searched IC
      localStorage.setItem('last_ic', data.applicant_ic);

      // 2. Maintain the per-device recent records list (most recent first, up to 5)
      try {
        const existing = JSON.parse(
          localStorage.getItem('recent_records') || '[]',
        );

        const newRecord = {
          ...(response || {}),
          applicant_ic: data.applicant_ic,
          application_date:
            response.application_date || new Date().toISOString(),
          raw_features_log: data, // Ensure the raw data is saved locally for the Form Record tab
        };

        // Remove duplicates and keep the newest at the top
        const deduped = [
          newRecord,
          ...existing.filter(
            (r) => String(r.applicant_ic) !== String(newRecord.applicant_ic),
          ),
        ];

        localStorage.setItem(
          'recent_records',
          JSON.stringify(deduped.slice(0, 5)),
        );
      } catch (err) {
        console.error('Failed to update recent_records', err);
      }
    } catch (err) {
      alert('Analysis failed. Check backend connection.');
      setCurrentView('form');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="py-5" style={{ maxWidth: '1000px' }}>
      <style>{`.btn-animated{transition:transform .15s ease, box-shadow .15s ease;} .btn-animated:hover{transform:translateY(-3px) scale(1.02); box-shadow:0 8px 28px rgba(15,23,42,0.06);} .record-detail-btn{transition: color .12s ease, transform .12s ease;} .record-detail-btn:hover{transform:translateX(6px);}`}</style>
      {/* GLOBAL HEADER */}
      {currentView === 'home' && (
        <div className="d-flex justify-content-between align-items-start mb-5">
          <div>
            <h1
              className="fw-black text-slate m-0"
              style={{ fontSize: '2.5rem', fontWeight: '900' }}
            >
              Credify
            </h1>
            <p className="text-muted-custom m-0">
              A Microloan Credit Scoring Classification Platform
            </p>
          </div>
          <div className="toggle-bg">
            <div
              className={`toggle-btn ${homeTab === 'apply' ? 'active' : 'inactive'}`}
              onClick={() => setHomeTab('apply')}
            >
              Apply
            </div>
            <div
              className={`toggle-btn ${homeTab === 'record' ? 'active' : 'inactive'}`}
              onClick={() => setHomeTab('record')}
            >
              Record
            </div>
          </div>
        </div>
      )}

      {/* HOME PAGE */}
      {currentView === 'home' && (
        <div className="fade-in">
          {homeTab === 'apply' ? (
            <div className="py-4">
              <h2 className="fw-bold text-slate mb-3">What is Microloan?</h2>
              <p
                className="text-muted-custom mb-5"
                style={{ fontSize: '1.1rem', lineHeight: '1.7' }}
              >
                A microloan is a small, short-term loan typically provided to
                individuals or small businesses who lack access to traditional
                banking services. These loans are designed to help entrepreneurs
                start or grow businesses, manage emergencies, or bridge
                financial gaps.
              </p>

              <div className="text-center mb-5">
                <button
                  className="btn btn-dark-custom d-inline-flex align-items-center gap-2"
                  onClick={() => setCurrentView('form')}
                >
                  Click to Apply <ArrowRight size={20} />
                </button>
              </div>

              <div className="bg-emerald-light p-4 rounded-4 border border-success border-opacity-25">
                <h5 className="fw-bold text-slate d-flex align-items-center gap-2 mb-3">
                  <Info className="text-emerald" size={24} /> About Credify
                </h5>
                <p
                  className="text-muted-custom m-0"
                  style={{ lineHeight: '1.6' }}
                >
                  Credify uses advanced Machine Learning algorithms to assess
                  your creditworthiness in minutes. Our platform provides a
                  transparent, simple, and fast credit assessment test, giving
                  you not just a decision, but an explanation of why. We aim to
                  empower financial inclusion by making credit scoring
                  accessible and understandable for everyone.
                </p>
              </div>
            </div>
          ) : (
            <div>
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
                    onChange={(e) => setSearchQuery(e.target.value)}
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
              <h5 className="fw-bold text-slate mb-3">Past Records</h5>
              {history.map((record, index) => {
                const ic =
                  record.applicant_ic ||
                  record.raw_features_log?.applicant_ic ||
                  'Unknown';
                const gender =
                  record.CODE_GENDER ?? record.raw_features_log?.CODE_GENDER;
                const income =
                  record.AMT_INCOME_TOTAL ??
                  record.raw_features_log?.AMT_INCOME_TOTAL;

                // --- NEW AGE CALCULATION ---
                // We use DAYS_BIRTH because that represents the applicant's age
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
                          ID: {ic}
                        </span>
                        <span
                          className={`badge ${record.decision === 'Approve' ? 'bg-success' : 'bg-danger'} bg-opacity-10 ${record.decision === 'Approve' ? 'text-success' : 'text-danger'} p-2 px-3`}
                        >
                          {record.decision}
                        </span>
                      </div>
                      <span className="text-muted-custom small">
                        {record.application_date
                          ? new Date(record.application_date).toLocaleString()
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

                      {/* --- UPDATED COLUMN: SHOWS AGE INSTEAD OF DAYS --- */}
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
                          className="btn btn-link p-0 small text-emerald fw-bold d-inline-flex align-items-center record-detail-btn"
                          onClick={() => {
                            setResult(record);
                            setCurrentView('result');
                          }}
                        >
                          Click for Details <ArrowRight size={14} />
                        </button>
                      </Col>
                    </Row>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* FORM VIEW */}
      {currentView === 'form' && (
        <CreditForm
          onSubmit={handleFormSubmit}
          onCancel={() => setCurrentView('home')}
        />
      )}

      {/* RESULT DASHBOARD */}
      {currentView === 'result' && (
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
                {/* --- HEADER WITH SWAP BUTTON (Removed Download/Share) --- */}
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <button
                    className="btn btn-link text-muted-custom text-decoration-none p-0 d-flex align-items-center"
                    onClick={() => {
                      setCurrentView('home');
                      setResultView('analysis'); // Reset to analysis when leaving
                    }}
                    style={{ width: '150px' }} // Fixed width to keep center toggle perfectly centered
                  >
                    <ArrowLeft size={20} className="me-2" /> Back to Home
                  </button>
                  {/* SWAP BUTTON (Form Record Left, AI Analysis Right) */}
                  <div
                    className="p-1 rounded-pill d-inline-flex"
                    style={{
                      backgroundColor: '#f8fafc',
                      border: '1px solid #e2e8f0',
                    }}
                  >
                    {/* BUTTON 1: FORM RECORD (Now on the Left) */}
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

                    {/* BUTTON 2: AI ANALYSIS (Now on the Right) */}
                    <button
                      className="toggle-btn border-0"
                      style={{
                        backgroundColor:
                          resultView === 'analysis' ? '#e2e8f0' : 'transparent',
                        color:
                          resultView === 'analysis' ? '#475569' : '#94a3b8',
                        fontWeight: '600',
                        borderRadius: '50rem',
                        transition: 'all 0.2s ease-in-out',
                      }}
                      onClick={() => setResultView('analysis')}
                    >
                      AI Analysis
                    </button>
                  </div>
                  <div style={{ width: '150px' }}></div>{' '}
                  {/* Empty spacer for perfect centering */}
                </div>

                {/* --- CONTENT AREA --- */}
                {resultView === 'analysis' ? (
                  /* =========================================
                     TAB 1: AI ANALYSIS (Your existing dashboard)
                     ========================================= */
                  <div className="custom-card p-4 p-md-5 slide-down">
                    <Row className="align-items-center border-bottom pb-4 mb-4">
                      <Col md={5} className="text-center">
                        <GaugeChart
                          id="gauge-chart"
                          nrOfLevels={2}
                          colors={['#10b981', '#ef4444']}
                          arcWidth={0.15}
                          percent={result.decision === 'Approve' ? 0.25 : 0.85}
                          textColor="#0f172a"
                          hideText={true}
                          style={{ width: '80%', margin: '0 auto' }}
                        />
                        <h2
                          className={`fw-bold mt-2 ${result.decision === 'Approve' ? 'text-emerald' : 'text-danger'}`}
                        >
                          {result.decision}
                        </h2>
                        <p className="text-muted-custom fw-semibold">
                          Probability of Default :{' '}
                          {(result.risk_probability * 100).toFixed(1)}%{' '}
                          <br></br> Score:{' '}
                          {((1 - result.risk_probability) * 100).toFixed(1)}/100
                        </p>
                      </Col>
                      <Col md={7}>
                        <h3 className="fw-bold text-slate mb-3">
                          Final Decision
                        </h3>
                        <p className="text-muted-custom mb-4">
                          Based on our ML analysis of your financial profile,
                          your microloan application has been
                          <strong
                            className={
                              result.decision === 'Approve'
                                ? 'text-emerald'
                                : 'text-danger'
                            }
                          >
                            {' '}
                            {result.decision.toLowerCase()}
                          </strong>
                          .
                        </p>
                        <div className="bg-light p-4 rounded-4 border mt-3">
                          <p className="m-0 text-muted-custom fst-italic small">
                            "Summary: {result.dynamic_explanation}"
                          </p>
                        </div>
                      </Col>
                    </Row>

                    <Row className="mb-5">
                      <Col xs={12}>
                        <h4 className="fw-bold text-slate mb-3">
                          Actionable Insights
                        </h4>
                        <p className="text-muted-custom small mb-4">
                          Our Explainable AI analyzes the specific impact of
                          your data. Review the highest risk factors below.
                        </p>
                        <Row>
                          {result.recommendations &&
                            result.recommendations.map((rec, index) => (
                              <Col md={6} key={index}>
                                <div
                                  className={`p-3 rounded-3 mb-3 border-start border-4 shadow-sm h-100 ${rec.effect > 0 ? 'bg-danger bg-opacity-10 border-danger' : 'bg-success bg-opacity-10 border-success'}`}
                                >
                                  <strong className="d-block text-dark mb-1">
                                    {rec.feature_name}
                                  </strong>
                                  <p className="mb-2 small text-muted-custom">
                                    {rec.reason}
                                  </p>
                                  <div className="bg-white p-2 rounded border small">
                                    <span className="fw-bold text-slate">
                                      Action:{' '}
                                    </span>
                                    {rec.action}
                                  </div>
                                </div>
                              </Col>
                            ))}
                        </Row>
                      </Col>
                    </Row>

                    <Row className="mt-5 pt-3">
                      <Col xs={12}>
                        <h4 className="fw-bold text-slate mb-3">
                          AI Feature Importance
                        </h4>
                        <XaiChart data={result.shap_log} />
                      </Col>
                    </Row>
                  </div>
                ) : (
                  /* =========================================
                     TAB 2: FORM RECORD (Read-Only Form View)
                     ========================================= */
                  <div className="custom-card p-4 p-md-5 slide-down">
                    <div className="d-flex align-items-center mb-5 pb-3 border-bottom">
                      <h3 className="fw-bold text-slate m-0">
                        Submitted Application Data
                      </h3>
                      <span className="ms-auto badge bg-light text-dark border px-3 py-2">
                        ID: {result.applicant_ic}
                      </span>
                    </div>

                    {(() => {
                      const data = result.raw_features_log || {};

                      // Helper to safely format money
                      const formatMoney = (val) =>
                        val
                          ? new Intl.NumberFormat('en-US', {
                              style: 'currency',
                              currency: 'USD',
                            }).format(val)
                          : '-';

                      // Helper to calculate age from DAYS_BIRTH
                      const getAge = (days) =>
                        days
                          ? Math.floor(Math.abs(days) / 365.25) + ' years old'
                          : '-';

                      // Helper to safely render the Read-Only Field
                      const ReadOnlyField = ({ label, value }) => (
                        <Col md={4} sm={6} className="mb-4">
                          <div className="py-2 border-bottom border-light h-100">
                            <div className="text-muted-custom small fw-semibold mb-2">
                              {label}
                            </div>
                            <div className="fw-bold text-slate fs-6">
                              {value !== null &&
                              value !== '' &&
                              value !== undefined
                                ? value
                                : '-'}
                            </div>
                          </div>
                        </Col>
                      );

                      // NEW: Helper to render matching Section Headers
                      const SectionHeader = ({ number, title }) => (
                        <div className="d-flex align-items-center mb-4 mt-5">
                          <div
                            className="step-circle me-3"
                            style={{
                              width: '35px',
                              height: '35px',
                              fontSize: '1rem',
                              minWidth: '35px',
                            }}
                          >
                            {number}
                          </div>
                          <h4 className="fw-bold text-slate m-0 fs-5">
                            {title}
                          </h4>
                        </div>
                      );

                      // Helper to figure out contact methods
                      const getContacts = () => {
                        const contacts = [];
                        if (String(data.FLAG_EMAIL) === '1')
                          contacts.push('Email');
                        if (String(data.FLAG_MOBIL) === '1')
                          contacts.push('Mobile');
                        if (String(data.FLAG_EMP_PHONE) === '1')
                          contacts.push('Employer');
                        if (String(data.FLAG_WORK_PHONE) === '1')
                          contacts.push('Work');
                        if (String(data.FLAG_PHONE) === '1')
                          contacts.push('Home');
                        return contacts.length > 0
                          ? contacts.join(', ')
                          : 'None Provided';
                      };

                      // --- Helper to format Geographic Declarations for Applicants ---
                      const getGeoDeclarations = () => {
                        const diffs = [];
                        // Using "different" or descriptive phrases for better UX
                        if (String(data.REG_CITY_NOT_LIVE_CITY) === '1')
                          diffs.push('Permanent & Contact City are different');
                        if (String(data.REG_CITY_NOT_WORK_CITY) === '1')
                          diffs.push('Permanent & Work City are different');
                        if (String(data.REG_REGION_NOT_LIVE_REGION) === '1')
                          diffs.push(
                            'Permanent & Contact Region are different',
                          );
                        if (String(data.REG_REGION_NOT_WORK_REGION) === '1')
                          diffs.push('Permanent & Work Region are different');
                        if (String(data.LIVE_CITY_NOT_WORK_CITY) === '1')
                          diffs.push('Contact & Work City are different');
                        if (String(data.LIVE_REGION_NOT_WORK_REGION) === '1')
                          diffs.push('Contact & Work Region are different');

                        if (diffs.length === 0) {
                          return (
                            <span className="text-emerald fw-medium">
                              All addresses match
                            </span>
                          );
                        }

                        return (
                          <div className="d-flex flex-column gap-1 pt-1">
                            {diffs.map((diff, i) => (
                              <span
                                key={i}
                                className="badge bg-light text-dark border fw-medium text-start text-wrap lh-base py-1 px-2"
                                style={{ fontSize: '0.8rem' }}
                              >
                                • {diff}
                              </span>
                            ))}
                          </div>
                        );
                      };

                      return (
                        <div className="read-only-form">
                          {/* --- PART 1 --- */}
                          <div style={{ marginTop: '-1.5rem' }}>
                            <SectionHeader
                              number="1"
                              title="Personal Demographics"
                            />
                          </div>
                          <Row className="mb-2 g-3">
                            <ReadOnlyField
                              label="What is your gender?"
                              value={
                                data.CODE_GENDER === 1 ||
                                data.CODE_GENDER === 'M'
                                  ? 'Male'
                                  : data.CODE_GENDER === 0 ||
                                      data.CODE_GENDER === 'F'
                                    ? 'Female'
                                    : 'Unknown'
                              }
                            />
                            <ReadOnlyField
                              label="Calculated Age"
                              value={getAge(data.DAYS_BIRTH)}
                            />
                            <ReadOnlyField
                              label="Current marital status?"
                              value={data.NAME_FAMILY_STATUS}
                            />
                            <ReadOnlyField
                              label="Highest level of education?"
                              value={data.NAME_EDUCATION_TYPE}
                            />
                            <ReadOnlyField
                              label="Total children do you have?"
                              value={data.CNT_CHILDREN}
                            />
                            <ReadOnlyField
                              label="Total members in household?"
                              value={data.CNT_FAM_MEMBERS}
                            />
                          </Row>

                          {/* --- PART 2 --- */}
                          <SectionHeader number="2" title="Contact & Assets" />
                          <Row className="mb-2 g-3">
                            <ReadOnlyField
                              label="Do you own a car?"
                              value={data.FLAG_OWN_CAR === 'Y' ? 'Yes' : 'No'}
                            />
                            <ReadOnlyField
                              label="Car age (years)?"
                              value={data.OWN_CAR_AGE || '0'}
                            />
                            <ReadOnlyField
                              label="Do you own real estate?"
                              value={
                                data.FLAG_OWN_REALTY === 'Y' ? 'Yes' : 'No'
                              }
                            />
                            <ReadOnlyField
                              label="Months since phone change?"
                              value={
                                data.DAYS_LAST_PHONE_CHANGE
                                  ? Math.abs(data.DAYS_LAST_PHONE_CHANGE)
                                  : '0'
                              }
                            />
                            <ReadOnlyField
                              label="Provided Contact Methods"
                              value={getContacts()}
                            />
                          </Row>

                          {/* --- PART 3 --- */}
                          <SectionHeader
                            number="3"
                            title="Housing & Geography"
                          />
                          <Row className="mb-2 g-3">
                            <ReadOnlyField
                              label="Living situation?"
                              value={data.NAME_HOUSING_TYPE}
                            />
                            <ReadOnlyField
                              label="Building type?"
                              value={data.HOUSETYPE_MODE}
                            />
                            <ReadOnlyField
                              label="Building wall material?"
                              value={
                                Array.isArray(data.WALLSMATERIAL_MODE)
                                  ? data.WALLSMATERIAL_MODE.join(', ')
                                  : data.WALLSMATERIAL_MODE
                              }
                            />
                            <ReadOnlyField
                              label="Maintenance fund structure?"
                              value={data.FONDKAPREMONT_MODE}
                            />
                            <ReadOnlyField
                              label="Emergency state?"
                              value={data.EMERGENCYSTATE_MODE}
                            />

                            <ReadOnlyField
                              label="Address Check Results"
                              value={getGeoDeclarations()}
                            />
                          </Row>

                          {/* --- PART 4 --- */}
                          <SectionHeader
                            number="4"
                            title="Employment & Income"
                          />
                          <Row className="mb-2 g-3">
                            <ReadOnlyField
                              label="Primary source of income?"
                              value={data.NAME_INCOME_TYPE}
                            />
                            <ReadOnlyField
                              label="Total annual income?"
                              value={formatMoney(data.AMT_INCOME_TOTAL)}
                            />
                            <ReadOnlyField
                              label="Years at current job?"
                              value={
                                data.DAYS_EMPLOYED === 365243
                                  ? 'N/A (Pensioner/Unemployed)'
                                  : getAge(data.DAYS_EMPLOYED).replace(
                                      ' old',
                                      '',
                                    )
                              }
                            />
                            <ReadOnlyField
                              label="Job Title / Occupation (Search)?"
                              value={data.OCCUPATION_TYPE || 'Not Specified'}
                            />
                            <ReadOnlyField
                              label="Industry / Organization Type (Search)?"
                              value={data.ORGANIZATION_TYPE}
                            />
                          </Row>

                          {/* --- PART 5 --- */}
                          <SectionHeader number="5" title="Loan Details" />
                          <Row className="mb-2 g-3">
                            <ReadOnlyField
                              label="Loan Type?"
                              value={data.NAME_CONTRACT_TYPE}
                            />
                            <ReadOnlyField
                              label="Requested borrow amount?"
                              value={formatMoney(data.AMT_CREDIT)}
                            />
                            <ReadOnlyField
                              label="Preferred yearly repayment?"
                              value={formatMoney(data.AMT_ANNUITY)}
                            />
                            <ReadOnlyField
                              label="Specific item price?"
                              value={formatMoney(data.AMT_GOODS_PRICE)}
                            />
                          </Row>

                          {/* --- PART 6 --- */}
                          <SectionHeader
                            number="6"
                            title="Final Declarations (Social Risk)"
                          />
                          <Row className="mb-2 g-3">
                            <ReadOnlyField
                              label="Social circle past due (30 days)?"
                              value={data.OBS_30_CNT_SOCIAL_CIRCLE}
                            />
                            <ReadOnlyField
                              label="Social circle defaulted (30 days)?"
                              value={data.DEF_30_CNT_SOCIAL_CIRCLE}
                            />
                            <ReadOnlyField
                              label="Social circle defaulted (60 days)?"
                              value={data.DEF_60_CNT_SOCIAL_CIRCLE}
                            />
                          </Row>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            )
          )}
        </div>
      )}
    </Container>
  );
}

export default App;
