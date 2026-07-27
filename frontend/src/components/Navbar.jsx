// src/components/Navbar.jsx
// Netflix-styled Navigation Bar
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { searchMovies } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

export default function Navbar() {
  const { user, logout }            = useAuth();
  const [query, setQuery]           = useState('');
  const [results, setResults]       = useState([]);
  const [searching, setSearching]   = useState(false);
  const [dropOpen, setDropOpen]     = useState(false);
  const [userMenuOpen, setUserMenu] = useState(false);
  const [scrolled, setScrolled]     = useState(false);
  const navigate                    = useNavigate();
  const location                    = useLocation();
  const dropRef                     = useRef(null);
  const userMenuRef                 = useRef(null);
  const timerRef                    = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setDropOpen(false);
    setUserMenu(false);
    setQuery('');
    setResults([]);
  }, [location]);

  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false);
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setUserMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleInput = (e) => {
    const val = e.target.value;
    setQuery(val);
    clearTimeout(timerRef.current);
    if (val.trim().length < 2) { setResults([]); setDropOpen(false); return; }
    timerRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const data = await searchMovies(val.trim(), 8);
        setResults(data.movies || []);
        setDropOpen(true);
      } catch (_) {}
      finally { setSearching(false); }
    }, 350);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/browse?q=${encodeURIComponent(query.trim())}`);
      setDropOpen(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const avatarLetter = user?.name?.charAt(0)?.toUpperCase() || 'N';

  const navLinks = [
    { to: '/',          label: 'Home' },
    { to: '/browse?type=series', label: 'TV Shows' },
    { to: '/browse?type=movie',  label: 'Movies' },
    { to: '/dashboard', label: 'My List / Dashboard' },
    { to: '/recommend', label: 'AI Recommender' },
    { to: '/time',       label: 'Time Picks' },
  ];

  return (
    <nav className={`netflix-navbar ${scrolled ? 'netflix-navbar--scrolled' : ''}`}>
      <div className="netflix-navbar__inner">
        {/* Brand / Logo */}
        <Link to="/" className="netflix-navbar__logo">
          <span className="netflix-logo-red">CINEAI</span>
        </Link>

        {/* Nav Links */}
        <ul className="netflix-navbar__links">
          {navLinks.map(({ to, label }) => {
            const isActive = location.pathname + location.search === to || (to === '/' && location.pathname === '/');
            return (
              <li key={to}>
                <Link
                  to={to}
                  className={`netflix-navbar__link ${isActive ? 'netflix-navbar__link--active' : ''}`}
                >
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Right Section: Search & User */}
        <div className="netflix-navbar__right">
          {/* Search Box */}
          <div className="netflix-navbar__search" ref={dropRef}>
            <form onSubmit={handleSubmit} className="netflix-search-form">
              <span className="netflix-search-icon">🔍</span>
              <input
                className="netflix-search-input"
                type="text"
                placeholder="Titles, people, genres…"
                value={query}
                onChange={handleInput}
                autoComplete="off"
              />
              {searching && <span className="netflix-search-spinner" />}
            </form>

            {dropOpen && results.length > 0 && (
              <div className="netflix-dropdown">
                {results.map(movie => (
                  <Link
                    key={movie.movieId}
                    to={`/movie/${movie.movieId}`}
                    className="netflix-dropdown__item"
                  >
                    <div className="netflix-dropdown__title">{movie.clean_title}</div>
                    <div className="netflix-dropdown__meta">
                      {movie.year && <span>{movie.year}</span>}
                      <span className="match-badge">98% Match</span>
                      <span className="badge-maturity">HD</span>
                    </div>
                  </Link>
                ))}
                <button
                  className="netflix-dropdown__more"
                  onClick={() => { navigate(`/browse?q=${encodeURIComponent(query)}`); setDropOpen(false); }}
                >
                  Explore all results for "{query}"
                </button>
              </div>
            )}
          </div>

          {/* User Profile Avatar */}
          {user && (
            <div className="netflix-navbar__user" ref={userMenuRef}>
              <button
                className="netflix-avatar-btn"
                onClick={() => setUserMenu(v => !v)}
                aria-label="User menu"
              >
                <div className="netflix-avatar">
                  {user.avatar
                    ? <img src={user.avatar} alt={user.name} referrerPolicy="no-referrer" />
                    : <span>{avatarLetter}</span>
                  }
                </div>
                <span className="netflix-avatar-caret">▼</span>
              </button>

              {userMenuOpen && (
                <div className="netflix-user-menu">
                  <div className="netflix-user-header">
                    <div className="user-name">{user.name}</div>
                    <div className="user-email">{user.email}</div>
                  </div>
                  <div className="menu-divider" />
                  <Link to="/dashboard" className="menu-item">
                    📋 My List &amp; Dashboard
                  </Link>
                  <Link to="/recommend" className="menu-item">
                    🤖 Custom Recommender
                  </Link>
                  <div className="menu-divider" />
                  <button className="menu-item menu-item--logout" onClick={handleLogout}>
                    Sign Out of CineAI
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
