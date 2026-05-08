import React, { useState, useEffect, useRef, useContext } from 'react';
import { Form, Row, Col, Modal, Alert } from 'react-bootstrap';
import {
  ChevronRight,
  ChevronLeft,
  AlertTriangle,
  Fingerprint,
  ShieldCheck,
} from 'lucide-react';
import { getLatestId } from '../services/api';
import { AuthContext } from '../context/AuthContext';

const CreditForm = ({ onSubmit, onCancel }) => {
  const { user } = useContext(AuthContext);
  const [step, setStep] = useState(1);
  const [showDiscard, setShowDiscard] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState({});
  const [toastMsg, setToastMsg] = useState('');

  const sectionRefs = useRef([]);

  const [formData, setFormData] = useState({
    applicant_ic: '',
    // Auto-filled from profile when available
    CODE_GENDER: user?.profile?.gender || '',
    birth_date: user?.profile?.date_of_birth || '',
    NAME_EDUCATION_TYPE: 'Secondary / secondary special',
    NAME_FAMILY_STATUS: 'Married',
    CNT_CHILDREN: 0,
    CNT_FAM_MEMBERS: 1,

    FLAG_EMAIL: user?.email ? '1' : '0',
    FLAG_MOBIL: user?.profile?.phone_number ? '1' : '0',
    FLAG_EMP_PHONE: '0',
    FLAG_WORK_PHONE: '0',
    FLAG_PHONE: '0',
    FLAG_CONT_MOBILE: user?.profile?.phone_number ? '1' : '0',
    DAYS_LAST_PHONE_CHANGE: 0,
    FLAG_OWN_CAR: 'N',
    OWN_CAR_AGE: 0,
    FLAG_OWN_REALTY: 'Y',

    NAME_HOUSING_TYPE: 'House / apartment',
    HOUSETYPE_MODE: 'block of flats',
    WALLSMATERIAL_MODE: [],
    FONDKAPREMONT_MODE: 'reg oper account',
    EMERGENCYSTATE_MODE: 'No',
    REG_CITY_NOT_LIVE_CITY: '0',
    REG_CITY_NOT_WORK_CITY: '0',
    REG_REGION_NOT_LIVE_REGION: '0',
    REG_REGION_NOT_WORK_REGION: '0',
    LIVE_CITY_NOT_WORK_CITY: '0',
    LIVE_REGION_NOT_WORK_REGION: '0',

    NAME_INCOME_TYPE: 'Working',
    AMT_INCOME_TOTAL: user?.profile?.annual_income || '',
    OCCUPATION_TYPE: 'Laborers',
    ORGANIZATION_TYPE: 'Business Entity Type 3',
    employed_date: '',

    NAME_CONTRACT_TYPE: 'Cash loans',
    AMT_CREDIT: '',
    AMT_ANNUITY: '',
    AMT_GOODS_PRICE: '',

    OBS_30_CNT_SOCIAL_CIRCLE: 0,
    DEF_30_CNT_SOCIAL_CIRCLE: 0,
    DEF_60_CNT_SOCIAL_CIRCLE: 0,
  });

  // Friendly labels for ambiguous organization / industry codes
  const ORG_FRIENDLY_MAP = {
    'Business Entity Type 1': 'Small Business',
    'Business Entity Type 2': 'Large Corporate',
    'Business Entity Type 3': 'Public Enterprise',
    'Industry: type 1': 'Manufacturing',
    'Industry: type 2': 'Mining',
    'Industry: type 3': 'Pharmaceutical',
    'Industry: type 4': 'Electronics',
    'Industry: type 5': 'Food Processing',
    'Industry: type 6': 'Textiles',
    'Industry: type 7': 'Metals',
    'Industry: type 8': 'Chemicals',
    'Industry: type 9': 'Plastics',
    'Industry: type 10': 'Automotive',
    'Industry: type 11': 'Aerospace',
    'Industry: type 12': 'Biotech',
    'Industry: type 13': 'Energy',
    'Trade: type 1': 'Retail',
    'Trade: type 2': 'Wholesale',
    'Trade: type 3': 'E-commerce',
    'Trade: type 4': 'Import/Export',
    'Trade: type 5': 'Franchise',
    'Trade: type 6': 'Outlet',
    'Trade: type 7': 'Market Stall',
    'Transport: type 1': 'Road Transport',
    'Transport: type 2': 'Rail Transport',
    'Transport: type 3': 'Sea Transport',
    'Transport: type 4': 'Air Transport',
  };

  // --- FETCH THE ID ON MOUNT ---
  useEffect(() => {
    const fetchId = async () => {
      try {
        const response = await getLatestId();

        let actualId = '100001'; // Default safe value

        // BULLETPROOF ID EXTRACTION
        if (typeof response === 'object' && response !== null) {
          // Handle nested Axios { data: ... } wrappers
          const innerData =
            response.data !== undefined ? response.data : response;

          if (typeof innerData === 'object' && innerData !== null) {
            // If it's a dictionary like {"whatever_key_name": 100029}, just grab the first value!
            actualId = Object.values(innerData)[0];
          } else {
            actualId = innerData;
          }
        } else {
          // If the backend just returns a raw number
          actualId = response;
        }

        setFormData((prev) => ({ ...prev, applicant_ic: String(actualId) }));
      } catch (error) {
        console.error('Failed to fetch new ID', error);
        setFormData((prev) => ({ ...prev, applicant_ic: '100001' }));
      }
    };
    fetchId();
  }, []);
  // --- 1. RESTORED MISSING HELPER FUNCTIONS ---
  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear the error as soon as the user starts typing
    if (errors[field]) {
      setErrors((prev) => {
        const newErr = { ...prev };
        delete newErr[field];
        return newErr;
      });
    }
  };

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 4000);
  };

  // --- 2. FIXED VALIDATION FUNCTION (Removed broken duplicates) ---
  const validateStep = (currentStep) => {
    const newErrors = {};
    let isAutoRejected = false;

    const parseNumber = (val) => {
      const n = Number(val);
      return Number.isFinite(n) ? n : NaN;
    };

    const now = new Date();

    const parseDateSafe = (d) => {
      if (!d) return null;
      const dt = new Date(d);
      return Number.isNaN(dt.getTime()) ? null : dt;
    };

    // Step 1: Basic personal checks
    if (currentStep === 1) {
      if (!formData.CODE_GENDER)
        newErrors.CODE_GENDER = 'Please select gender.';

      const bDate = parseDateSafe(formData.birth_date);
      if (!bDate)
        newErrors.birth_date =
          'Please provide a valid Date of Birth (YYYY-MM-DD).';
      else if (bDate > now)
        newErrors.birth_date = 'Date of Birth cannot be in the future.';
      else {
        const ageYears = (now - bDate) / (1000 * 60 * 60 * 24 * 365.25);
        if (ageYears < 18) {
          newErrors.birth_date =
            'AUTO-REJECT: Applicant is a minor (Under 18).';
          isAutoRejected = true;
        }
      }

      const children = parseNumber(formData.CNT_CHILDREN);
      if (Number.isNaN(children) || children < 0)
        newErrors.CNT_CHILDREN = 'Children must be 0 or greater.';
      const members = parseNumber(formData.CNT_FAM_MEMBERS);
      if (Number.isNaN(members) || members < 1)
        newErrors.CNT_FAM_MEMBERS = 'Household members must be 1 or greater.';
    }

    // NEW: Step 3: Housing & Geography
    if (currentStep === 3) {
      if (
        !formData.WALLSMATERIAL_MODE ||
        formData.WALLSMATERIAL_MODE.length === 0
      ) {
        newErrors.WALLSMATERIAL_MODE =
          'Please select at least one building wall material.';
      }
    }

    // Step 4: Employment & Income
    if (currentStep === 4) {
      // Check for blank first
      if (
        !formData.AMT_INCOME_TOTAL ||
        formData.AMT_INCOME_TOTAL.toString().trim() === ''
      ) {
        newErrors.AMT_INCOME_TOTAL = 'Please enter your total annual income.';
      } else {
        const income = parseNumber(formData.AMT_INCOME_TOTAL);
        if (Number.isNaN(income) || income < 0)
          newErrors.AMT_INCOME_TOTAL = 'Please enter a valid annual income.';
      }

      if (
        ['Working', 'Commercial associate', 'State servant'].includes(
          formData.NAME_INCOME_TYPE,
        )
      ) {
        const empDate = parseDateSafe(formData.employed_date);
        if (!empDate)
          newErrors.employed_date =
            'Please provide a valid employment start date (YYYY-MM-DD).';
        else if (empDate > now)
          newErrors.employed_date =
            'Employment start date cannot be in the future.';
        else {
          const bDate = parseDateSafe(formData.birth_date);
          if (bDate) {
            const minStart = new Date(bDate);
            minStart.setFullYear(minStart.getFullYear() + 14);
            if (empDate < minStart) {
              newErrors.employed_date =
                'Employment start date is inconsistent with Date of Birth.';
            }
          }
        }
      }
    }

    // Step 5: Loan details
    if (currentStep === 5) {
      // Check Credit blank
      if (
        !formData.AMT_CREDIT ||
        formData.AMT_CREDIT.toString().trim() === ''
      ) {
        newErrors.AMT_CREDIT = 'Please enter the requested borrow amount.';
      } else {
        const credit = parseNumber(formData.AMT_CREDIT);
        if (Number.isNaN(credit) || credit <= 0)
          newErrors.AMT_CREDIT =
            'Please enter a valid requested credit amount.';
      }

      // Check Annuity blank
      if (
        !formData.AMT_ANNUITY ||
        formData.AMT_ANNUITY.toString().trim() === ''
      ) {
        newErrors.AMT_ANNUITY =
          'Please enter your preferred yearly repayment amount.';
      } else {
        const annuity = parseNumber(formData.AMT_ANNUITY);
        if (Number.isNaN(annuity) || annuity <= 0)
          newErrors.AMT_ANNUITY =
            'Please enter a valid yearly repayment amount.';
      }
    }

    // Step 6: Final guardrails (also used before submit)
    if (currentStep === 6) {
      const income = parseNumber(formData.AMT_INCOME_TOTAL) || 0;
      const credit = parseNumber(formData.AMT_CREDIT) || 0;

      const bDate = parseDateSafe(formData.birth_date);
      if (!bDate) {
        newErrors.birth_date = 'Please provide a valid Date of Birth.';
      } else {
        const ageYears = (now - bDate) / (1000 * 60 * 60 * 24 * 365.25);
        if (ageYears < 18) {
          newErrors.birth_date =
            'AUTO-REJECT: Applicant is a minor (Under 18).';
          isAutoRejected = true;
        }

        if (formData.employed_date) {
          const empDate = parseDateSafe(formData.employed_date);
          if (!empDate) {
            newErrors.employed_date =
              'Please provide a valid employment start date.';
          } else {
            const minStart = new Date(bDate);
            minStart.setFullYear(minStart.getFullYear() + 14);
            if (empDate < minStart) {
              newErrors.employed_date =
                'Employment start date is inconsistent with Date of Birth.';
            }
            if (empDate > now) {
              newErrors.employed_date =
                'Employment start date cannot be in the future.';
            }

            const yearsEmployed =
              (now - empDate) / (1000 * 60 * 60 * 24 * 365.25);
            if (yearsEmployed > ageYears) {
              newErrors.employed_date =
                'Employment start date indicates worked longer than applicant age.';
            }
          }
        }
      }

      if (income < 1000) {
        newErrors.AMT_INCOME_TOTAL =
          'AUTO-REJECT: Verifiable income is below minimum threshold.';
        isAutoRejected = true;
      }
      if (credit > income * 20) {
        newErrors.AMT_CREDIT =
          'AUTO-REJECT: Requested credit wildly exceeds acceptable debt-to-income limits.';
        isAutoRejected = true;
      }
    }

    setErrors((prev) => ({ ...prev, ...newErrors }));
    const isValid = Object.keys(newErrors).length === 0 && !isAutoRejected;
    return { isValid, isAutoRejected };
  };

  const handleNext = () => {
    const { isValid, isAutoRejected } = validateStep(step);
    if (!isValid) {
      if (isAutoRejected) {
        showToast('Application auto-rejected due to invalid core parameters.');
      } else {
        showToast('Please fix the highlighted errors before continuing.');
      }
      return;
    }
    if (step < 6) setStep(step + 1);
    else setShowConfirm(true);
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const executeSubmit = () => {
    setShowConfirm(false);

    // Final validation and mapping before submit
    const { isValid, isAutoRejected } = validateStep(6);
    if (!isValid) {
      if (isAutoRejected) {
        showToast('Application auto-rejected due to core business rules.');
      } else {
        showToast('Please fix the highlighted errors before submitting.');
      }
      return;
    }

    const birthDate = new Date(formData.birth_date);
    const DAYS_BIRTH = -Math.ceil(
      (new Date() - birthDate) / (1000 * 60 * 60 * 24),
    );

    let DAYS_EMPLOYED = 365243;
    if (formData.employed_date) {
      const empDate = new Date(formData.employed_date);
      DAYS_EMPLOYED = -Math.ceil(
        (new Date() - empDate) / (1000 * 60 * 60 * 24),
      );
    }

    const payload = {
      ...formData,
      CODE_GENDER: formData.CODE_GENDER === 'M' ? 1 : 0,
      DAYS_BIRTH,
      DAYS_EMPLOYED,
      AMT_INCOME_TOTAL: parseFloat(formData.AMT_INCOME_TOTAL),
      AMT_CREDIT: parseFloat(formData.AMT_CREDIT),
      AMT_ANNUITY: parseFloat(formData.AMT_ANNUITY),
      AMT_GOODS_PRICE:
        parseFloat(formData.AMT_GOODS_PRICE) || parseFloat(formData.AMT_CREDIT),
      CNT_CHILDREN: parseInt(formData.CNT_CHILDREN),
      CNT_FAM_MEMBERS: parseInt(formData.CNT_FAM_MEMBERS),
      DAYS_LAST_PHONE_CHANGE: -Math.abs(
        parseInt(formData.DAYS_LAST_PHONE_CHANGE),
      ),
      OWN_CAR_AGE:
        formData.FLAG_OWN_CAR === 'Y' ? parseInt(formData.OWN_CAR_AGE) : 0,
      FLAG_EMAIL: parseInt(formData.FLAG_EMAIL),
      FLAG_MOBIL: parseInt(formData.FLAG_MOBIL),
      FLAG_EMP_PHONE: parseInt(formData.FLAG_EMP_PHONE),
      FLAG_WORK_PHONE: parseInt(formData.FLAG_WORK_PHONE),
      FLAG_PHONE: parseInt(formData.FLAG_PHONE),
      FLAG_CONT_MOBILE: parseInt(formData.FLAG_CONT_MOBILE),
      REG_CITY_NOT_LIVE_CITY: parseInt(formData.REG_CITY_NOT_LIVE_CITY),
      REG_CITY_NOT_WORK_CITY: parseInt(formData.REG_CITY_NOT_WORK_CITY),
      REG_REGION_NOT_LIVE_REGION: parseInt(formData.REG_REGION_NOT_LIVE_REGION),
      REG_REGION_NOT_WORK_REGION: parseInt(formData.REG_REGION_NOT_WORK_REGION),
      LIVE_CITY_NOT_WORK_CITY: parseInt(formData.LIVE_CITY_NOT_WORK_CITY),
      LIVE_REGION_NOT_WORK_REGION: parseInt(
        formData.LIVE_REGION_NOT_WORK_REGION,
      ),
      OBS_30_CNT_SOCIAL_CIRCLE: parseInt(formData.OBS_30_CNT_SOCIAL_CIRCLE),
      DEF_30_CNT_SOCIAL_CIRCLE: parseInt(formData.DEF_30_CNT_SOCIAL_CIRCLE),
      DEF_60_CNT_SOCIAL_CIRCLE: parseInt(formData.DEF_60_CNT_SOCIAL_CIRCLE),
    };

    // Parse friendly organization label back to original code if needed
    if (
      payload.ORGANIZATION_TYPE &&
      typeof payload.ORGANIZATION_TYPE === 'string'
    ) {
      const orgVal = payload.ORGANIZATION_TYPE;
      const m = orgVal.match(/\(([^)]+)\)\s*$/);
      if (m && m[1]) payload.ORGANIZATION_TYPE = m[1];
      else {
        // If user typed a friendly label exactly, check reverse map
        const reverseKey = Object.keys(ORG_FRIENDLY_MAP).find(
          (k) => ORG_FRIENDLY_MAP[k].toLowerCase() === orgVal.toLowerCase(),
        );
        if (reverseKey) payload.ORGANIZATION_TYPE = reverseKey;
      }
    }

    delete payload.birth_date;
    delete payload.employed_date;

    onSubmit(payload);
  };

  useEffect(() => {
    if (sectionRefs.current[step - 1]) {
      setTimeout(() => {
        sectionRefs.current[step - 1].scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }, 100);
    }
  }, [step]);

  return (
    <div className="fade-in pb-5 position-relative">
      {/* ================= CUSTOM TOAST PANEL ================= */}
      {toastMsg && (
        <div
          style={{
            position: 'fixed',
            top: '30px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: '#fff',
            color: '#ef4444',
            border: '1.5px solid rgba(239,68,68,0.3)',
            padding: '14px 28px',
            borderRadius: '14px',
            zIndex: 9999,
            fontWeight: '600',
            boxShadow: '0 12px 32px rgba(239,68,68,0.15)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '0.95rem',
            fontFamily: 'DM Sans, sans-serif',
          }}
        >
          <AlertTriangle size={18} />
          {toastMsg}
        </div>
      )}

      {/* Form Header */}
      <div className="app-header mb-4">
        <div className="brand-logo">
          <div className="brand-logo-mark">C</div>
          <div>
            <p className="brand-name">Credit Application</p>
            <p className="brand-tagline">
              Fill in all sections to receive your decision
            </p>
          </div>
        </div>
        <button
          className="btn fw-semibold"
          style={{
            color: '#ef4444',
            background: 'rgba(239,68,68,0.07)',
            border: '1px solid rgba(239,68,68,0.18)',
            borderRadius: '10px',
            padding: '8px 18px',
            fontSize: '0.88rem',
          }}
          onClick={() => setShowDiscard(true)}
        >
          Cancel Application
        </button>
      </div>

      {/* Application ID Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #f0faf6 0%, #e8f5ef 100%)',
          border: '1px solid var(--color-accent-mid)',
          borderRadius: 'var(--radius-md)',
          padding: '1rem 1.5rem',
        }}
        className="mb-4 d-flex align-items-center gap-3"
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: 'var(--color-accent-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-accent)',
            flexShrink: 0,
          }}
        >
          <Fingerprint size={20} />
        </div>
        <div>
          <span
            style={{
              color: 'var(--color-accent)',
              fontSize: '0.75rem',
              fontWeight: 700,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              display: 'block',
            }}
          >
            Your Application ID
          </span>
          <span
            className="fw-bold text-slate fs-5"
            style={{ fontFamily: 'monospace', letterSpacing: '0.05em' }}
          >
            AP{formData.applicant_ic} {/* <-- Added AP prefix here */}
          </span>
        </div>
        <div
          className="ms-auto text-muted-custom small text-end"
          style={{ fontSize: '0.82rem' }}
        >
          💡 Save this ID to look up your record later.
        </div>
      </div>

      <div className="custom-card p-4 p-md-5 mb-4">
        {/* ================= PART 1: DEMOGRAPHICS ================= */}
        {step >= 1 && (
          <div
            className="form-section slide-down"
            ref={(el) => (sectionRefs.current[0] = el)}
          >
            <div className="d-flex align-items-center mb-4">
              <div className="step-circle">1</div>
              <h4 className="fw-bold text-slate m-0">Personal Demographics</h4>
            </div>
            {errors.birth_date && errors.birth_date.includes('AUTO-REJECT') && (
              <Alert variant="danger">
                <AlertTriangle size={18} className="me-2" />
                {errors.birth_date}
              </Alert>
            )}
            <Row>
              <Col md={12}>
                <Form.Group className="mb-4">
                  <Form.Label className="text-muted-custom small fw-semibold d-block">
                    What is your gender?
                  </Form.Label>
                  <div className="d-flex gap-3">
                    <button
                      type="button"
                      className={`gender-btn ${formData.CODE_GENDER === 'M' ? 'active' : ''}`}
                      onClick={() => handleChange('CODE_GENDER', 'M')}
                    >
                      Male
                    </button>
                    <button
                      type="button"
                      className={`gender-btn ${formData.CODE_GENDER === 'F' ? 'active' : ''}`}
                      onClick={() => handleChange('CODE_GENDER', 'F')}
                    >
                      Female
                    </button>
                  </div>
                  {errors.CODE_GENDER && (
                    <div className="text-danger small mt-2 pt-1">
                      {errors.CODE_GENDER}
                    </div>
                  )}
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-4">
                  <Form.Label className="text-muted-custom small fw-semibold">
                    What is your Date of Birth?
                  </Form.Label>
                  <Form.Control
                    className={`custom-input ${errors.birth_date ? 'is-invalid' : ''}`}
                    type="date"
                    value={formData.birth_date}
                    onChange={(e) => handleChange('birth_date', e.target.value)}
                  />
                  {errors.birth_date && !errors.birth_date.includes('AUTO') && (
                    <div className="text-danger small mt-3 pt-1 d-flex align-items-center">
                      <AlertTriangle size={14} className="me-2" />
                      {errors.birth_date}
                    </div>
                  )}
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-4">
                  <Form.Label className="text-muted-custom small fw-semibold">
                    What is your current marital status?
                  </Form.Label>
                  <Form.Select
                    className="custom-input"
                    value={formData.NAME_FAMILY_STATUS}
                    onChange={(e) =>
                      handleChange('NAME_FAMILY_STATUS', e.target.value)
                    }
                  >
                    <option value="Married">Married</option>
                    <option value="Single / not married">Single</option>
                    <option value="Civil marriage">Civil Marriage</option>
                    <option value="Separated">Separated</option>
                    <option value="Widow">Widow</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-4">
                  <Form.Label className="text-muted-custom small fw-semibold">
                    What is your highest level of education?
                  </Form.Label>
                  <Form.Select
                    className="custom-input"
                    value={formData.NAME_EDUCATION_TYPE}
                    onChange={(e) =>
                      handleChange('NAME_EDUCATION_TYPE', e.target.value)
                    }
                  >
                    <option value="Secondary / secondary special">
                      Secondary / High School
                    </option>
                    <option value="Higher education">
                      Higher Education / Degree
                    </option>
                    <option value="Incomplete higher">Incomplete Higher</option>
                    <option value="Lower secondary">Lower Secondary</option>
                    <option value="Academic degree">Academic Degree</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-4">
                  <Form.Label className="text-muted-custom small fw-semibold">
                    Total children do you have?
                  </Form.Label>
                  <Form.Control
                    className={`custom-input ${errors.CNT_CHILDREN ? 'is-invalid' : ''}`}
                    type="number"
                    min="0"
                    value={formData.CNT_CHILDREN}
                    onChange={(e) =>
                      handleChange('CNT_CHILDREN', e.target.value)
                    }
                  />
                  {errors.CNT_CHILDREN && (
                    <div className="text-danger small mt-2 pt-1">
                      {errors.CNT_CHILDREN}
                    </div>
                  )}
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-4">
                  <Form.Label className="text-muted-custom small fw-semibold">
                    Total members in household?
                  </Form.Label>
                  <Form.Control
                    className={`custom-input ${errors.CNT_FAM_MEMBERS ? 'is-invalid' : ''}`}
                    type="number"
                    min="1"
                    value={formData.CNT_FAM_MEMBERS}
                    onChange={(e) =>
                      handleChange('CNT_FAM_MEMBERS', e.target.value)
                    }
                  />
                  {errors.CNT_FAM_MEMBERS && (
                    <div className="text-danger small mt-2 pt-1">
                      {errors.CNT_FAM_MEMBERS}
                    </div>
                  )}
                </Form.Group>
              </Col>
            </Row>
          </div>
        )}

        {/* ================= PART 2: CONTACT & ASSETS ================= */}
        {step >= 2 && (
          <div
            className="form-section slide-down mt-5"
            ref={(el) => (sectionRefs.current[1] = el)}
          >
            <div className="d-flex align-items-center mb-4">
              <div className="step-circle">2</div>
              <h4 className="fw-bold text-slate m-0">Contact & Assets</h4>
            </div>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-4">
                  <Form.Label className="text-muted-custom small fw-semibold">
                    Do you own a car?
                  </Form.Label>
                  <Form.Select
                    className="custom-input"
                    value={formData.FLAG_OWN_CAR}
                    onChange={(e) =>
                      handleChange('FLAG_OWN_CAR', e.target.value)
                    }
                  >
                    <option value="Y">Yes</option>
                    <option value="N">No</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-4">
                  <Form.Label className="text-muted-custom small fw-semibold">
                    If yes, how old is your car in years?
                  </Form.Label>
                  <Form.Control
                    className="custom-input"
                    type="number"
                    min="0"
                    disabled={formData.FLAG_OWN_CAR === 'N'}
                    value={formData.OWN_CAR_AGE}
                    onChange={(e) =>
                      handleChange('OWN_CAR_AGE', e.target.value)
                    }
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-4">
                  <Form.Label className="text-muted-custom small fw-semibold">
                    Do you own real estate or property?
                  </Form.Label>
                  <Form.Select
                    className="custom-input"
                    value={formData.FLAG_OWN_REALTY}
                    onChange={(e) =>
                      handleChange('FLAG_OWN_REALTY', e.target.value)
                    }
                  >
                    <option value="Y">Yes</option>
                    <option value="N">No</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-4">
                  <Form.Label className="text-muted-custom small fw-semibold">
                    How many months ago did you last change your phone number?
                  </Form.Label>
                  <Form.Control
                    className="custom-input"
                    type="number"
                    min="0"
                    value={formData.DAYS_LAST_PHONE_CHANGE}
                    onChange={(e) =>
                      handleChange('DAYS_LAST_PHONE_CHANGE', e.target.value)
                    }
                  />
                </Form.Group>
              </Col>
              <Col md={12}>
                <Form.Label className="text-muted-custom small fw-semibold">
                  Which of the following contact details can you provide? (Check
                  all that apply)
                </Form.Label>
                <div className="d-flex flex-wrap gap-4 mb-4">
                  <Form.Check
                    type="checkbox"
                    label="Email Address"
                    checked={formData.FLAG_EMAIL === '1'}
                    onChange={(e) =>
                      handleChange('FLAG_EMAIL', e.target.checked ? '1' : '0')
                    }
                  />
                  <Form.Check
                    type="checkbox"
                    label="Mobile Phone"
                    checked={formData.FLAG_MOBIL === '1'}
                    onChange={(e) =>
                      handleChange('FLAG_MOBIL', e.target.checked ? '1' : '0')
                    }
                  />
                  <Form.Check
                    type="checkbox"
                    label="Employer Phone"
                    checked={formData.FLAG_EMP_PHONE === '1'}
                    onChange={(e) =>
                      handleChange(
                        'FLAG_EMP_PHONE',
                        e.target.checked ? '1' : '0',
                      )
                    }
                  />
                  <Form.Check
                    type="checkbox"
                    label="Work Phone"
                    checked={formData.FLAG_WORK_PHONE === '1'}
                    onChange={(e) =>
                      handleChange(
                        'FLAG_WORK_PHONE',
                        e.target.checked ? '1' : '0',
                      )
                    }
                  />
                  <Form.Check
                    type="checkbox"
                    label="Home Phone"
                    checked={formData.FLAG_PHONE === '1'}
                    onChange={(e) =>
                      handleChange('FLAG_PHONE', e.target.checked ? '1' : '0')
                    }
                  />
                  <Form.Check
                    type="checkbox"
                    label="My mobile phone is reachable"
                    checked={formData.FLAG_CONT_MOBILE === '1'}
                    onChange={(e) =>
                      handleChange(
                        'FLAG_CONT_MOBILE',
                        e.target.checked ? '1' : '0',
                      )
                    }
                  />
                </div>
              </Col>
            </Row>
          </div>
        )}

        {/* ================= PART 3: HOUSING & GEOGRAPHY ================= */}
        {step >= 3 && (
          <div
            className="form-section slide-down mt-5"
            ref={(el) => (sectionRefs.current[2] = el)}
          >
            <div className="d-flex align-items-center mb-4">
              <div className="step-circle">3</div>
              <h4 className="fw-bold text-slate m-0">Housing & Geography</h4>
            </div>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-4">
                  <Form.Label className="text-muted-custom small fw-semibold">
                    What best describes your living situation?
                  </Form.Label>
                  <Form.Select
                    className="custom-input"
                    value={formData.NAME_HOUSING_TYPE}
                    onChange={(e) =>
                      handleChange('NAME_HOUSING_TYPE', e.target.value)
                    }
                  >
                    <option value="House / apartment">House / Apartment</option>
                    <option value="With parents">With Parents</option>
                    <option value="Rented apartment">Rented Apartment</option>
                    <option value="Municipal apartment">
                      Municipal Apartment
                    </option>
                    <option value="Co-op apartment">Co-op Apartment</option>
                    <option value="Office apartment">Office Apartment</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-4">
                  <Form.Label className="text-muted-custom small fw-semibold">
                    What is your building type?
                  </Form.Label>
                  <Form.Select
                    className="custom-input"
                    value={formData.HOUSETYPE_MODE}
                    onChange={(e) =>
                      handleChange('HOUSETYPE_MODE', e.target.value)
                    }
                  >
                    <option value="block of flats">
                      Block of Flats / Apartment Building
                    </option>
                    <option value="terraced house">Terraced House</option>
                    <option value="specific housing">Specific Housing</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-4">
                  <Form.Label className="text-muted-custom small fw-semibold">
                    Building wall material? (Select multiple)
                  </Form.Label>
                  <div
                    style={{
                      background: 'var(--color-surface-2)',
                      // Dynamically turn the border red if there is an error
                      border: errors.WALLSMATERIAL_MODE
                        ? '1.5px solid #ef4444'
                        : '1px solid var(--color-border-light)',
                      borderRadius: 'var(--radius-sm)',
                    }}
                    className="p-3"
                  >
                    {[
                      'Block',
                      'Mixed',
                      'Monolithic',
                      'Others',
                      'Panel',
                      'Stone, brick',
                      'Wooden',
                    ].map((material) => (
                      <Form.Check
                        key={material}
                        type="checkbox"
                        label={material}
                        checked={formData.WALLSMATERIAL_MODE.includes(material)}
                        onChange={(e) => {
                          const newArr = e.target.checked
                            ? [...formData.WALLSMATERIAL_MODE, material]
                            : formData.WALLSMATERIAL_MODE.filter(
                                (x) => x !== material,
                              );
                          handleChange('WALLSMATERIAL_MODE', newArr);
                        }}
                      />
                    ))}
                  </div>
                  {/* Display the error message */}
                  {errors.WALLSMATERIAL_MODE && (
                    <div className="text-danger small mt-2 pt-1">
                      {errors.WALLSMATERIAL_MODE}
                    </div>
                  )}
                </Form.Group>
              </Col>
              {/* Clearer Maintenance Fund Question & Answers --- */}
              <Col md={6} className="mb-4">
                <Form.Group>
                  <Form.Label className="fw-semibold text-slate">
                    How are the maintenance and repair funds for your building
                    managed?
                  </Form.Label>
                  <Form.Select
                    className="custom-input"
                    value={formData.FONDKAPREMONT_MODE}
                    onChange={(e) =>
                      handleChange('FONDKAPREMONT_MODE', e.target.value)
                    }
                  >
                    <option value="not specified">
                      Not Specified / I don't know
                    </option>
                    <option value="reg oper account">
                      Standard Building Management Account
                    </option>
                    <option value="org spec account">
                      Specific Organization (e.g., Housing Authority)
                    </option>
                    <option value="reg oper spec account">
                      Dedicated Special Repair Fund Account
                    </option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-4">
                  <Form.Label className="text-muted-custom small fw-semibold">
                    Is the building in an emergency state?
                  </Form.Label>
                  <Form.Select
                    className="custom-input"
                    value={formData.EMERGENCYSTATE_MODE}
                    onChange={(e) =>
                      handleChange('EMERGENCYSTATE_MODE', e.target.value)
                    }
                  >
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={12}>
                <Form.Label className="text-muted-custom small fw-semibold">
                  Geographic Declarations (Check all that apply to you)
                </Form.Label>
                <div
                  style={{
                    background: 'var(--color-surface-2)',
                    border: '1px solid var(--color-border-light)',
                    borderRadius: 'var(--radius-sm)',
                  }}
                  className="p-3 mb-4 d-flex flex-column gap-2"
                >
                  <Form.Check
                    type="checkbox"
                    label="My permanent address city does NOT match my contact address city."
                    checked={formData.REG_CITY_NOT_LIVE_CITY === '1'}
                    onChange={(e) =>
                      handleChange(
                        'REG_CITY_NOT_LIVE_CITY',
                        e.target.checked ? '1' : '0',
                      )
                    }
                  />
                  <Form.Check
                    type="checkbox"
                    label="My permanent address city does NOT match my work address city."
                    checked={formData.REG_CITY_NOT_WORK_CITY === '1'}
                    onChange={(e) =>
                      handleChange(
                        'REG_CITY_NOT_WORK_CITY',
                        e.target.checked ? '1' : '0',
                      )
                    }
                  />
                  <Form.Check
                    type="checkbox"
                    label="My permanent address region does NOT match my contact address region."
                    checked={formData.REG_REGION_NOT_LIVE_REGION === '1'}
                    onChange={(e) =>
                      handleChange(
                        'REG_REGION_NOT_LIVE_REGION',
                        e.target.checked ? '1' : '0',
                      )
                    }
                  />
                  <Form.Check
                    type="checkbox"
                    label="My permanent address region does NOT match my work address region."
                    checked={formData.REG_REGION_NOT_WORK_REGION === '1'}
                    onChange={(e) =>
                      handleChange(
                        'REG_REGION_NOT_WORK_REGION',
                        e.target.checked ? '1' : '0',
                      )
                    }
                  />
                  <Form.Check
                    type="checkbox"
                    label="My contact address city does NOT match my work address city."
                    checked={formData.LIVE_CITY_NOT_WORK_CITY === '1'}
                    onChange={(e) =>
                      handleChange(
                        'LIVE_CITY_NOT_WORK_CITY',
                        e.target.checked ? '1' : '0',
                      )
                    }
                  />
                  <Form.Check
                    type="checkbox"
                    label="My contact address region does NOT match my work address region."
                    checked={formData.LIVE_REGION_NOT_WORK_REGION === '1'}
                    onChange={(e) =>
                      handleChange(
                        'LIVE_REGION_NOT_WORK_REGION',
                        e.target.checked ? '1' : '0',
                      )
                    }
                  />
                </div>
              </Col>
            </Row>
          </div>
        )}

        {/* ================= PART 4: EMPLOYMENT & INCOME ================= */}
        {step >= 4 && (
          <div
            className="form-section slide-down mt-5"
            ref={(el) => (sectionRefs.current[3] = el)}
          >
            <div className="d-flex align-items-center mb-4">
              <div className="step-circle">4</div>
              <h4 className="fw-bold text-slate m-0">Employment & Income</h4>
            </div>
            {errors.AMT_INCOME_TOTAL &&
              errors.AMT_INCOME_TOTAL.includes('AUTO-REJECT') && (
                <Alert variant="danger">
                  <AlertTriangle size={18} className="me-2" />
                  {errors.AMT_INCOME_TOTAL}
                </Alert>
              )}
            <Row>
              <Col md={6}>
                <Form.Group className="mb-4">
                  <Form.Label className="text-muted-custom small fw-semibold">
                    What is your primary source of income?
                  </Form.Label>
                  <Form.Select
                    className="custom-input"
                    value={formData.NAME_INCOME_TYPE}
                    onChange={(e) =>
                      handleChange('NAME_INCOME_TYPE', e.target.value)
                    }
                  >
                    <option value="Businessman">Businessman</option>
                    <option value="Commercial associate">
                      Commercial associate
                    </option>
                    <option value="Maternity leave">Maternity leave</option>
                    <option value="Pensioner">Pensioner</option>
                    <option value="State servant">State servant</option>
                    <option value="Student">Student</option>
                    <option value="Unemployed">Unemployed</option>
                    <option value="Working">Working</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-4">
                  <Form.Label className="text-muted-custom small fw-semibold">
                    What is your total annual income (USD)?
                  </Form.Label>
                  <Form.Control
                    className={`custom-input ${errors.AMT_INCOME_TOTAL ? 'is-invalid' : ''}`}
                    type="number"
                    placeholder="e.g. 50000"
                    value={formData.AMT_INCOME_TOTAL}
                    onChange={(e) =>
                      handleChange('AMT_INCOME_TOTAL', e.target.value)
                    }
                  />
                  {errors.AMT_INCOME_TOTAL &&
                    !errors.AMT_INCOME_TOTAL.includes('AUTO') && (
                      <div className="text-danger small mt-2 pt-1">
                        {errors.AMT_INCOME_TOTAL}
                      </div>
                    )}
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-4">
                  <Form.Label className="text-muted-custom small fw-semibold">
                    When did you start your current job?
                  </Form.Label>
                  <Form.Control
                    className={`custom-input ${errors.employed_date ? 'is-invalid' : ''}`}
                    type="date"
                    disabled={
                      ![
                        'Working',
                        'Commercial associate',
                        'State servant',
                      ].includes(formData.NAME_INCOME_TYPE)
                    }
                    value={formData.employed_date}
                    onChange={(e) =>
                      handleChange('employed_date', e.target.value)
                    }
                  />
                  {errors.employed_date && (
                    <div className="text-danger small mt-2 pt-1">
                      {errors.employed_date}
                    </div>
                  )}
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-4">
                  <Form.Label className="text-muted-custom small fw-semibold">
                    Job Title / Occupation (Search)
                  </Form.Label>
                  <Form.Control
                    list="occupation-options"
                    className="custom-input"
                    disabled={['Pensioner', 'Unemployed', 'Student'].includes(
                      formData.NAME_INCOME_TYPE,
                    )}
                    value={formData.OCCUPATION_TYPE}
                    onChange={(e) =>
                      handleChange('OCCUPATION_TYPE', e.target.value)
                    }
                  />
                  <datalist id="occupation-options">
                    <option value="Accountants" />
                    <option value="Cleaning staff" />
                    <option value="Cooking staff" />
                    <option value="Core staff" />
                    <option value="Drivers" />
                    <option value="HR staff" />
                    <option value="High skill tech staff" />
                    <option value="IT staff" />
                    <option value="Laborers" />
                    <option value="Low-skill Laborers" />
                    <option value="Managers" />
                    <option value="Medicine staff" />
                    <option value="Private service staff" />
                    <option value="Realty agents" />
                    <option value="Sales staff" />
                    <option value="Secretaries" />
                    <option value="Security staff" />
                    <option value="Waiters/barmen staff" />
                  </datalist>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-4">
                  <Form.Label className="text-muted-custom small fw-semibold">
                    Industry / Organization Type (Search)
                  </Form.Label>
                  <Form.Control
                    list="org-options"
                    className="custom-input"
                    disabled={['Pensioner', 'Unemployed', 'Student'].includes(
                      formData.NAME_INCOME_TYPE,
                    )}
                    value={formData.ORGANIZATION_TYPE}
                    onChange={(e) =>
                      handleChange('ORGANIZATION_TYPE', e.target.value)
                    }
                  />
                  <datalist id="org-options">
                    {[
                      'Advertising',
                      'Agriculture',
                      'Bank',
                      'Business Entity Type 1',
                      'Business Entity Type 2',
                      'Business Entity Type 3',
                      'Cleaning',
                      'Construction',
                      'Culture',
                      'Electricity',
                      'Emergency',
                      'Government',
                      'Hotel',
                      'Housing',
                      'Industry: type 1',
                      'Industry: type 10',
                      'Industry: type 11',
                      'Industry: type 12',
                      'Industry: type 13',
                      'Industry: type 2',
                      'Industry: type 3',
                      'Industry: type 4',
                      'Industry: type 5',
                      'Industry: type 6',
                      'Industry: type 7',
                      'Industry: type 8',
                      'Industry: type 9',
                      'Insurance',
                      'Kindergarten',
                      'Legal Services',
                      'Medicine',
                      'Military',
                      'Mobile',
                      'Other',
                      'Police',
                      'Postal',
                      'Realtor',
                      'Religion',
                      'Restaurant',
                      'School',
                      'Security',
                      'Security Ministries',
                      'Self-employed',
                      'Services',
                      'Telecom',
                      'Trade: type 1',
                      'Trade: type 2',
                      'Trade: type 3',
                      'Trade: type 4',
                      'Trade: type 5',
                      'Trade: type 6',
                      'Trade: type 7',
                      'Transport: type 1',
                      'Transport: type 2',
                      'Transport: type 3',
                      'Transport: type 4',
                      'University',
                    ].map((org) => {
                      const friendly = ORG_FRIENDLY_MAP[org];
                      const optionValue = friendly
                        ? `${friendly} (${org})`
                        : org;
                      return <option key={org} value={optionValue} />;
                    })}
                  </datalist>
                </Form.Group>
              </Col>
            </Row>
          </div>
        )}

        {/* ================= PART 5: LOAN PARAMETERS ================= */}
        {step >= 5 && (
          <div
            className="form-section slide-down mt-5"
            ref={(el) => (sectionRefs.current[4] = el)}
          >
            <div className="d-flex align-items-center mb-4">
              <div className="step-circle">5</div>
              <h4 className="fw-bold text-slate m-0">Loan Details</h4>
            </div>
            {errors.AMT_CREDIT && errors.AMT_CREDIT.includes('AUTO-REJECT') && (
              <Alert variant="danger">
                <AlertTriangle size={18} className="me-2" />
                {errors.AMT_CREDIT}
              </Alert>
            )}
            <Row>
              <Col md={6}>
                <Form.Group className="mb-4">
                  <Form.Label className="text-muted-custom small fw-semibold">
                    Are you applying for a Cash Loan or Revolving Loan?
                  </Form.Label>
                  <Form.Select
                    className="custom-input"
                    value={formData.NAME_CONTRACT_TYPE}
                    onChange={(e) =>
                      handleChange('NAME_CONTRACT_TYPE', e.target.value)
                    }
                  >
                    <option value="Cash loans">Cash Loan</option>
                    <option value="Revolving loans">
                      Revolving Loan (Credit Card)
                    </option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-4">
                  <Form.Label className="text-muted-custom small fw-semibold">
                    How much are you requesting to borrow?
                  </Form.Label>
                  <Form.Control
                    className={`custom-input ${errors.AMT_CREDIT ? 'is-invalid' : ''}`}
                    type="number"
                    placeholder="e.g. 15000"
                    value={formData.AMT_CREDIT}
                    onChange={(e) => handleChange('AMT_CREDIT', e.target.value)}
                  />
                  {errors.AMT_CREDIT && !errors.AMT_CREDIT.includes('AUTO') && (
                    <div className="text-danger small mt-2 pt-1">
                      {errors.AMT_CREDIT}
                    </div>
                  )}
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-4">
                  <Form.Label className="text-muted-custom small fw-semibold">
                    What is your preferred yearly repayment amount (Annuity)?
                  </Form.Label>
                  <Form.Control
                    className={`custom-input ${errors.AMT_ANNUITY ? 'is-invalid' : ''}`}
                    type="number"
                    placeholder="e.g. 1500"
                    value={formData.AMT_ANNUITY}
                    onChange={(e) =>
                      handleChange('AMT_ANNUITY', e.target.value)
                    }
                  />
                  {errors.AMT_ANNUITY && (
                    <div className="text-danger small mt-2 pt-1">
                      {errors.AMT_ANNUITY}
                    </div>
                  )}
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-4">
                  <Form.Label className="text-muted-custom small fw-semibold">
                    If this loan is to purchase a specific item, what is the
                    item's price?
                  </Form.Label>
                  <Form.Control
                    className="custom-input"
                    type="number"
                    placeholder="Leave blank if not applicable"
                    value={formData.AMT_GOODS_PRICE}
                    onChange={(e) =>
                      handleChange('AMT_GOODS_PRICE', e.target.value)
                    }
                  />
                </Form.Group>
              </Col>
            </Row>
          </div>
        )}

        {/* ================= PART 6: RISK INDICATORS ================= */}
        {step >= 6 && (
          <div
            className="form-section slide-down mt-5"
            ref={(el) => (sectionRefs.current[5] = el)}
          >
            <div className="d-flex align-items-center mb-4">
              <div className="step-circle">6</div>
              <h4 className="fw-bold text-slate m-0">Final Declarations</h4>
            </div>
            <Row>
              <Col md={12}>
                <Form.Group className="mb-4">
                  <Form.Label className="text-muted-custom small fw-semibold">
                    How many people in your observable social circle have been
                    past due on a loan by 30 days?
                  </Form.Label>
                  <Form.Control
                    className="custom-input"
                    type="number"
                    min="0"
                    value={formData.OBS_30_CNT_SOCIAL_CIRCLE}
                    onChange={(e) =>
                      handleChange('OBS_30_CNT_SOCIAL_CIRCLE', e.target.value)
                    }
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-4">
                  <Form.Label className="text-muted-custom small fw-semibold">
                    How many of those people actually defaulted on a loan at 30
                    days?
                  </Form.Label>
                  <Form.Control
                    className="custom-input"
                    type="number"
                    min="0"
                    value={formData.DEF_30_CNT_SOCIAL_CIRCLE}
                    onChange={(e) =>
                      handleChange('DEF_30_CNT_SOCIAL_CIRCLE', e.target.value)
                    }
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-4">
                  <Form.Label className="text-muted-custom small fw-semibold">
                    How many of those people actually defaulted on a loan at 60
                    days?
                  </Form.Label>
                  <Form.Control
                    className="custom-input"
                    type="number"
                    min="0"
                    value={formData.DEF_60_CNT_SOCIAL_CIRCLE}
                    onChange={(e) =>
                      handleChange('DEF_60_CNT_SOCIAL_CIRCLE', e.target.value)
                    }
                  />
                </Form.Group>
              </Col>
            </Row>
          </div>
        )}
      </div>

      {/* ================= STICKY ACTION BAR ================= */}
      <div className="sticky-action-bar d-flex justify-content-between align-items-center">
        <div style={{ flex: 1 }}>
          {step > 1 && (
            <button
              className="btn d-flex align-items-center fw-semibold"
              onClick={handleBack}
              style={{
                borderColor: 'var(--color-border)',
                color: 'var(--color-text-muted)',
                border: '1px solid var(--color-border)',
                borderRadius: '10px',
                padding: '8px 18px',
                background: 'white',
              }}
            >
              <ChevronLeft size={18} className="me-1" /> Back
            </button>
          )}
        </div>
        <div className="text-center" style={{ flex: 1 }}>
          <div className="d-flex align-items-center justify-content-center gap-1 mb-1">
            {[1, 2, 3, 4, 5, 6].map((s) => (
              <div
                key={s}
                style={{
                  height: 4,
                  width: s === step ? 24 : 14,
                  borderRadius: 4,
                  background:
                    s <= step ? 'var(--color-accent)' : 'var(--color-border)',
                  transition: 'all 0.3s ease',
                }}
              />
            ))}
          </div>
          <span
            className="text-muted-custom fw-semibold"
            style={{ fontSize: '0.8rem' }}
          >
            Step {step} of 6
          </span>
        </div>
        <div className="text-end" style={{ flex: 1 }}>
          <button className="btn btn-cta" onClick={handleNext}>
            {step === 6 ? 'Submit Application' : 'Continue'}{' '}
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <Modal show={showDiscard} onHide={() => setShowDiscard(false)} centered>
        <Modal.Body
          className="p-4 text-center"
          style={{ borderRadius: 'var(--radius-lg)' }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              background: 'rgba(239,68,68,0.1)',
              borderRadius: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem',
            }}
          >
            <AlertTriangle size={22} color="#ef4444" />
          </div>
          <h4
            className="fw-bold mb-2"
            style={{ fontFamily: 'Fraunces, serif' }}
          >
            Discard Application?
          </h4>
          <p className="text-muted-custom mb-4" style={{ fontSize: '0.95rem' }}>
            Your progress will be lost. Are you sure you want to exit?
          </p>
          <div className="d-flex gap-2 justify-content-center">
            <button
              className="btn fw-semibold"
              style={{
                border: '1px solid var(--color-border)',
                borderRadius: 10,
                padding: '10px 24px',
                background: 'white',
                color: 'var(--color-text)',
              }}
              onClick={() => setShowDiscard(false)}
            >
              Keep Editing
            </button>
            <button
              className="btn fw-semibold"
              style={{
                background: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: 10,
                padding: '10px 24px',
              }}
              onClick={onCancel}
            >
              Yes, Discard
            </button>
          </div>
        </Modal.Body>
      </Modal>

      <Modal show={showConfirm} onHide={() => setShowConfirm(false)} centered>
        <Modal.Body
          className="p-4 text-center"
          style={{ borderRadius: 'var(--radius-lg)' }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              background: 'var(--color-accent-light)',
              borderRadius: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem',
            }}
          >
            <ShieldCheck size={22} color="var(--color-accent)" />
          </div>
          <h4
            className="fw-bold mb-2"
            style={{ fontFamily: 'Fraunces, serif' }}
          >
            Ready to Submit?
          </h4>
          <p className="text-muted-custom mb-4" style={{ fontSize: '0.95rem' }}>
            Our AI will now analyze your creditworthiness based on this data.
          </p>
          <div className="d-flex gap-2 justify-content-center">
            <button
              className="btn fw-semibold"
              style={{
                border: '1px solid var(--color-border)',
                borderRadius: 10,
                padding: '10px 24px',
                background: 'white',
                color: 'var(--color-text)',
              }}
              onClick={() => setShowConfirm(false)}
            >
              Review Again
            </button>
            <button className="btn btn-cta" onClick={executeSubmit}>
              Confirm & Predict
            </button>
          </div>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default CreditForm;
