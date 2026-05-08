import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import { CheckCircle, UserCircle } from 'lucide-react';

const Profile = () => {
  const { user, setUser } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const initialCustom = user.profile_picture_url?.startsWith('data:image')
    ? user.profile_picture_url
    : null;
  const [customUploadUrl, setCustomUploadUrl] = useState(initialCustom);

  const presetAvatars = [
    '/avatars/user_default_pfp_picture.jpg',
    ...Array.from({ length: 18 }, (_, i) => `/avatars/avatar/avatar_${i}.png`),
  ];

  const [formData, setFormData] = useState({
    name: user.name || '',
    email: user.email || '',
    password: '', // Kept empty so it only updates if they type a new one
    profile_picture_url:
      user.profile_picture_url || '/avatars/user_default_pfp_picture.jpg',
    phone_number: user.profile?.phone_number || '',

    // Applicant Fields
    gender: user.profile?.gender || '',
    date_of_birth: user.profile?.date_of_birth || '',
    annual_income: user.profile?.annual_income || '',

    // Officer Fields
    position: user.profile?.position || '',
    corporation: user.profile?.corporation || '',
  });

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCustomUploadUrl(reader.result);
        handleChange('profile_picture_url', reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg('');
    try {
      const payload = {
        ...formData,
        annual_income:
          formData.annual_income === ''
            ? null
            : parseFloat(formData.annual_income),
        date_of_birth:
          formData.date_of_birth === '' ? null : formData.date_of_birth,
        gender: formData.gender === '' ? null : formData.gender,
        position: formData.position === '' ? null : formData.position,
        corporation: formData.corporation === '' ? null : formData.corporation,
      };

      // If password is blank, don't send it so we don't accidentally overwrite it
      if (!payload.password) {
        delete payload.password;
      }

      const response = await axios.put(
        'http://127.0.0.1:8000/auth/profile',
        payload,
      );
      setUser(response.data);
      localStorage.setItem('user', JSON.stringify(response.data));
      setSuccessMsg('Profile updated successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (error) {
      alert(
        'Failed to update profile. ' + (error.response?.data?.detail || ''),
      );
    }
    setLoading(false);
  };

  return (
    <div
      className="custom-card p-4 p-md-5 mx-auto slide-down"
      style={{ maxWidth: '800px', marginTop: '2vh' }}
    >
      <div className="d-flex align-items-center mb-4 pb-3 border-bottom">
        <div
          style={{
            width: 48,
            height: 48,
            background: '#e0f2fe',
            borderRadius: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: '1rem',
          }}
        >
          <UserCircle size={24} color="#0284c7" />
        </div>
        <div className="text-start">
          <h4 className="fw-bold m-0" style={{ fontFamily: 'Fraunces, serif' }}>
            Account Settings
          </h4>
          <p className="text-muted-custom small m-0">
            Manage your profile credentials and personal data.
          </p>
        </div>
      </div>

      {successMsg && (
        <div className="alert alert-success d-flex align-items-center gap-2 py-2 px-3 small rounded-3 mb-4">
          <CheckCircle size={18} /> {successMsg}
        </div>
      )}

      <form onSubmit={handleSave}>
        <div className="row">
          <div className="col-12 mb-4 text-start">
            <label className="text-muted-custom small fw-semibold d-block mb-2">
              Profile Picture
            </label>
            <div
              className="d-flex flex-wrap gap-3 align-items-center p-3 bg-light rounded-3 border w-100"
              style={{ maxHeight: '250px', overflowY: 'auto' }}
            >
              {user.role === 'loan_officer' && (
                <div
                  className="position-relative"
                  style={{ width: '56px', height: '56px' }}
                >
                  <input
                    type="file"
                    id="avatarUpload"
                    className="d-none"
                    accept="image/*"
                    onChange={handleFileUpload}
                  />
                  <label
                    htmlFor="avatarUpload"
                    className="d-flex align-items-center justify-content-center m-0"
                    style={{
                      width: '100%',
                      height: '100%',
                      borderRadius: '50%',
                      cursor: 'pointer',
                      border: '2px dashed #94a3b8',
                      backgroundColor: '#f8fafc',
                    }}
                  >
                    <img
                      src="/plus.png"
                      alt="Upload"
                      style={{ width: '24px', height: '24px', opacity: 0.6 }}
                    />
                  </label>
                </div>
              )}
              {customUploadUrl && (
                <img
                  src={customUploadUrl}
                  alt="Custom Upload"
                  onClick={() =>
                    handleChange('profile_picture_url', customUploadUrl)
                  }
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    cursor: 'pointer',
                    border:
                      formData.profile_picture_url === customUploadUrl
                        ? '3px solid var(--color-accent)'
                        : '2px solid transparent',
                    opacity:
                      formData.profile_picture_url === customUploadUrl
                        ? 1
                        : 0.6,
                    transform:
                      formData.profile_picture_url === customUploadUrl
                        ? 'scale(1.1)'
                        : 'scale(1)',
                    transition: 'all 0.2s ease',
                    backgroundColor: 'white',
                  }}
                />
              )}
              {presetAvatars.map((url, idx) => (
                <img
                  key={idx}
                  src={url}
                  alt={`avatar ${idx}`}
                  onClick={() => handleChange('profile_picture_url', url)}
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    cursor: 'pointer',
                    backgroundColor: 'white',
                    border:
                      formData.profile_picture_url === url
                        ? '3px solid var(--color-accent)'
                        : '2px solid transparent',
                    opacity: formData.profile_picture_url === url ? 1 : 0.6,
                    transform:
                      formData.profile_picture_url === url
                        ? 'scale(1.1)'
                        : 'scale(1)',
                    transition: 'all 0.2s ease',
                  }}
                />
              ))}
            </div>
          </div>

          <div className="col-12 mb-2">
            <h6 className="fw-bold text-slate border-bottom pb-2">
              Account Credentials
            </h6>
          </div>

          <div className="col-md-6 mb-3 text-start">
            <label className="text-muted-custom small fw-semibold d-block mb-1">
              Full Name
            </label>
            <input
              type="text"
              className="custom-input w-100 d-block"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              required
            />
          </div>

          <div className="col-md-6 mb-3 text-start">
            <label className="text-muted-custom small fw-semibold d-block mb-1">
              Phone Number
            </label>
            <input
              type="text"
              className="custom-input w-100 d-block"
              placeholder="+1 234 567 8900"
              value={formData.phone_number}
              onChange={(e) => handleChange('phone_number', e.target.value)}
            />
          </div>

          <div className="col-md-6 mb-4 text-start">
            <label className="text-muted-custom small fw-semibold d-block mb-1">
              Email Address
            </label>
            <input
              type="email"
              className="custom-input w-100 d-block"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              required
            />
          </div>

          <div className="col-md-6 mb-4 text-start">
            <label className="text-muted-custom small fw-semibold d-block mb-1">
              New Password
            </label>
            <input
              type="password"
              className="custom-input w-100 d-block"
              placeholder="Leave blank to keep current password"
              value={formData.password}
              onChange={(e) => handleChange('password', e.target.value)}
              minLength="6"
            />
          </div>

          <div className="col-12 mb-2">
            <h6 className="fw-bold text-slate border-bottom pb-2">
              Role Information
            </h6>
          </div>

          {/* DYNAMIC RENDER: Officer vs Applicant */}
          {user.role === 'loan_officer' ? (
            <>
              <div className="col-md-6 mb-4 text-start">
                <label className="text-muted-custom small fw-semibold d-block mb-1">
                  Job Position / Title
                </label>
                <input
                  type="text"
                  className="custom-input w-100 d-block"
                  placeholder="e.g. Senior Loan Officer"
                  value={formData.position}
                  onChange={(e) => handleChange('position', e.target.value)}
                />
              </div>
              <div className="col-md-6 mb-4 text-start">
                <label className="text-muted-custom small fw-semibold d-block mb-1">
                  Corporation / Institute Name
                </label>
                <input
                  type="text"
                  className="custom-input w-100 d-block"
                  placeholder="e.g. Global Finance Bank"
                  value={formData.corporation}
                  onChange={(e) => handleChange('corporation', e.target.value)}
                />
              </div>
            </>
          ) : (
            <>
              <div className="col-md-4 mb-4 text-start">
                <label className="text-muted-custom small fw-semibold d-block mb-1">
                  Gender
                </label>
                <select
                  className="custom-input w-100 d-block"
                  value={formData.gender}
                  onChange={(e) => handleChange('gender', e.target.value)}
                >
                  <option value="">Select...</option>
                  <option value="M">Male</option>
                  <option value="F">Female</option>
                </select>
              </div>
              <div className="col-md-4 mb-4 text-start">
                <label className="text-muted-custom small fw-semibold d-block mb-1">
                  Date of Birth
                </label>
                <input
                  type="date"
                  className="custom-input w-100 d-block"
                  value={formData.date_of_birth}
                  onChange={(e) =>
                    handleChange('date_of_birth', e.target.value)
                  }
                />
              </div>
              <div className="col-md-4 mb-4 text-start">
                <label className="text-muted-custom small fw-semibold d-block mb-1">
                  Annual Income (USD)
                </label>
                <input
                  type="number"
                  className="custom-input w-100 d-block"
                  placeholder="e.g. 50000"
                  value={formData.annual_income}
                  onChange={(e) =>
                    handleChange('annual_income', e.target.value)
                  }
                />
              </div>
            </>
          )}
        </div>

        <button type="submit" className="btn btn-cta w-100" disabled={loading}>
          {loading ? 'Saving...' : 'Save Profile Changes'}
        </button>
      </form>
    </div>
  );
};

export default Profile;
