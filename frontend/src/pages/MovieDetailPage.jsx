// src/pages/MovieDetailPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchMovieById, fetchSimilar } from '../utils/api';
import { fetchMoviePoster, getFallbackPoster } from '../utils/posterUtils';
import { getStreamingLinks } from '../utils/streamingUtils';
import movieOverviews from '../utils/movie_overviews.json';
import MovieGrid from '../components/MovieGrid';
import SectionHeader from '../components/SectionHeader';
import MovieReviews from '../components/MovieReviews';
import './MovieDetailPage.css';

function RatingBar({ value, max = 5 }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="rating-bar">
      <div className="rating-bar__fill" style={{ width: `${pct}%` }} />
    </div>
  );
}

export default function MovieDetailPage() {
  const { id }                      = useParams();
  const [movie, setMovie]           = useState(null);
  const [posterUrl, setPosterUrl]   = useState(null);
  const [similar, setSimilar]       = useState([]);
  const [activeTab, setActiveTab]   = useState('hybrid');
  const [loadingM, setLoadingM]     = useState(true);
  const [loadingS, setLoadingS]     = useState(true);
  const [error, setError]           = useState('');
  const [isLiked, setIsLiked]       = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    const movieId = parseInt(id);
    setLoadingM(true);
    setLoadingS(true);
    setError('');

    // Check liked status
    try {
      const liked = JSON.parse(localStorage.getItem('cineai_liked_movies') || '[]');
      setIsLiked(liked.some(m => m.movieId === movieId));
    } catch (e) {}

    fetchMovieById(movieId)
      .then(m => {
        setMovie(m);
        if (m) {
          fetchMoviePoster(m.clean_title || m.title, m.year, m.movieId)
            .then(url => setPosterUrl(url || getFallbackPoster(m.clean_title || m.title, m.year, m.genres)));
        }
      })
      .catch(() => setError('Movie not found.'))
      .finally(() => setLoadingM(false));

    fetchSimilar(movieId, 12, 'hybrid')
      .then(data => setSimilar(data.recommendations || []))
      .catch(() => {})
      .finally(() => setLoadingS(false));
  }, [id]);

  const handleTabChange = async (method) => {
    setActiveTab(method);
    setLoadingS(true);
    try {
      const data = await fetchSimilar(parseInt(id), 12, method);
      setSimilar(data.recommendations || []);
    } catch (_) {}
    finally { setLoadingS(false); }
  };

  const toggleLike = () => {
    if (!movie) return;
    try {
      const liked = JSON.parse(localStorage.getItem('cineai_liked_movies') || '[]');
      let updated;
      if (isLiked) {
        updated = liked.filter(m => m.movieId !== movie.movieId);
      } else {
        updated = [...liked, movie];
      }
      localStorage.setItem('cineai_liked_movies', JSON.stringify(updated));
      setIsLiked(!isLiked);
      window.dispatchEvent(new Event('cineai_likes_updated'));
    } catch (err) {
      console.error(err);
    }
  };

  if (loadingM) return (
    <div className="detail-loading">
      <div className="detail-loading__spinner" />
      <p>Loading title details…</p>
    </div>
  );

  if (error || !movie) return (
    <div className="detail-error">
      <h2>😕 {error || 'Something went wrong.'}</h2>
      <Link to="/" className="btn btn--primary">Go Home</Link>
    </div>
  );

  const genreList = (movie.genres || '').split('|');
  const isWebSeries = movie.genres && movie.genres.includes('Web Series');
  const plotOverview = movie.overview || movieOverviews[String(movie.movieId)] ||
    `An acclaimed ${isWebSeries ? 'web series' : 'film'} exploring high-stakes drama and unforgettable cinematic storytelling in ${movie.genres.replace(/\|/g, ', ')}.`;

  const streamingPlatforms = getStreamingLinks(movie.clean_title || movie.title);

  return (
    <div className="detail">
      {/* Backdrop */}
      <div className="detail__backdrop" aria-hidden="true">
        {posterUrl && <img src={posterUrl} alt="" className="detail__backdrop-img" />}
        <div className="detail__backdrop-overlay" />
      </div>

      <div className="detail__container">
        {/* Hero row */}
        <div className="detail__hero">
          {/* Poster Frame */}
          <div className="detail__poster-frame">
            <img
              src={posterUrl || getFallbackPoster(movie.clean_title || movie.title, movie.year, movie.genres)}
              alt={movie.clean_title}
              className="detail__poster-img"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = getFallbackPoster(movie.clean_title || movie.title, movie.year, movie.genres);
              }}
            />
          </div>

          {/* Meta Information */}
          <div className="detail__meta">
            <div className="detail__genres">
              <span className={`type-badge ${isWebSeries ? 'type-badge--series' : 'type-badge--movie'}`}>
                {isWebSeries ? '📺 Web Series' : '🎬 Movie'}
              </span>
              {genreList.filter(g => g !== 'Web Series').map(g => <span key={g} className="genre-pill">{g}</span>)}
            </div>

            <h1 className="detail__title">{movie.clean_title}</h1>

            {movie.year && <span className="detail__year">{isWebSeries ? `${movie.year}–` : movie.year}</span>}

            {/* Rating */}
            <div className="detail__rating">
              <div className="detail__stars">
                {[1,2,3,4,5].map(s => (
                  <span
                    key={s}
                    className={`detail__star ${s <= Math.round(movie.avg_rating) ? 'detail__star--on' : ''}`}
                  >★</span>
                ))}
              </div>
              <span className="detail__rating-val">{movie.avg_rating.toFixed(1)}</span>
              <span className="detail__rating-count">/ 5  ({movie.rating_count} ratings)</span>
              <RatingBar value={movie.avg_rating} />
            </div>

            {/* Synopsis / Storyline Section */}
            <div className="detail__overview-card">
              <h3 className="overview__title">📖 Synopsis &amp; Storyline</h3>
              <p className="overview__text">{plotOverview}</p>
            </div>

            {/* Stats */}
            <div className="detail__stats">
              <div className="detail__stat">
                <span className="detail__stat-label">Category</span>
                <span className="detail__stat-val">{isWebSeries ? 'Web Series' : 'Movie'}</span>
              </div>
              <div className="detail__stat">
                <span className="detail__stat-label">Popularity</span>
                <span className="detail__stat-val">{(movie.popularity * 100).toFixed(1)}%</span>
              </div>
              <div className="detail__stat">
                <span className="detail__stat-label">Score</span>
                <span className="detail__stat-val">{movie.avg_rating.toFixed(2)}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="detail__actions">
              <button
                className={`btn ${isLiked ? 'btn--liked' : 'btn--like'}`}
                onClick={toggleLike}
              >
                {isLiked ? '❤️ Liked in Dashboard' : '🤍 Add to Liked'}
              </button>

              <Link to="/recommend" className="btn btn--primary detail__rec-btn">
                🎬 AI Recommendations
              </Link>
            </div>

            {/* Where to Watch / Streaming Section */}
            <div className="detail__streaming">
              <h3 className="streaming__title">📺 Where to Watch / Stream</h3>
              <p className="streaming__sub">Click a platform below to search and stream online:</p>

              <div className="streaming__grid">
                {streamingPlatforms.map(platform => (
                  <a
                    key={platform.id}
                    href={platform.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="streaming__btn"
                    style={{ background: platform.bg }}
                  >
                    <span className="streaming__icon">{platform.icon}</span>
                    <span className="streaming__name">{platform.name}</span>
                    <span className="streaming__arrow">↗</span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* User Reviews & Ratings Section */}
        <MovieReviews movieId={movie.movieId} movieTitle={movie.clean_title} />

        {/* Similar movies */}
        <div className="detail__similar" style={{ marginTop: '50px' }}>
          <SectionHeader
            title="Similar Recommendations"
            subtitle="Powered by ML — choose your recommendation method"
          />

          {/* Method tabs */}
          <div className="detail__tabs">
            {[
              { key: 'hybrid',        label: '✨ Hybrid' },
              { key: 'content',       label: '📄 Content-Based' },
              { key: 'collaborative', label: '👥 Collaborative' },
            ].map(({ key, label }) => (
              <button
                key={key}
                className={`detail__tab ${activeTab === key ? 'detail__tab--active' : ''}`}
                onClick={() => handleTabChange(key)}
              >
                {label}
              </button>
            ))}
          </div>

          <MovieGrid movies={similar} loading={loadingS} skeletonCount={12} />
        </div>
      </div>
    </div>
  );
}
