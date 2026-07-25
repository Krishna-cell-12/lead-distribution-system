'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';

// ─── Types ────────────────────────────────────────────────────────────────────
type FormState = {
  name: string;
  email: string;
  budget: string;
  message: string;
};

type FieldErrors = Partial<Record<keyof FormState, string>>;

// ─── Client-side validation (mirrors server-side rules) ───────────────────────
function validate(data: FormState): FieldErrors {
  const errors: FieldErrors = {};
  if (!data.name.trim() || data.name.trim().length < 2) {
    errors.name = 'Please enter your full name (at least 2 characters).';
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!data.email.trim() || !emailRegex.test(data.email.trim())) {
    errors.email = 'Please enter a valid email address.';
  }
  if (!data.budget) {
    errors.budget = 'Please select a budget range.';
  }
  if (!data.message.trim() || data.message.trim().length < 10) {
    errors.message = 'Please describe your project (at least 10 characters).';
  }
  return errors;
}

const BUDGET_OPTIONS = [
  { value: '', label: 'Select your budget range…' },
  { value: 'under_500', label: 'Under $500' },
  { value: '500_2000', label: '$500 – $2,000' },
  { value: '2000_10000', label: '$2,000 – $10,000' },
  { value: '10000_plus', label: '$10,000+' },
];

// ─── Icons ────────────────────────────────────────────────────────────────────
const CheckIcon = () => (
  <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
  </svg>
);

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const [form, setForm] = useState<FormState>({ name: '', email: '', budget: '', message: '' });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Partial<Record<keyof FormState, boolean>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState('');
  const formRef = useRef<HTMLFormElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const updated = { ...form, [name]: value };
    setForm(updated);
    // Re-validate touched fields on every keystroke for instant feedback
    if (touched[name as keyof FormState]) {
      setErrors(validate(updated));
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    setErrors(validate(form));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Mark all fields touched and validate
    setTouched({ name: true, email: true, budget: true, message: true });
    const validationErrors = validate(form);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setSubmitting(true);
    setServerError('');

    try {
      const res = await fetch('/api/contact-leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.fields) {
          setErrors(data.fields);
        } else {
          setServerError(data.error || 'Something went wrong. Please try again.');
        }
        return;
      }

      setSubmitted(true);
    } catch {
      setServerError('Network error. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="leaddesk-root">
      {/* ── Background ─────────────────────────────────────────────────────── */}
      <div className="ld-bg" aria-hidden="true">
        <div className="ld-bg-orb ld-bg-orb-1" />
        <div className="ld-bg-orb ld-bg-orb-2" />
        <div className="ld-bg-orb ld-bg-orb-3" />
        <div className="ld-bg-grid" />
      </div>

      {/* ── Navbar ─────────────────────────────────────────────────────────── */}
      <header className="ld-navbar">
        <div className="ld-navbar-inner">
          <div className="ld-logo">
            <span className="ld-logo-icon">LD</span>
            <span className="ld-logo-text">LeadDesk</span>
            <span className="ld-logo-badge">Mini</span>
          </div>
          <nav className="ld-nav-links">
            <a href="#features" className="ld-nav-link">Features</a>
            <a href="#form" className="ld-nav-link">Get Started</a>
            <Link href="/admin" className="ld-btn ld-btn-ghost ld-btn-sm">Admin →</Link>
          </nav>
        </div>
      </header>

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <main>
        <section className="ld-hero">
          <div className="ld-container">
            <div className="ld-hero-badge">
              <span className="ld-pulse-dot" />
              Capturing leads in real-time
            </div>
            <h1 className="ld-hero-title">
              Turn visitors into<br />
              <span className="ld-gradient-text">qualified leads</span>
            </h1>
            <p className="ld-hero-subtitle">
              LeadDesk Mini captures your project inquiries, stores them securely,
              and lets your team track every conversation from first touch to close.
            </p>
            <a href="#form" className="ld-btn ld-btn-primary ld-btn-lg">
              Submit Your Project Brief
              <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18" style={{display:'inline',marginLeft:8}}>
                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </a>
          </div>
        </section>

        {/* ── Features ───────────────────────────────────────────────────────── */}
        <section id="features" className="ld-features-section">
          <div className="ld-container">
            <div className="ld-features-grid">
              <div className="ld-feature-card">
                <div className="ld-feature-icon" style={{'--icon-color':'#60a5fa'} as React.CSSProperties}>🎯</div>
                <h3 className="ld-feature-title">Smart Capture</h3>
                <p className="ld-feature-desc">Full client-side and server-side validation ensures every lead is clean and complete before it hits the database.</p>
              </div>
              <div className="ld-feature-card">
                <div className="ld-feature-icon" style={{'--icon-color':'#a78bfa'} as React.CSSProperties}>🗄️</div>
                <h3 className="ld-feature-title">PostgreSQL Backed</h3>
                <p className="ld-feature-desc">Every submission is persisted to a production-grade PostgreSQL database via Prisma ORM, with zero data loss.</p>
              </div>
              <div className="ld-feature-card">
                <div className="ld-feature-icon" style={{'--icon-color':'#34d399'} as React.CSSProperties}>📊</div>
                <h3 className="ld-feature-title">Admin Pipeline</h3>
                <p className="ld-feature-desc">Your team tracks every lead through New → Contacted → Closed with a single click in the admin dashboard.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Lead Form ──────────────────────────────────────────────────────── */}
        <section id="form" className="ld-form-section">
          <div className="ld-container ld-container-narrow">
            {submitted ? (
              /* ── Success State ──────────────────────────────────────────── */
              <div className="ld-success-card" role="alert" aria-live="polite">
                <div className="ld-success-icon">
                  <CheckIcon />
                </div>
                <h2 className="ld-success-title">You're in! 🎉</h2>
                <p className="ld-success-subtitle">
                  We've received your project brief and our team will be in touch within 24 hours.
                </p>
                <button
                  onClick={() => { setSubmitted(false); setForm({ name: '', email: '', budget: '', message: '' }); setTouched({}); setErrors({}); }}
                  className="ld-btn ld-btn-primary"
                >
                  Submit Another Brief
                </button>
              </div>
            ) : (
              /* ── Form Card ──────────────────────────────────────────────── */
              <div className="ld-form-card">
                <div className="ld-form-card-header">
                  <h2 className="ld-form-title">Start a Project</h2>
                  <p className="ld-form-subtitle">Tell us about your idea and we'll help you bring it to life.</p>
                </div>

                {serverError && (
                  <div className="ld-server-error" role="alert">
                    <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                    {serverError}
                  </div>
                )}

                <form ref={formRef} onSubmit={handleSubmit} noValidate className="ld-form" id="lead-capture-form">
                  {/* Name */}
                  <div className={`ld-field ${errors.name && touched.name ? 'ld-field-error' : ''}`}>
                    <label htmlFor="ld-name" className="ld-label">Full Name <span className="ld-required">*</span></label>
                    <input
                      id="ld-name"
                      name="name"
                      type="text"
                      autoComplete="name"
                      placeholder="Jane Smith"
                      value={form.name}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className="ld-input"
                      aria-invalid={!!(errors.name && touched.name)}
                      aria-describedby={errors.name && touched.name ? 'ld-name-error' : undefined}
                    />
                    {errors.name && touched.name && (
                      <span id="ld-name-error" className="ld-error-msg" role="alert">{errors.name}</span>
                    )}
                  </div>

                  {/* Email */}
                  <div className={`ld-field ${errors.email && touched.email ? 'ld-field-error' : ''}`}>
                    <label htmlFor="ld-email" className="ld-label">Email Address <span className="ld-required">*</span></label>
                    <input
                      id="ld-email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      placeholder="jane@example.com"
                      value={form.email}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className="ld-input"
                      aria-invalid={!!(errors.email && touched.email)}
                      aria-describedby={errors.email && touched.email ? 'ld-email-error' : undefined}
                    />
                    {errors.email && touched.email && (
                      <span id="ld-email-error" className="ld-error-msg" role="alert">{errors.email}</span>
                    )}
                  </div>

                  {/* Budget */}
                  <div className={`ld-field ${errors.budget && touched.budget ? 'ld-field-error' : ''}`}>
                    <label htmlFor="ld-budget" className="ld-label">Budget Range <span className="ld-required">*</span></label>
                    <div className="ld-select-wrapper">
                      <select
                        id="ld-budget"
                        name="budget"
                        value={form.budget}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        className="ld-select"
                        aria-invalid={!!(errors.budget && touched.budget)}
                        aria-describedby={errors.budget && touched.budget ? 'ld-budget-error' : undefined}
                      >
                        {BUDGET_OPTIONS.map(opt => (
                          <option key={opt.value} value={opt.value} disabled={opt.value === ''}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      <span className="ld-select-arrow">▾</span>
                    </div>
                    {errors.budget && touched.budget && (
                      <span id="ld-budget-error" className="ld-error-msg" role="alert">{errors.budget}</span>
                    )}
                  </div>

                  {/* Message */}
                  <div className={`ld-field ${errors.message && touched.message ? 'ld-field-error' : ''}`}>
                    <label htmlFor="ld-message" className="ld-label">
                      Project Brief <span className="ld-required">*</span>
                      <span className="ld-char-count">{form.message.length} / 1000</span>
                    </label>
                    <textarea
                      id="ld-message"
                      name="message"
                      rows={5}
                      placeholder="Describe your project, goals, timeline, and anything else we should know…"
                      value={form.message}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className="ld-textarea"
                      maxLength={1000}
                      aria-invalid={!!(errors.message && touched.message)}
                      aria-describedby={errors.message && touched.message ? 'ld-message-error' : undefined}
                    />
                    {errors.message && touched.message && (
                      <span id="ld-message-error" className="ld-error-msg" role="alert">{errors.message}</span>
                    )}
                  </div>

                  <button
                    type="submit"
                    id="ld-submit-btn"
                    disabled={submitting}
                    className="ld-btn ld-btn-primary ld-btn-full"
                  >
                    {submitting ? (
                      <><span className="ld-spinner" /> Sending…</>
                    ) : (
                      'Send Project Brief →'
                    )}
                  </button>

                  <p className="ld-privacy-note">
                    🔒 Your information is never shared. We'll only use it to respond to your inquiry.
                  </p>
                </form>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="ld-footer">
        <div className="ld-container">
          <div className="ld-footer-inner">
            <div className="ld-footer-brand">
              <span className="ld-logo-icon ld-logo-icon-sm">LD</span>
              <span className="ld-footer-name">LeadDesk Mini</span>
            </div>
            <p className="ld-footer-credit">
              Built for{' '}
              <a
                href="https://digitalheroesco.com"
                target="_blank"
                rel="noopener noreferrer"
                className="ld-footer-link"
              >
                Digital Heroes Training Task
              </a>
            </p>
            <div className="ld-footer-stack">
              <span>Next.js 16</span>
              <span className="ld-dot">·</span>
              <span>Prisma ORM</span>
              <span className="ld-dot">·</span>
              <span>Neon PostgreSQL</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
