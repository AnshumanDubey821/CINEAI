// src/pages/HomePage.jsx
// Netflix-styled Home Page with Billboard Hero Banner & Movie Rows
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { fetchTrending, fetchGenres } from '../utils/api';
import MovieGrid from '../components/MovieGrid';
import SectionHeader from '../components/SectionHeader';
import { fetchMoviePoster } from '../utils/posterUtils';
import movieOverviews from '../utils/movie_overviews.json';
import './HomePage.css';

const GENRE_ICONS = {
  Action: '💥', Adventure: '🗺️', Animation: '🎨', Biography: '📖',
  Comedy: '😂', Crime: '🔍', Documentary: '📽️', Drama: '🎭',
  Fantasy: '🔮', History: '🏛️', Horror: '👻', Music: '🎵',
  Musical: '🎼', Mystery: '🕵️', Romance: '💕', 'Sci-Fi': '🚀',
  Sport: '🏆', Thriller: '😱', War: '⚔️', Western: '🤠',
  'Web Series': '📺',
};

// ── Time of Day mini-widget ────────────────────────────────────────────────
const TIME_SLOT_CONFIG = {
  morning:   { emoji: '🌅', label: 'Morning',   mood: 'Uplifting & Inspiring',   palette: '#E50914', bg: 'linear-gradient(135deg, #1f1212 0%, #141414 100%)', color: '#ffffff' },
  afternoon: { emoji: '☀️', label: 'Afternoon', mood: 'Action-Packed & Bold',    palette: '#E50914', bg: 'linear-gradient(135deg, #161824 0%, #141414 100%)', color: '#ffffff' },
  evening:   { emoji: '🌆', label: 'Evening',   mood: 'Dramatic & Rewarding',    palette: '#E50914', bg: 'linear-gradient(135deg, #24141a 0%, #141414 100%)', color: '#ffffff' },
  night:     { emoji: '🌙', label: 'Night',     mood: 'Intense & Atmospheric',   palette: '#E50914', bg: 'linear-gradient(135deg, #0d0d1e 0%, #141414 100%)', color: '#ffffff' },
};

function detectSlot() {
  const h = new Date().getHours();
  if (h >= 5  && h < 12) return 'morning';
  if (h >= 12 && h < 17) return 'afternoon';
  if (h >= 17 && h < 22) return 'evening';
  return 'night';
}

function TimeWidget() {
  const [time, setTime]   = useState(new Date());
  const slot              = detectSlot();
  const cfg               = TIME_SLOT_CONFIG[slot];

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="netflix-time-widget" style={{ background: cfg.bg }}>
      <div className="time-widget__left">
        <div className="time-widget__emoji">{cfg.emoji}</div>
        <div>
          <div className="time-widget__label">{cfg.label} Recommendations</div>
          <div className="time-widget__mood">{cfg.mood}</div>
          <div className="time-widget__time">
            🕐 {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>
      <div className="time-widget__right">
        <p className="time-widget__desc">
          AI-curated recommendations matching your {cfg.label.toLowerCase()} mood.
        </p>
        <Link to="/time" className="btn btn--primary">
          See {cfg.label} Picks →
        </Link>
      </div>
    </div>
  );
}

export default function HomePage() {
  const [trending, setTrending]     = useState([]);
  const [series, setSeries]         = useState([]);
  const [moviesOnly, setMoviesOnly] = useState([]);
  const [genres, setGenres]         = useState([]);
  const [heroItem, setHeroItem]     = useState(null);
  const [heroPoster, setHeroPoster] = useState(null);
  const [loading, setLoading]       = useState(true);
  const navigate                    = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        const [t, g] = await Promise.all([fetchTrending(30), fetchGenres()]);
        const allList = t.movies || [];
        setTrending(allList.slice(0, 12));
        setSeries(allList.filter(m => m.genres.includes('Web Series')).slice(0, 12));
        setMoviesOnly(allList.filter(m => !m.genres.includes('Web Series')).slice(0, 12));
        setGenres((g.genres || []).filter(genre => genre !== 'Web Series'));

        // Pick featured billboard hero item
        if (allList.length > 0) {
          const featured = allList.find(m => m.clean_title.includes('Oppenheimer') || m.clean_title.includes('Dark Knight') || m.clean_title.includes('Dune')) || allList[0];
          setHeroItem(featured);
          fetchMoviePoster(featured.clean_title || featured.title, featured.year, featured.movieId)
            .then(setHeroPoster);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const heroOverview = heroItem
    ? (heroItem.overview || movieOverviews[String(heroItem.movieId)] || 'The story of J. Robert Oppenheimer\'s role in the development of the atomic bomb during World War II.')
    : '';

  return (
    <div className="netflix-home">
      {/* Netflix Billboard Hero Banner */}
      {heroItem && (
        <section className="netflix-hero">
          <div className="netflix-hero__backdrop">
            {heroPoster && <img src={heroPoster} alt={heroItem.clean_title} className="netflix-hero__img" />}
            <div className="netflix-hero__vignette" />
          </div>

          <div className="netflix-hero__content container">
            <div className="netflix-hero__brand">
              <span className="netflix-n-badge">N</span>
              <span className="netflix-brand-type">
                {heroItem.genres.includes('Web Series') ? 'SERIES' : 'FILM'}
              </span>
            </div>

            <h1 className="netflix-hero__title">{heroItem.clean_title}</h1>

            <div className="netflix-hero__meta">
              <span className="match-badge">98% Match</span>
              <span className="badge-maturity">16+</span>
              <span className="badge-hd">4K Ultra HD</span>
              {heroItem.year && <span className="hero-year">{heroItem.year}</span>}
              <span className="hero-rating">⭐ {heroItem.avg_rating.toFixed(1)}</span>
            </div>

            <p className="netflix-hero__synopsis">
              {heroOverview.length > 220 ? heroOverview.slice(0, 220) + '…' : heroOverview}
            </p>

            <div className="netflix-hero__actions">
              <Link to={`/movie/${heroItem.movieId}`} className="btn btn--light">
                <span>▶</span> Watch Now
              </Link>
              <Link to={`/movie/${heroItem.movieId}`} className="btn btn--secondary">
                <span>ℹ</span> More Info
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Main Content Rows */}
      <div className="netflix-rows container">
        {/* 1. 🔥 Trending Now */}
        <section className="netflix-section">
          <SectionHeader
            title="🔥 Trending Now on CineAI"
            subtitle="Top-rated blockbusters & web series ranked by viewer popularity"
            action={<Link to="/browse" className="link-more">See All →</Link>}
          />
          <MovieGrid movies={trending} loading={loading} skeletonCount={6} />
        </section>

        {/* 2. 📺 Top Web Series */}
        {series.length > 0 && (
          <section className="netflix-section">
            <SectionHeader
              title="📺 Popular Web Series & TV Shows"
              subtitle="Binge-worthy series streaming across all major platforms"
              action={<Link to="/browse?type=series" className="link-more">Explore Series →</Link>}
            />
            <MovieGrid movies={series} loading={loading} skeletonCount={6} />
          </section>
        )}

        {/* 3. 🎬 Blockbuster Movies */}
        {moviesOnly.length > 0 && (
          <section className="netflix-section">
            <SectionHeader
              title="🎬 Critically Acclaimed Movies"
              subtitle="Highest rated cinema masterpieces from top directors"
              action={<Link to="/browse?type=movie" className="link-more">Explore Movies →</Link>}
            />
            <MovieGrid movies={moviesOnly} loading={loading} skeletonCount={6} />
          </section>
        )}

        {/* 4. 🎭 Browse by Genre */}
        {genres.length > 0 && (
          <section className="netflix-section">
            <SectionHeader
              title="🎭 Browse by Genre"
              subtitle="Explore by categories tailored to your taste"
            />
            <div className="netflix-genre-grid">
              {genres.map(g => (
                <Link
                  key={g}
                  to={`/browse?genre=${encodeURIComponent(g)}`}
                  className="netflix-genre-tile"
                >
                  <span className="genre-icon">{GENRE_ICONS[g] || '🎬'}</span>
                  <span className="genre-name">{g}</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* 5. 🌅 Time of Day Recommendation */}
        <section className="netflix-section">
          <TimeWidget />
        </section>
      </div>
    </div>
  );
}
