import React from 'react';
import {
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Target,
  Zap,
  Clock,
} from 'lucide-react';

/**
 * ApplicantDashboard
 * Shown when homeTab === 'apply' for an applicant user.
 * Props:
 *   onStartApplication – callback to navigate to the form view
 */
const ApplicantDashboard = ({ onStartApplication }) => {
  const features = [
    {
      icon: <Zap size={18} />,
      title: 'Instant Decision',
      desc: 'AI-powered analysis in seconds',
    },
    {
      icon: <Target size={18} />,
      title: 'Fair & Objective',
      desc: 'Data-driven decisions to minimize bias',
    },
    {
      icon: <Sparkles size={18} />,
      title: 'Explainable AI',
      desc: 'Transparent scoring breakdown',
    },
    {
      icon: <Clock size={18} />,
      title: '6-Step Process',
      desc: 'Simple guided application',
    },
  ];

  return (
    <div className="applicant-dashboard fade-in">
      <div className="dash-hero-card">
        <div className="dash-blob dash-blob--tr" />
        <div className="dash-blob dash-blob--bl" />

        <div className="dash-hero-inner">
          <div className="dash-hero-copy">
            <h1 className="dash-hero-title">
              Ready to start your <em>assessment?</em>
            </h1>

            <p className="dash-hero-desc">
              Fill out our secure, streamlined application form. Our Explainable
              AI will analyse your financial profile and provide a transparent
              decision in seconds.
            </p>

            <button
              className="btn btn-cta dash-cta-btn"
              onClick={onStartApplication}
            >
              Start Application <ArrowRight size={18} />
            </button>
          </div>

          {/* Right: feature grid */}
          <div className="dash-feature-grid">
            {features.map((f) => (
              <div key={f.title} className="dash-feature-tile">
                <div className="dash-feature-icon">{f.icon}</div>
                <p className="dash-feature-title">{f.title}</p>
                <p className="dash-feature-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom info strip */}
        <div className="dash-info-strip">
          <ShieldCheck size={15} />
          <span>
            Please save your Application ID after submission to track your
            record.
          </span>
        </div>
      </div>
    </div>
  );
};

export default ApplicantDashboard;
