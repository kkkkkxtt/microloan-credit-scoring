/**
 * CreditForm.jsx  (refactored)
 *
 * Responsibilities: state, validation, data transformation, modals, UI chrome.
 * The 6 form-step JSX lives in → CreditFormApplication.jsx
 */

import React, { useState, useEffect, useRef, useContext } from 'react';
import { Modal } from 'react-bootstrap';
import {
  ChevronRight,
  ChevronLeft,
  AlertTriangle,
  Fingerprint,
  ShieldCheck,
} from 'lucide-react';
import { getLatestId } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import CreditFormApplication from './CreditFormApplication';

/* ─── Friendly labels for organisation codes ─────────────────────────────── */
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

/* ─── Initial form state ──────────────────────────────────────────────────── */
const buildInitialState = (user) => ({
  applicant_ic: '',
  CODE_GENDER: user?.profile?.gender || '',
  birth_date: user?.profile?.date_of_birth || '',
  NAME_EDUCATION_TYPE: 'Secondary / secondary special',
  NAME_FAMILY_STATUS: 'Single / not married',
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
  FONDKAPREMONT_MODE: 'not specified',
  EMERGENCYSTATE_MODE: 'No',
  REG_CITY_NOT_LIVE_CITY: '0',
  REG_CITY_NOT_WORK_CITY: '0',
  REG_REGION_NOT_LIVE_REGION: '0',
  REG_REGION_NOT_WORK_REGION: '0',
  LIVE_CITY_NOT_WORK_CITY: '0',
  LIVE_REGION_NOT_WORK_REGION: '0',

  NAME_INCOME_TYPE: 'Working',
  AMT_INCOME_TOTAL: user?.profile?.annual_income || '',

  // Requirement 3: Set default empty states
  OCCUPATION_TYPE: '',
  ORGANIZATION_TYPE: '',

  employed_date: '',

  NAME_CONTRACT_TYPE: 'Cash loans',
  AMT_CREDIT: '',
  AMT_ANNUITY: '',
  AMT_GOODS_PRICE: '',

  OBS_30_CNT_SOCIAL_CIRCLE: 0,
  DEF_30_CNT_SOCIAL_CIRCLE: 0,
  DEF_60_CNT_SOCIAL_CIRCLE: 0,
});
/* ─── Field Map for Auto-Repositioning ────────────────────────────────────── */
const FIELD_STEP_MAP = {
  CODE_GENDER: 1,
  birth_date: 1,
  CNT_CHILDREN: 1,
  CNT_FAM_MEMBERS: 1,
  WALLSMATERIAL_MODE: 3,
  AMT_INCOME_TOTAL: 4,
  employed_date: 4,
  OCCUPATION_TYPE: 4,
  ORGANIZATION_TYPE: 4,
  AMT_CREDIT: 5,
  AMT_ANNUITY: 5,
  AMT_GOODS_PRICE: 5,
  LOAN_REC: 5,
};

/* ─── Component ───────────────────────────────────────────────────────────── */
const CreditForm = ({ onSubmit, onCancel }) => {
  const { user } = useContext(AuthContext);

  const [step, setStep] = useState(1);
  const [showDiscard, setShowDiscard] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState({});
  const [toastMsg, setToastMsg] = useState('');
  const [formData, setFormData] = useState(() => buildInitialState(user));

  const sectionRefs = useRef([]);

  /* ── Fetch application ID on mount ── */
  useEffect(() => {
    const fetchId = async () => {
      try {
        const response = await getLatestId();
        let actualId = '1';
        if (typeof response === 'object' && response !== null) {
          const inner = response.data !== undefined ? response.data : response;
          actualId =
            typeof inner === 'object' && inner !== null
              ? Object.values(inner)[0]
              : inner;
        } else {
          actualId = response;
        }
        setFormData((prev) => ({ ...prev, applicant_ic: String(actualId) }));
      } catch {
        setFormData((prev) => ({ ...prev, applicant_ic: '1' }));
      }
    };
    fetchId();
  }, []);

  /* ── Scroll to current section ── */
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

  /* ─── Helpers ─────────────────────────────────────────────────────────── */
  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      const e = { ...prev };
      if (e[field]) delete e[field];
      if (['AMT_CREDIT', 'AMT_ANNUITY', 'AMT_INCOME_TOTAL'].includes(field)) {
        delete e.LOAN_REC;
      }
      return e;
    });
  };

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 4000);
  };

  /* ─── Validation ──────────────────────────────────────────────────────── */
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

    if (currentStep >= 1) {
      if (!formData.CODE_GENDER)
        newErrors.CODE_GENDER = 'Please select gender.';
      const bDate = parseDateSafe(formData.birth_date);
      if (!bDate) {
        newErrors.birth_date =
          'Please provide a valid Date of Birth (mm/dd/yyyy).';
      } else if (bDate > now) {
        newErrors.birth_date = 'Date of Birth cannot be in the future.';
      } else {
        const age = (now - bDate) / (1000 * 60 * 60 * 24 * 365.25);
        if (age < 18) {
          newErrors.birth_date =
            'AUTO-REJECT: Applicant is a minor (Under 18).';
          isAutoRejected = true;
        } else if (age > 70) {
          newErrors.birth_date =
            'AUTO-REJECT: Applicant exceeds maximum age limit (70).';
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

    if (currentStep >= 3) {
      if (
        !formData.WALLSMATERIAL_MODE ||
        formData.WALLSMATERIAL_MODE.length === 0
      )
        newErrors.WALLSMATERIAL_MODE =
          'Please select at least one building wall material.';
    }

    if (currentStep >= 4) {
      const income = parseNumber(formData.AMT_INCOME_TOTAL);

      if (
        formData.AMT_INCOME_TOTAL === null ||
        formData.AMT_INCOME_TOTAL === undefined ||
        formData.AMT_INCOME_TOTAL.toString().trim() === ''
      ) {
        newErrors.AMT_INCOME_TOTAL = 'Please enter your total annual income.';
      } else if (Number.isNaN(income) || income < 0) {
        newErrors.AMT_INCOME_TOTAL = 'Please enter a valid annual income.';
      } else {
        const nonWorkingTypes = ['Pensioner', 'Student', 'Unemployed'];
        const isWorking = !nonWorkingTypes.includes(formData.NAME_INCOME_TYPE);

        if (isWorking && income < 1000) {
          newErrors.AMT_INCOME_TOTAL =
            'AUTO-REJECT: Verifiable income is below minimum threshold.';
          isAutoRejected = true;
        }
      }

      const nonWorkingTypes = ['Pensioner', 'Student', 'Unemployed'];
      const isWorking = !nonWorkingTypes.includes(formData.NAME_INCOME_TYPE);

      if (isWorking) {
        const empDate = parseDateSafe(formData.employed_date);
        if (!empDate)
          newErrors.employed_date =
            'Please provide a valid employment start date (mm/dd/yyyy).';
        else if (empDate > now)
          newErrors.employed_date =
            'Employment start date cannot be in the future.';
        else {
          const bDate = parseDateSafe(formData.birth_date);
          if (bDate) {
            const minStart = new Date(bDate);
            minStart.setFullYear(minStart.getFullYear() + 14);
            if (empDate < minStart)
              newErrors.employed_date =
                'Employment start date is inconsistent with Date of Birth.';
          }
        }

        if (!formData.OCCUPATION_TYPE) {
          newErrors.OCCUPATION_TYPE =
            'Please select your Job Title / Occupation.';
        }
        if (!formData.ORGANIZATION_TYPE) {
          newErrors.ORGANIZATION_TYPE =
            'Please select your Industry / Organization Type.';
        }
      }
    }

    if (currentStep >= 5) {
      if (
        formData.AMT_CREDIT === null ||
        formData.AMT_CREDIT === undefined ||
        formData.AMT_CREDIT.toString().trim() === ''
      ) {
        newErrors.AMT_CREDIT = 'Please enter the requested borrow amount.';
      } else {
        const credit = parseNumber(formData.AMT_CREDIT);
        if (Number.isNaN(credit) || credit <= 0)
          newErrors.AMT_CREDIT =
            'Please enter a valid requested credit amount.';
      }
      if (
        formData.AMT_ANNUITY === null ||
        formData.AMT_ANNUITY === undefined ||
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

      const income = parseNumber(formData.AMT_INCOME_TOTAL);
      const credit = parseNumber(formData.AMT_CREDIT);
      const annuity = parseNumber(formData.AMT_ANNUITY);

      // FIX: Independent ratio evaluations to prevent conflicting/hidden errors
      if (
        !Number.isNaN(income) &&
        !Number.isNaN(credit) &&
        !Number.isNaN(annuity) &&
        income >= 0 &&
        credit > 0 &&
        annuity > 0
      ) {
        // 1. Credit to Income (0.5x to 10x) - Auto Reject
        const creditToIncome = income === 0 ? Infinity : credit / income;
        if (creditToIncome < 0.5 || creditToIncome > 10) {
          newErrors.AMT_CREDIT = `AUTO-REJECT: Requested borrow amount must be between 0.5x and 10x of your annual income. (Current: ${income === 0 ? 'Infinity' : creditToIncome.toFixed(1)}x)`;
          isAutoRejected = true;
        }

        // 2. Income to Annuity (2x to 30x) - Auto Reject
        const incomeToAnnuity = annuity === 0 ? Infinity : income / annuity;
        if (incomeToAnnuity < 2 || incomeToAnnuity > 30) {
          newErrors.AMT_ANNUITY = `AUTO-REJECT: Income to repayment ratio must be between 2x and 30x. (Current: ${incomeToAnnuity.toFixed(1)}x)`;
          isAutoRejected = true;
        }

        // 3. Annuity to Credit (2.6% to 12%) - Recommendation ONLY (No Auto-Reject trigger)
        const annuityToCredit = annuity / credit;
        if (annuityToCredit < 0.026 || annuityToCredit > 0.12) {
          newErrors.LOAN_REC = `Recommendation: Yearly repayment recommended to be between 2.6% and 12% of requested borrow amount. (Current: ${(annuityToCredit * 100).toFixed(1)}%)`;
        }
      }
    }

    if (currentStep === 6) {
      const now2 = new Date();
      const parseDateSafe2 = parseDateSafe;
      const income = parseNumber(formData.AMT_INCOME_TOTAL) || 0;
      const credit = parseNumber(formData.AMT_CREDIT) || 0;
      const annuity = parseNumber(formData.AMT_ANNUITY) || 0;
      const bDate = parseDateSafe2(formData.birth_date);

      const nonWorkingTypes = ['Pensioner', 'Student', 'Unemployed'];
      const isWorking = !nonWorkingTypes.includes(formData.NAME_INCOME_TYPE);

      if (!bDate) {
        newErrors.birth_date = 'Please provide a valid Date of Birth.';
      } else {
        const age = (now2 - bDate) / (1000 * 60 * 60 * 24 * 365.25);
        if (age < 18) {
          newErrors.birth_date =
            'AUTO-REJECT: Applicant is a minor (Under 18).';
          isAutoRejected = true;
        } else if (age > 70) {
          newErrors.birth_date =
            'AUTO-REJECT: Applicant exceeds maximum age limit (70).';
          isAutoRejected = true;
        }

        if (formData.employed_date && isWorking) {
          const empDate = parseDateSafe2(formData.employed_date);
          if (!empDate) {
            newErrors.employed_date =
              'Please provide a valid employment start date.';
          } else {
            const minStart = new Date(bDate);
            minStart.setFullYear(minStart.getFullYear() + 14);
            if (empDate < minStart)
              newErrors.employed_date =
                'Employment start date is inconsistent with Date of Birth.';
            if (empDate > now2)
              newErrors.employed_date =
                'Employment start date cannot be in the future.';
            const yearsEmployed =
              (now2 - empDate) / (1000 * 60 * 60 * 24 * 365.25);
            if (yearsEmployed > age)
              newErrors.employed_date =
                'Employment start date indicates worked longer than applicant age.';
          }
        }
      }

      if (isWorking && income < 1000) {
        newErrors.AMT_INCOME_TOTAL =
          'AUTO-REJECT: Verifiable income is below minimum threshold.';
        isAutoRejected = true;
      }

      // FIX: Independent ratio evaluations for final check
      if (income >= 0 && credit > 0 && annuity > 0) {
        const creditToIncome = income === 0 ? Infinity : credit / income;
        if (creditToIncome < 0.5 || creditToIncome > 10) {
          newErrors.AMT_CREDIT =
            'AUTO-REJECT: Requested borrow amount must be between 0.5x and 10x of your annual income.';
          isAutoRejected = true;
        }

        const incomeToAnnuity = annuity === 0 ? Infinity : income / annuity;
        if (incomeToAnnuity < 2 || incomeToAnnuity > 30) {
          newErrors.AMT_ANNUITY =
            'AUTO-REJECT: Income to repayment ratio must be between 2x and 30x.';
          isAutoRejected = true;
        }

        const annuityToCredit = annuity / credit;
        if (annuityToCredit < 0.026 || annuityToCredit > 0.12) {
          newErrors.LOAN_REC =
            'Recommendation: Yearly repayment should be between 2.6% and 12% of requested borrow amount.';
        }
      }
    }

    setErrors((prev) => ({ ...prev, ...newErrors }));
    return {
      isValid: Object.keys(newErrors).length === 0 && !isAutoRejected,
      isAutoRejected,
      newErrors,
    };
  };

  /* ─── Navigation ──────────────────────────────────────────────────────── */
  const handleNext = () => {
    const { isValid, isAutoRejected, newErrors } = validateStep(step);

    if (!isValid) {
      showToast(
        isAutoRejected
          ? 'Application auto-rejected due to invalid core parameters.'
          : 'Please fix the highlighted errors before continuing.',
      );

      // Auto-reposition logic
      const errKeys = Object.keys(newErrors);
      if (errKeys.length > 0) {
        const firstErrStep = Math.min(
          ...errKeys.map((k) => FIELD_STEP_MAP[k] || step),
        );
        if (firstErrStep !== step) {
          setStep(firstErrStep);
        } else {
          sectionRefs.current[step - 1]?.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
          });
        }
      }
      return;
    }

    if (step < 6) setStep(step + 1);
    else setShowConfirm(true);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  /* ─── Final submit ────────────────────────────────────────────────────── */
  const executeSubmit = () => {
    setShowConfirm(false);
    const { isValid, isAutoRejected, newErrors } = validateStep(6);

    if (!isValid) {
      showToast(
        isAutoRejected
          ? 'Application auto-rejected due to core business rules.'
          : 'Please fix the highlighted errors before submitting.',
      );

      // Auto-reposition logic
      const errKeys = Object.keys(newErrors);
      if (errKeys.length > 0) {
        const firstErrStep = Math.min(
          ...errKeys.map((k) => FIELD_STEP_MAP[k] || 6),
        );
        if (firstErrStep < 6) {
          setStep(firstErrStep);
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }
      return;
    }

    const birthDate = new Date(formData.birth_date);
    const DAYS_BIRTH = -Math.ceil(
      (new Date() - birthDate) / (1000 * 60 * 60 * 24),
    );

    let DAYS_EMPLOYED = 365243; // Default value for non-working types
    const nonWorkingTypes = ['Pensioner', 'Student', 'Unemployed'];
    const isWorking = !nonWorkingTypes.includes(formData.NAME_INCOME_TYPE);

    if (formData.employed_date && isWorking) {
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

    if (
      payload.ORGANIZATION_TYPE &&
      typeof payload.ORGANIZATION_TYPE === 'string'
    ) {
      const m = payload.ORGANIZATION_TYPE.match(/\(([^)]+)\)\s*$/);
      if (m && m[1]) payload.ORGANIZATION_TYPE = m[1];
      else {
        const reverseKey = Object.keys(ORG_FRIENDLY_MAP).find(
          (k) =>
            ORG_FRIENDLY_MAP[k].toLowerCase() ===
            payload.ORGANIZATION_TYPE.toLowerCase(),
        );
        if (reverseKey) payload.ORGANIZATION_TYPE = reverseKey;
      }
    }

    delete payload.birth_date;
    delete payload.employed_date;
    onSubmit(payload);
  };

  /* ─── Render ──────────────────────────────────────────────────────────── */
  return (
    <div className="fade-in pb-5 position-relative">
      {/* Toast */}
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
          <AlertTriangle size={18} /> {toastMsg}
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
          background: 'linear-gradient(135deg,#f0faf6 0%,#e8f5ef 100%)',
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
            AP{formData.applicant_ic}
          </span>
        </div>
        <div
          className="ms-auto text-muted-custom small text-end"
          style={{ fontSize: '0.82rem' }}
        >
          💡 Save this ID to look up your record later.
        </div>
      </div>

      {/* ── Delegate step JSX to CreditFormApplication ── */}
      <CreditFormApplication
        step={step}
        formData={formData}
        errors={errors}
        handleChange={handleChange}
        sectionRefs={sectionRefs}
        ORG_FRIENDLY_MAP={ORG_FRIENDLY_MAP}
      />

      {/* ── Sticky Action Bar ── */}
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

      {/* ── Discard Modal ── */}
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

      {/* ── Confirm Submit Modal ── */}
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
            Our AI will now analyse your creditworthiness based on this data.
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
              Confirm
            </button>
          </div>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default CreditForm;
