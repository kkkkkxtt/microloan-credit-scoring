import React from 'react';
import { Form, Row, Col, Alert } from 'react-bootstrap';
import { AlertTriangle } from 'lucide-react';

const CreditFormApplication = ({
  step,
  formData,
  errors,
  handleChange,
  sectionRefs,
  ORG_FRIENDLY_MAP,
}) => {
  return (
    <div className="custom-card p-4 p-md-5 mb-4">
      {/* ══════════════════════════════════════════
          STEP 1 – Personal Demographics
      ══════════════════════════════════════════ */}
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
            {/* Gender */}
            <Col md={12}>
              <Form.Group className="mb-4">
                <Form.Label className="text-muted-custom small fw-semibold d-block">
                  What is your gender?
                </Form.Label>
                <div className="d-flex gap-3">
                  {['M', 'F'].map((g) => (
                    <button
                      key={g}
                      type="button"
                      className={`gender-btn ${formData.CODE_GENDER === g ? 'active' : ''}`}
                      onClick={() => handleChange('CODE_GENDER', g)}
                    >
                      {g === 'M' ? 'Male' : 'Female'}
                    </button>
                  ))}
                </div>
                {errors.CODE_GENDER && (
                  <div className="text-danger small mt-2 pt-1">
                    {errors.CODE_GENDER}
                  </div>
                )}
              </Form.Group>
            </Col>

            {/* Date of Birth */}
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

            {/* Marital status */}
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

            {/* Education */}
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

            {/* Children */}
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
                  onChange={(e) => handleChange('CNT_CHILDREN', e.target.value)}
                />
                {errors.CNT_CHILDREN && (
                  <div className="text-danger small mt-2 pt-1">
                    {errors.CNT_CHILDREN}
                  </div>
                )}
              </Form.Group>
            </Col>

            {/* Household members */}
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

      {/* ══════════════════════════════════════════
          STEP 2 – Contact & Assets
      ══════════════════════════════════════════ */}
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
                  onChange={(e) => handleChange('FLAG_OWN_CAR', e.target.value)}
                >
                  <option value="Y">Yes</option>
                  <option value="N">No</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-4">
                <Form.Label className="text-muted-custom small fw-semibold">
                  If yes, how old is your car (years)?
                </Form.Label>
                <Form.Control
                  className="custom-input"
                  type="number"
                  min="0"
                  disabled={formData.FLAG_OWN_CAR === 'N'}
                  value={formData.OWN_CAR_AGE}
                  onChange={(e) => handleChange('OWN_CAR_AGE', e.target.value)}
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
                Which contact details can you provide? (Check all that apply)
              </Form.Label>
              <div className="d-flex flex-wrap gap-4 mb-4">
                {[
                  { label: 'Email Address', field: 'FLAG_EMAIL' },
                  { label: 'Mobile Phone', field: 'FLAG_MOBIL' },
                  { label: 'Employer Phone', field: 'FLAG_EMP_PHONE' },
                  { label: 'Work Phone', field: 'FLAG_WORK_PHONE' },
                  { label: 'Home Phone', field: 'FLAG_PHONE' },
                  {
                    label: 'My mobile is reachable',
                    field: 'FLAG_CONT_MOBILE',
                  },
                ].map(({ label, field }) => (
                  <Form.Check
                    key={field}
                    type="checkbox"
                    label={label}
                    checked={formData[field] === '1'}
                    onChange={(e) =>
                      handleChange(field, e.target.checked ? '1' : '0')
                    }
                  />
                ))}
              </div>
            </Col>
          </Row>
        </div>
      )}

      {/* ══════════════════════════════════════════
          STEP 3 – Housing & Geography
      ══════════════════════════════════════════ */}
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
                        const updated = e.target.checked
                          ? [...formData.WALLSMATERIAL_MODE, material]
                          : formData.WALLSMATERIAL_MODE.filter(
                              (x) => x !== material,
                            );
                        handleChange('WALLSMATERIAL_MODE', updated);
                      }}
                    />
                  ))}
                </div>
                {errors.WALLSMATERIAL_MODE && (
                  <div className="text-danger small mt-2 pt-1">
                    {errors.WALLSMATERIAL_MODE}
                  </div>
                )}
              </Form.Group>
            </Col>
            <Col md={6} className="mb-4">
              <Form.Group>
                <Form.Label className="fw-semibold text-slate">
                  How are building maintenance and repair funds managed?
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
                    Specific Organization (e.g. Housing Authority)
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
                Geographic Declarations (Check all that apply)
              </Form.Label>
              <div
                style={{
                  background: 'var(--color-surface-2)',
                  border: '1px solid var(--color-border-light)',
                  borderRadius: 'var(--radius-sm)',
                }}
                className="p-3 mb-4 d-flex flex-column gap-2"
              >
                {[
                  {
                    label: 'My permanent city does NOT match my contact city.',
                    field: 'REG_CITY_NOT_LIVE_CITY',
                  },
                  {
                    label: 'My permanent city does NOT match my work city.',
                    field: 'REG_CITY_NOT_WORK_CITY',
                  },
                  {
                    label:
                      'My permanent region does NOT match my contact region.',
                    field: 'REG_REGION_NOT_LIVE_REGION',
                  },
                  {
                    label: 'My permanent region does NOT match my work region.',
                    field: 'REG_REGION_NOT_WORK_REGION',
                  },
                  {
                    label: 'My contact city does NOT match my work city.',
                    field: 'LIVE_CITY_NOT_WORK_CITY',
                  },
                  {
                    label: 'My contact region does NOT match my work region.',
                    field: 'LIVE_REGION_NOT_WORK_REGION',
                  },
                ].map(({ label, field }) => (
                  <Form.Check
                    key={field}
                    type="checkbox"
                    label={label}
                    checked={formData[field] === '1'}
                    onChange={(e) =>
                      handleChange(field, e.target.checked ? '1' : '0')
                    }
                  />
                ))}
              </div>
            </Col>
          </Row>
        </div>
      )}

      {/* ══════════════════════════════════════════
          STEP 4 – Employment & Income
      ══════════════════════════════════════════ */}
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
                  {[
                    'Businessman',
                    'Commercial associate',
                    'Maternity leave',
                    'Pensioner',
                    'State servant',
                    'Student',
                    'Unemployed',
                    'Working',
                  ].map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
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
                  disabled={['Pensioner', 'Unemployed', 'Student'].includes(
                    formData.NAME_INCOME_TYPE,
                  )}
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
                  className={`custom-input ${errors.OCCUPATION_TYPE ? 'is-invalid' : ''}`}
                  disabled={['Pensioner', 'Unemployed', 'Student'].includes(
                    formData.NAME_INCOME_TYPE,
                  )}
                  value={formData.OCCUPATION_TYPE}
                  onChange={(e) =>
                    handleChange('OCCUPATION_TYPE', e.target.value)
                  }
                />
                <datalist id="occupation-options">
                  {[
                    'Accountants',
                    'Cleaning staff',
                    'Cooking staff',
                    'Core staff',
                    'Drivers',
                    'HR staff',
                    'High skill tech staff',
                    'IT staff',
                    'Laborers',
                    'Low-skill Laborers',
                    'Managers',
                    'Medicine staff',
                    'Private service staff',
                    'Realty agents',
                    'Sales staff',
                    'Secretaries',
                    'Security staff',
                    'Waiters/barmen staff',
                  ].map((o) => (
                    <option key={o} value={o} />
                  ))}
                </datalist>
                {errors.OCCUPATION_TYPE && (
                  <div className="text-danger small mt-1 fw-semibold">
                    {errors.OCCUPATION_TYPE}
                  </div>
                )}
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-4">
                <Form.Label className="text-muted-custom small fw-semibold">
                  Industry / Organization Type (Search)
                </Form.Label>
                <Form.Control
                  list="org-options"
                  className={`custom-input ${errors.ORGANIZATION_TYPE ? 'is-invalid' : ''}`}
                  disabled={['Pensioner', 'Unemployed', 'Student'].includes(
                    formData.NAME_INCOME_TYPE,
                  )}
                  value={formData.ORGANIZATION_TYPE}
                  onChange={(e) =>
                    handleChange('ORGANIZATION_TYPE', e.target.value)
                  }
                />
                <datalist id="org-options">
                  {Object.keys(ORG_FRIENDLY_MAP)
                    .concat([
                      'Advertising',
                      'Agriculture',
                      'Bank',
                      'Cleaning',
                      'Construction',
                      'Culture',
                      'Electricity',
                      'Emergency',
                      'Government',
                      'Hotel',
                      'Housing',
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
                      'University',
                    ])
                    .map((org) => {
                      const friendly = ORG_FRIENDLY_MAP[org];
                      return (
                        <option
                          key={org}
                          value={friendly ? `${friendly} (${org})` : org}
                        />
                      );
                    })}
                </datalist>
                {errors.ORGANIZATION_TYPE && (
                  <div className="text-danger small mt-1 fw-semibold">
                    {errors.ORGANIZATION_TYPE}
                  </div>
                )}
              </Form.Group>
            </Col>
          </Row>
        </div>
      )}

      {/* ══════════════════════════════════════════
          STEP 5 – Loan Details
      ══════════════════════════════════════════ */}
      {step >= 5 && (
        <div
          className="form-section slide-down mt-5"
          ref={(el) => (sectionRefs.current[4] = el)}
        >
          <div className="d-flex align-items-center mb-4">
            <div className="step-circle">5</div>
            <h4 className="fw-bold text-slate m-0">Loan Details</h4>
          </div>

          {/* FIX: Render ALL relevant Step 5 Auto-Rejects prominently in the banner */}
          {errors.AMT_CREDIT && errors.AMT_CREDIT.includes('AUTO-REJECT') && (
            <Alert variant="danger">
              <AlertTriangle size={18} className="me-2" />
              {errors.AMT_CREDIT}
            </Alert>
          )}
          {errors.AMT_ANNUITY && errors.AMT_ANNUITY.includes('AUTO-REJECT') && (
            <Alert variant="danger">
              <AlertTriangle size={18} className="me-2" />
              {errors.AMT_ANNUITY}
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
                {/* FIX: Always render AMT_CREDIT error text below the field, even if it's an auto-reject */}
                {errors.AMT_CREDIT && (
                  <div className="text-danger small mt-2 pt-1 fw-semibold">
                    {errors.AMT_CREDIT}
                  </div>
                )}
                {/* FIX: Render the recommendation below the field */}
                {errors.LOAN_REC && (
                  <div
                    className="small mt-2 pt-1 fw-semibold d-flex align-items-start"
                    style={{ color: '#e6d85c' }}
                  >
                    {' '}
                    {errors.LOAN_REC}
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
                  onChange={(e) => handleChange('AMT_ANNUITY', e.target.value)}
                />
                {errors.AMT_ANNUITY && (
                  <div className="text-danger small mt-2 pt-1 fw-semibold">
                    {errors.AMT_ANNUITY}
                  </div>
                )}
                {/* FIX: Render the recommendation below the field */}
                {errors.LOAN_REC && (
                  <div
                    className="small mt-2 pt-1 fw-semibold d-flex align-items-start"
                    style={{ color: '#e6d85c' }}
                  >
                    {' '}
                    {errors.LOAN_REC}
                  </div>
                )}
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group className="mb-4">
                <Form.Label className="text-muted-custom small fw-semibold">
                  If purchasing a specific item, what is the item's price?
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

      {/* ══════════════════════════════════════════
          STEP 6 – Final Declarations
      ══════════════════════════════════════════ */}
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
                  How many of those people actually defaulted at 30 days?
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
                  How many of those people actually defaulted at 60 days?
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
  );
};

export default CreditFormApplication;
