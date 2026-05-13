import React from 'react';
import { Row, Col } from 'react-bootstrap';

/**
 * RecordPage
 * Renders the "Form Record" tab content inside the result view.
 * Props:
 *   result – the full result / application object from the API
 */
const RecordPage = ({ result }) => {
  if (!result) return null;

  const data = result.raw_features_log || result.input_features || {};

  /* ── helpers ── */
  const formatMoney = (val) =>
    val != null
      ? new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
        }).format(val)
      : '—';

  const getAge = (days) =>
    days ? Math.floor(Math.abs(days) / 365.25) + ' years old' : '—';

  const getContacts = () => {
    const c = [];
    if (String(data.FLAG_EMAIL) === '1') c.push('Email');
    if (String(data.FLAG_MOBIL) === '1') c.push('Mobile');
    if (String(data.FLAG_EMP_PHONE) === '1') c.push('Employer');
    if (String(data.FLAG_WORK_PHONE) === '1') c.push('Work');
    if (String(data.FLAG_PHONE) === '1') c.push('Home');
    return c.length > 0 ? c.join(', ') : 'None Provided';
  };

  const getGeoDeclarations = () => {
    const diffs = [];
    if (String(data.REG_CITY_NOT_LIVE_CITY) === '1')
      diffs.push('Permanent & Contact City differ');
    if (String(data.REG_CITY_NOT_WORK_CITY) === '1')
      diffs.push('Permanent & Work City differ');
    if (String(data.REG_REGION_NOT_LIVE_REGION) === '1')
      diffs.push('Permanent & Contact Region differ');
    if (String(data.REG_REGION_NOT_WORK_REGION) === '1')
      diffs.push('Permanent & Work Region differ');
    if (String(data.LIVE_CITY_NOT_WORK_CITY) === '1')
      diffs.push('Contact & Work City differ');
    if (String(data.LIVE_REGION_NOT_WORK_REGION) === '1')
      diffs.push('Contact & Work Region differ');

    if (diffs.length === 0)
      return <span className="rp-match-ok">✓ All addresses match</span>;

    return (
      <div className="rp-geo-list">
        {diffs.map((d, i) => (
          <span key={i} className="rp-geo-badge">
            {d}
          </span>
        ))}
      </div>
    );
  };

  /* ── sub-components ── */
  const SectionHeader = ({ number, title }) => (
    <div className="rp-section-header">
      <div className="rp-section-number">{number}</div>
      <h4 className="rp-section-title">{title}</h4>
    </div>
  );

  const Field = ({ label, value, wide }) => (
    <Col md={wide ? 12 : 4} sm={wide ? 12 : 6} className="mb-4">
      <div className="rp-field">
        <p className="rp-field-label">{label}</p>
        <p className="rp-field-value">
          {value !== null && value !== '' && value !== undefined ? value : '—'}
        </p>
      </div>
    </Col>
  );

  const genderLabel =
    data.CODE_GENDER === 1 || data.CODE_GENDER === 'M'
      ? 'Male'
      : data.CODE_GENDER === 0 || data.CODE_GENDER === 'F'
        ? 'Female'
        : 'Unknown';

  return (
    <div className="record-page fade-in">
      {/* ── Page header ── */}
      <div className="rp-page-header">
        <div>
          <h2 className="fw-bold text-slate mb-3">
            Submitted Application Data
          </h2>
          <p className="rp-page-subtitle">
            Read-only summary of all fields provided at the time of submission.
          </p>
        </div>
        <span className="rp-app-id-badge">ID: AP{result.applicant_ic}</span>
      </div>

      <div className="rp-card">
        {/* ── 1. Personal Demographics ── */}
        <SectionHeader number="1" title="Personal Demographics" />
        <Row className="g-3 mb-2">
          <Field label="What is your gender?" value={genderLabel} />
          <Field label="Calculated Age" value={getAge(data.DAYS_BIRTH)} />
          <Field
            label="Current marital status?"
            value={data.NAME_FAMILY_STATUS}
          />
          <Field
            label="Highest level of education?"
            value={data.NAME_EDUCATION_TYPE}
          />
          <Field label="Total children?" value={data.CNT_CHILDREN} />
          <Field label="Household members?" value={data.CNT_FAM_MEMBERS} />
        </Row>

        <div className="rp-divider" />

        {/* ── 2. Contact & Assets ── */}
        <SectionHeader number="2" title="Contact & Assets" />
        <Row className="g-3 mb-2">
          <Field
            label="Do you own a car?"
            value={data.FLAG_OWN_CAR === 'Y' ? 'Yes' : 'No'}
          />
          <Field label="Car age (years)?" value={data.OWN_CAR_AGE || '0'} />
          <Field
            label="Do you own real estate?"
            value={data.FLAG_OWN_REALTY === 'Y' ? 'Yes' : 'No'}
          />
          <Field
            label="Months since phone change?"
            value={Math.abs(data.DAYS_LAST_PHONE_CHANGE || 0)}
          />
          <Field label="Provided contact methods?" value={getContacts()} />
        </Row>

        <div className="rp-divider" />

        {/* ── 3. Housing & Geography ── */}
        <SectionHeader number="3" title="Housing & Geography" />
        <Row className="g-3 mb-2">
          <Field label="Housing type?" value={data.NAME_HOUSING_TYPE} />
          <Field label="House type mode?" value={data.HOUSETYPE_MODE} />
          <Field
            label="Wall material?"
            value={
              Array.isArray(data.WALLSMATERIAL_MODE)
                ? data.WALLSMATERIAL_MODE.join(', ')
                : data.WALLSMATERIAL_MODE
            }
          />
          <Field label="Renovation fund?" value={data.FONDKAPREMONT_MODE} />
          <Field label="Emergency state?" value={data.EMERGENCYSTATE_MODE} />
          <Col md={12} sm={12} className="mb-4">
            <div className="rp-field">
              <p className="rp-field-label">Geographic declarations</p>
              <div className="rp-field-value">{getGeoDeclarations()}</div>
            </div>
          </Col>
        </Row>

        <div className="rp-divider" />

        {/* ── 4. Employment & Income ── */}
        <SectionHeader number="4" title="Employment & Income" />
        <Row className="g-3 mb-2">
          <Field label="Income type?" value={data.NAME_INCOME_TYPE} />
          <Field
            label="Total annual income?"
            value={formatMoney(data.AMT_INCOME_TOTAL)}
          />
          <Field label="Occupation?" value={data.OCCUPATION_TYPE} />
          <Field label="Organisation type?" value={data.ORGANIZATION_TYPE} />
          <Field
            label="Years employed?"
            value={
              data.DAYS_EMPLOYED && data.DAYS_EMPLOYED !== 365243
                ? Math.floor(Math.abs(data.DAYS_EMPLOYED) / 365.25) + ' years'
                : 'Unemployed / Pensioner'
            }
          />
        </Row>

        <div className="rp-divider" />

        {/* ── 5. Loan Details ── */}
        <SectionHeader number="5" title="Loan Details" />
        <Row className="g-3 mb-2">
          <Field label="Contract type?" value={data.NAME_CONTRACT_TYPE} />
          <Field
            label="Requested credit amount?"
            value={formatMoney(data.AMT_CREDIT)}
          />
          <Field
            label="Annual repayment (annuity)?"
            value={formatMoney(data.AMT_ANNUITY)}
          />
          <Field
            label="Goods price?"
            value={formatMoney(data.AMT_GOODS_PRICE)}
          />
        </Row>

        <div className="rp-divider" />

        {/* ── 6. Final Declarations ── */}
        <SectionHeader number="6" title="Final Declarations" />
        <Row className="g-3">
          <Field
            label="Social circle observed (30-day overdue)?"
            value={data.OBS_30_CNT_SOCIAL_CIRCLE}
          />
          <Field
            label="Social circle defaulted at 30 days?"
            value={data.DEF_30_CNT_SOCIAL_CIRCLE}
          />
          <Field
            label="Social circle defaulted at 60 days?"
            value={data.DEF_60_CNT_SOCIAL_CIRCLE}
          />
        </Row>
      </div>
    </div>
  );
};

export default RecordPage;
