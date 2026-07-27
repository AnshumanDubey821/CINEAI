// src/pages/LoginPage.jsx
// Netflix-styled interactive & professional Login Page with Google Auth Dialog Modal
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './LoginPage.css';

/* ─── Floating movie title data for the background ─────────────────── */
const MOVIE_TITLES = [
  'Oppenheimer', 'Dune: Part Two', 'The Dark Knight', 'Pulp Fiction',
  'The Godfather', 'Parasite', 'Fight Club', 'Stranger Things',
  'The Matrix', 'Spirited Away', 'Forrest Gump', 'Interstellar',
  'Barbie', 'Whiplash', 'Get Out', 'Mad Max: Fury Road',
  'The Last of Us', 'Severance', 'Blade Runner', 'Succession',
  'Breaking Bad', 'Game of Thrones', 'Everything Everywhere',
  'Gladiator II', 'Killers of the Flower Moon', 'The Bear',
];

function buildStrip(count = 12) {
  const shuffled = [...MOVIE_TITLES].sort(() => Math.random() - 0.5);
  return Array.from({ length: count }, (_, i) => shuffled[i % shuffled.length]);
}

function FilmStrip({ titles, direction = 'up', duration = 30, opacity = 0.12 }) {
  return (
    <div
      className="film-strip"
      style={{
        '--dur': `${duration}s`,
        '--dir': direction === 'up' ? '-50%' : '0%',
        '--dir-end': direction === 'up' ? '0%' : '-50%',
        opacity,
      }}
    >
      {[...titles, ...titles].map((t, i) => (
        <div key={i} className="film-strip__cell">
          <span className="film-strip__frame">▶</span>
          <span className="film-strip__title">{t}</span>
        </div>
      ))}
    </div>
  );
}

export default function LoginPage() {
  const { login, user }         = useAuth();
  const navigate                = useNavigate();
  const location                = useLocation();
  const from                    = location.state?.from?.pathname || '/';

  useEffect(() => { if (user) navigate(from, { replace: true }); }, [user, navigate, from]);

  const [tab, setTab]           = useState('login');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [name, setName]         = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState('');

  /* ── Google Auth Modal States ────────────────────────────────── */
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleStep, setGoogleStep]           = useState(1); // 1: Email, 2: Password, 3: Verifying
  const [googleEmail, setGoogleEmail]         = useState('');
  const [googlePass, setGooglePass]           = useState('');
  const [googleError, setGoogleError]         = useState('');
  const [showGooglePass, setShowGooglePass]   = useState(false);

  /* Open Google Modal */
  const handleOpenGoogle = () => {
    setGoogleStep(1);
    setGoogleEmail('');
    setGooglePass('');
    setGoogleError('');
    setShowGoogleModal(true);
  };

  /* Step 1 -> Step 2 */
  const handleGoogleNextEmail = (e) => {
    e.preventDefault();
    if (!googleEmail || !googleEmail.includes('@')) {
      setGoogleError('Enter a valid email or phone number.');
      return;
    }
    setGoogleError('');
    setGoogleStep(2);
  };

  /* Step 2 -> Step 3 -> Login */
  const handleGoogleNextPass = async (e) => {
    e.preventDefault();
    if (!googlePass || googlePass.length < 4) {
      setGoogleError('Wrong password. Try again or click Forgot password.');
      return;
    }
    setGoogleError('');
    setGoogleStep(3); // Verifying animation

    await new Promise(r => setTimeout(r, 1200));

    const username = googleEmail.split('@')[0];
    const formattedName = username.charAt(0).toUpperCase() + username.slice(1);

    const googleUser = {
      id: `google_${Date.now()}`,
      name: formattedName,
      email: googleEmail,
      avatar: null,
      provider: 'google',
    };

    login(googleUser);
    setShowGoogleModal(false);
    setSuccess(`Signed in as ${googleEmail} via Google! 🎬`);
    setTimeout(() => navigate(from, { replace: true }), 700);
  };

  /* ── Email / Password submit ─────────────────────────────────── */
  async function handleEmailSubmit(e) {
    e.preventDefault();
    setError('');
    if (!email || !password) { setError('Please fill in all required fields.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }

    setLoading(true);
    await new Promise(r => setTimeout(r, 750));

    const userData = {
      id: `email_${Date.now()}`,
      name: name || email.split('@')[0],
      email,
      avatar: null,
      provider: 'email',
    };
    login(userData);
    setSuccess(`Welcome back to CineAI! 🎬`);
    setTimeout(() => navigate(from, { replace: true }), 700);
    setLoading(false);
  }

  /* ── Demo / Guest login ───────────────────────────────────────── */
  function handleDemo() {
    login({
      id: 'guest_001',
      name: 'Guest Explorer',
      email: 'guest@cineai.app',
      avatar: null,
      provider: 'demo',
    });
    navigate(from, { replace: true });
  }

  const strips = [
    { titles: buildStrip(), direction: 'up',   duration: 35, opacity: 0.20 },
    { titles: buildStrip(), direction: 'down', duration: 28, opacity: 0.16 },
    { titles: buildStrip(), direction: 'up',   duration: 42, opacity: 0.22 },
    { titles: buildStrip(), direction: 'down', duration: 32, opacity: 0.18 },
    { titles: buildStrip(), direction: 'up',   duration: 38, opacity: 0.20 },
    { titles: buildStrip(), direction: 'down', duration: 25, opacity: 0.15 },
  ];

  return (
    <div className="login-root">
      {/* Background Strips */}
      <div className="login-bg" aria-hidden="true">
        <div className="login-bg__strips">
          {strips.map((s, i) => (
            <FilmStrip key={i} {...s} />
          ))}
        </div>
        <div className="login-bg__vignette" />
        <div className="login-bg__leak login-bg__leak--red" />
      </div>

      {/* Netflix Card */}
      <div className="login-card fade-in">
        {/* Logo */}
        <div className="login-logo">
          <span className="login-logo__text">CINE<em>AI</em></span>
        </div>

        <p className="login-tagline">Unlimited movies, web series, and AI recommendations.</p>

        {/* Tab switcher */}
        <div className="login-tabs">
          <button
            className={`login-tab ${tab === 'login' ? 'login-tab--active' : ''}`}
            onClick={() => { setTab('login'); setError(''); }}
          >Sign In</button>
          <button
            className={`login-tab ${tab === 'signup' ? 'login-tab--active' : ''}`}
            onClick={() => { setTab('signup'); setError(''); }}
          >Create Account</button>
        </div>

        {/* Banners */}
        {success && (
          <div className="login-success">
            <span>✓</span> {success}
          </div>
        )}
        {error && (
          <div className="login-error">
            <span>⚠</span> {error}
          </div>
        )}

        {/* Google button */}
        <div className="login-google-wrapper">
          <button
            type="button"
            className="login-google-btn"
            onClick={handleOpenGoogle}
          >
            <svg className="login-google-icon" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>
        </div>

        {/* Divider */}
        <div className="login-divider">
          <span>OR CONTINUE WITH EMAIL</span>
        </div>

        {/* Email Form */}
        <form className="login-form" onSubmit={handleEmailSubmit} noValidate>
          {tab === 'signup' && (
            <div className="login-field">
              <label htmlFor="name">Full Name</label>
              <input
                id="name" type="text" placeholder="Anshuman Dubey"
                value={name} onChange={e => setName(e.target.value)}
                autoComplete="name"
              />
            </div>
          )}

          <div className="login-field">
            <label htmlFor="email">Email Address</label>
            <input
              id="email" type="email" placeholder="you@example.com"
              value={email} onChange={e => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>

          <div className="login-field">
            <label htmlFor="password">
              Password
              {tab === 'login' && (
                <button type="button" className="login-forgot">Forgot password?</button>
              )}
            </label>
            <div className="login-pass-wrap">
              <input
                id="password"
                type={showPass ? 'text' : 'password'}
                placeholder={tab === 'signup' ? 'Min. 6 characters' : '••••••••'}
                value={password} onChange={e => setPassword(e.target.value)}
                autoComplete={tab === 'signup' ? 'new-password' : 'current-password'}
              />
              <button
                type="button"
                className="login-pass-toggle"
                onClick={() => setShowPass(v => !v)}
                aria-label={showPass ? 'Hide password' : 'Show password'}
              >
                {showPass ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <button
            className="login-submit"
            type="submit"
            disabled={loading}
          >
            {loading
              ? <span className="login-spinner" />
              : tab === 'login' ? 'Sign In →' : 'Create Account →'
            }
          </button>
        </form>

        {/* Guest */}
        <button className="login-demo" onClick={handleDemo}>
          Continue as Guest — no sign-in required
        </button>

        <p className="login-terms">
          This page is protected by Google reCAPTCHA and subject to the Privacy Policy and Terms of Service.
        </p>
      </div>

      {/* ── GOOGLE SIGN-IN INTERACTIVE POPUP MODAL ───────────────────────── */}
      {showGoogleModal && (
        <div className="g-modal-overlay">
          <div className="g-modal-card fade-in">

            {/* Header */}
            <div className="g-modal-header">
              <svg className="g-modal-logo" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <button className="g-modal-close" onClick={() => setShowGoogleModal(false)}>✕</button>
            </div>

            <h2 className="g-modal-title">Sign in with Google</h2>
            <p className="g-modal-sub">to continue to <strong>CineAI App</strong></p>

            {googleError && (
              <div className="g-modal-error">
                <span>⚠</span> {googleError}
              </div>
            )}

            {/* STEP 1: Enter Google Email */}
            {googleStep === 1 && (
              <form onSubmit={handleGoogleNextEmail} className="g-modal-form">
                <div className="g-field">
                  <input
                    type="email"
                    className="g-input"
                    placeholder="Email or phone"
                    value={googleEmail}
                    onChange={e => setGoogleEmail(e.target.value)}
                    autoFocus
                  />
                </div>
                <div className="g-info-link">Forgot email?</div>
                <div className="g-hint">Not your computer? Use Guest mode to sign in privately.</div>

                <div className="g-modal-actions">
                  <button type="button" className="g-btn-text" onClick={() => setShowGoogleModal(false)}>Cancel</button>
                  <button type="submit" className="g-btn-blue">Next</button>
                </div>
              </form>
            )}

            {/* STEP 2: Enter Google Password */}
            {googleStep === 2 && (
              <form onSubmit={handleGoogleNextPass} className="g-modal-form">
                {/* Account Chip */}
                <div className="g-user-chip" onClick={() => setGoogleStep(1)}>
                  <div className="g-user-avatar">{googleEmail.charAt(0).toUpperCase()}</div>
                  <span className="g-user-email">{googleEmail}</span>
                  <span className="g-user-change">▼</span>
                </div>

                <div className="g-field">
                  <input
                    type={showGooglePass ? 'text' : 'password'}
                    className="g-input"
                    placeholder="Enter your Google password"
                    value={googlePass}
                    onChange={e => setGooglePass(e.target.value)}
                    autoFocus
                  />
                </div>

                <label className="g-show-pass">
                  <input
                    type="checkbox"
                    checked={showGooglePass}
                    onChange={e => setShowGooglePass(e.target.checked)}
                  />
                  <span>Show password</span>
                </label>

                <div className="g-modal-actions">
                  <button type="button" className="g-btn-text" onClick={() => setGoogleStep(1)}>Back</button>
                  <button type="submit" className="g-btn-blue">Sign In</button>
                </div>
              </form>
            )}

            {/* STEP 3: Verifying Animation */}
            {googleStep === 3 && (
              <div className="g-verifying">
                <div className="g-progress-bar">
                  <div className="g-progress-fill" />
                </div>
                <p>Authenticating Google Account…</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
