// src/components/Footer.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer__inner">
        <div className="footer__brand">
          <span className="footer__logo">🎬 Cine<em>AI</em></span>
          <p>ML-powered movie recommendations using content-based &amp; collaborative filtering.</p>
        </div>
        <nav className="footer__nav">
          <Link to="/">Home</Link>
          <Link to="/browse">Browse</Link>
          <Link to="/recommend">Recommend</Link>
        </nav>
        <p className="footer__copy">
          Powered by MovieLens · Built with FastAPI &amp; React
        </p>
      </div>
    </footer>
  );
}
