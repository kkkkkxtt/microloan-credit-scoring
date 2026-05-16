import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import {
  ArrowRight,
  Sparkles,
  Zap,
  ShieldCheck,
  BarChart2,
  Info,
  CheckCircle2,
} from 'lucide-react';

const MainPage = ({ onLoginClick }) => {
  return (
    <div
      style={{
        backgroundColor: '#f8fafc',
        minHeight: '100vh',
        paddingBottom: '4rem',
      }}
    >
      {/* Navbar */}
      <Container className="pt-4 pb-2">
        <div className="d-flex justify-content-between align-items-center mb-5 slide-down">
          <div className="brand-logo" style={{ width: '500px' }}>
            <div className="brand-logo-mark">C</div>
            <div>
              <p className="brand-name">Credify</p>
              <p className="brand-tagline">
                Microloan Credit Scoring Classification Platform
              </p>
            </div>
          </div>
          <button
            className="btn btn-outline-dark fw-bold rounded-pill px-4"
            onClick={onLoginClick}
          >
            Login / Register
          </button>
        </div>
      </Container>

      <Container style={{ maxWidth: '1000px' }}>
        {/* Hero Section */}
        <div className="home-hero mb-5 slide-down text-center p-5">
          <div className="hero-eyebrow justify-content-center mx-auto mb-3">
            <Sparkles size={14} /> ML-Powered Credit Scoring
          </div>
          <h1
            className="fw-bold text-slate mb-4"
            style={{ fontSize: '3rem', fontFamily: 'Fraunces, serif' }}
          >
            Fast, fair credit decisions
            <br />
            you can <em className="text-emerald">understand</em>
          </h1>
          <p
            className="text-muted-custom mb-5 mx-auto"
            style={{ maxWidth: '600px', fontSize: '1.1rem' }}
          >
            Credify uses advanced Machine Learning to assess microloan
            applications in minutes — giving you a transparent decision with a
            clear explanation of the factors that shaped it.
          </p>
          <button
            className="btn btn-cta px-5 py-3 fs-5 rounded-pill shadow"
            onClick={onLoginClick}
          >
            Apply for a Microloan <ArrowRight size={20} className="ms-2" />
          </button>
        </div>

        {/* How It Works & Explanations */}
        <Row className="mb-5 g-4 slide-down" style={{ animationDelay: '0.1s' }}>
          <Col md={6}>
            <div className="custom-card p-4 h-100 border-0 shadow-sm">
              <h5 className="fw-bold text-slate mb-3 d-flex align-items-center gap-2">
                <Info size={20} color="var(--color-accent)" /> What is a
                Microloan?
              </h5>
              <p className="text-muted-custom small">
                Microloans are small, short-term loans designed to help
                individuals and small businesses who may not have access to
                traditional banking services. They are crucial for fostering
                financial inclusion and entrepreneurship in developing
                communities.
              </p>
            </div>
          </Col>
          <Col md={6}>
            <div className="custom-card p-4 h-100 border-0 shadow-sm">
              <h5 className="fw-bold text-slate mb-3 d-flex align-items-center gap-2">
                <BarChart2 size={20} color="var(--color-accent)" /> How It
                Works?
              </h5>
              <p className="text-muted-custom small">
                Our platform uses highly trained Classification Machine Learning
                Models to evaluate applicant data. Instead of a simple "yes" or
                "no", our system calculates a precise Probability of Default,
                assessing socio-economic factors to determine creditworthiness
                accurately.
              </p>
            </div>
          </Col>
        </Row>

        {/* Feature Grid */}
        <h4 className="fw-bold text-center text-slate mb-4 mt-5 pt-3">
          Why Choose Credify?
        </h4>
        <div className="feature-grid mb-5">
          <div className="feature-card bg-white shadow-sm border-0">
            <div className="fc-icon bg-success bg-opacity-10 text-success">
              <Zap size={20} />
            </div>
            <div className="fc-title">Instant Results</div>
            <div className="fc-desc">
              Get a credit decision in seconds, bypassing traditional waiting
              periods.
            </div>
          </div>
          <div className="feature-card bg-white shadow-sm border-0">
            <div className="fc-icon bg-primary bg-opacity-10 text-primary">
              <ShieldCheck size={20} />
            </div>
            <div className="fc-title">Explainable AI (XAI)</div>
            <div className="fc-desc">
              Understand exactly why a decision was made with transparent
              Shapley values.
            </div>
          </div>
          <div className="feature-card bg-white shadow-sm border-0">
            <div className="fc-icon bg-warning bg-opacity-10 text-warning">
              <CheckCircle2 size={20} />
            </div>
            <div className="fc-title">Human Oversight</div>
            <div className="fc-desc">
              Every AI decision is securely verified by the dedicated Loan
              Officer panel.
            </div>
          </div>
        </div>

        {/* About Box */}
        <div className="about-box shadow-sm border-0 text-center p-5">
          <h5 className="fw-bold text-slate mb-3">About Credify</h5>
          <p
            className="text-muted-custom m-0 mx-auto"
            style={{ maxWidth: '700px' }}
          >
            We believe everyone deserves to know their creditworthiness and the
            reasons behind it. Credify bridges the gap between complex
            artificial intelligence and accessible, fair financial tools.
          </p>
        </div>
      </Container>
    </div>
  );
};

export default MainPage;
