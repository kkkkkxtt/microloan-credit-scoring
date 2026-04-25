import React, { useState, useEffect, useRef } from 'react';
import { Form, Row, Col, Modal, Alert } from 'react-bootstrap';
import {
  ChevronRight,
  ChevronLeft,
  AlertTriangle,
  Fingerprint,
} from 'lucide-react';
import { getLatestId } from '../services/api';

const CreditForm = ({ onSubmit, onCancel }) => {
  const [step, setStep] = useState(1);
  const [showDiscard, setShowDiscard] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState({});
  const [toastMsg, setToastMsg] = useState('');

  const sectionRefs = useRef([]);

  const [formData, setFormData] = useState({
    applicant_ic: '',
    CODE_GENDER: '',
    birth_date: '',
    NAME_EDUCATION_TYPE: 'Secondary / secondary special',
    NAME_FAMILY_STATUS: 'Married',
    CNT_CHILDREN: 0,
    CNT_FAM_MEMBERS: 1,

    FLAG_EMAIL: '0',
    FLAG_MOBIL: '1',
    FLAG_EMP_PHONE: '0',
    FLAG_WORK_PHONE: '0',
    FLAG_PHONE: '0',
    FLAG_CONT_MOBILE: '1',
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
    AMT_INCOME_TOTAL: '',
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

  useEffect(() => {
    const fetchId = async () => {
      try {
        const res = await getLatestId();
        setFormData((prev) => ({
          ...prev,
          applicant_ic: res.latest_id.toString(),
        }));
      } catch (err) {
        setFormData((prev) => ({ ...prev, applicant_ic: '100001' }));
      }
    };
    fetchId();
  }, []);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 2000);
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const validateStep = (currentStep) => {
    return { isValid: true, isAutoRejected: false };
  };

  const handleNext = () => {
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
            backgroundColor: '#ef4444',
            color: 'white',
            padding: '14px 28px',
            borderRadius: '12px',
            zIndex: 9999,
            fontWeight: '600',
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <AlertTriangle size={20} />
          {toastMsg}
        </div>
      )}

      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold text-slate m-0">Credit Application</h2>
        <button
          className="btn btn-link text-danger text-decoration-none fw-semibold"
          onClick={() => setShowDiscard(true)}
        >
          Cancel Application
        </button>
      </div>

      <div className="bg-light p-3 rounded-4 mb-4 d-flex align-items-center gap-3 border">
        <Fingerprint size={24} className="text-muted-custom" />
        <div>
          <span className="text-muted-custom small fw-bold d-block">
            Application ID
          </span>
          <span className="fw-bold text-slate fs-5">
            {formData.applicant_ic}
          </span>
        </div>
        <div className="ms-auto text-muted-custom small text-end">
          *Please save this ID to check your record history later.
        </div>
      </div>

      <div className="custom-card p-4 p-md-5 mb-4 shadow-sm">
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
                  <div className="bg-light p-3 rounded border">
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
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-4">
                  <Form.Label className="text-muted-custom small fw-semibold">
                    Maintenance fund structure?
                  </Form.Label>
                  <Form.Select
                    className="custom-input"
                    value={formData.FONDKAPREMONT_MODE}
                    onChange={(e) =>
                      handleChange('FONDKAPREMONT_MODE', e.target.value)
                    }
                  >
                    <option value="reg oper account">
                      Regular Operations Account
                    </option>
                    <option value="org spec account">
                      Org Specific Account
                    </option>
                    <option value="reg oper spec account">
                      Reg Oper Spec Account
                    </option>
                    <option value="not specified">Not Specified</option>
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
                <div className="bg-light p-3 rounded-3 mb-4 d-flex flex-column gap-2">
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
                    ].map((org) => (
                      <option key={org} value={org} />
                    ))}
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
              className="btn btn-outline-secondary d-flex align-items-center rounded-pill px-3 fw-semibold"
              onClick={handleBack}
              style={{ borderColor: '#cbd5e1', color: '#475569' }}
            >
              <ChevronLeft size={18} className="me-1" /> Back
            </button>
          )}
        </div>
        <div className="text-center" style={{ flex: 1 }}>
          <span className="text-muted-custom fw-semibold">
            Progress: {step}/6
          </span>
        </div>
        <div className="text-end" style={{ flex: 1 }}>
          <button
            className="btn btn-dark-custom d-inline-flex align-items-center"
            onClick={handleNext}
          >
            {step === 6 ? 'Submit Application' : 'Continue to Next Section'}{' '}
            <ChevronRight size={18} className="ms-1" />
          </button>
        </div>
      </div>

      <Modal show={showDiscard} onHide={() => setShowDiscard(false)} centered>
        <Modal.Body className="p-4 text-center">
          <h4 className="fw-bold mb-3">Discard Application?</h4>
          <p className="text-muted-custom mb-4">
            Your progress will be lost. Are you sure you want to exit?
          </p>
          <div className="d-flex gap-2 justify-content-center">
            <button
              className="btn btn-light custom-input"
              onClick={() => setShowDiscard(false)}
            >
              Cancel
            </button>
            <button
              className="btn btn-danger custom-input"
              style={{ background: '#ef4444', color: 'white', border: 'none' }}
              onClick={onCancel}
            >
              Yes, Discard
            </button>
          </div>
        </Modal.Body>
      </Modal>

      <Modal show={showConfirm} onHide={() => setShowConfirm(false)} centered>
        <Modal.Body className="p-4 text-center">
          <h4 className="fw-bold mb-3">Ready to Submit?</h4>
          <p className="text-muted-custom mb-4">
            Our AI will now analyze your creditworthiness based on this data.
          </p>
          <div className="d-flex gap-2 justify-content-center">
            <button
              className="btn btn-light custom-input"
              onClick={() => setShowConfirm(false)}
            >
              Review Again
            </button>
            <button className="btn btn-dark-custom" onClick={executeSubmit}>
              Confirm & Predict
            </button>
          </div>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default CreditForm;
