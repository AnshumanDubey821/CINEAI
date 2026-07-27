// src/components/MovieCard.jsx
// Netflix-styled Movie & Web Series Card Component
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchMoviePoster, getFallbackPoster } from '../utils/posterUtils';
import './MovieCard.css';

export default function MovieCard({ movie, size = 'default', onLikeToggle }) {
  const [posterUrl, setPosterUrl] = useState(null);
  const [loadingPoster, setLoadingPoster] = useState(true);
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    if (!movie) return;

    // Check liked status in localStorage
    try {
      const liked = JSON.parse(localStorage.getItem('cineai_liked_movies') || '[]');
      setIsLiked(liked.some(m => m.movieId === movie.movieId));
    } catch (e) {}

    let isMounted = true;
    async function loadPoster() {
      setLoadingPoster(true);
      const url = await fetchMoviePoster(movie.clean_title || movie.title, movie.year, movie.movieId);
      if (isMounted) {
        setPosterUrl(url || getFallbackPoster(movie.clean_title || movie.title, movie.year, movie.genres));
        setLoadingPoster(false);
      }
    }
    loadPoster();

    return () => { isMounted = false; };
  }, [movie]);

  if (!movie) return null;

  const {
    movieId, clean_title, title, year, genres = '',
    avg_rating = 0, rating_count = 0,
  } = movie;

  const isWebSeries = genres.includes('Web Series');
  const genreList = genres.split('|').filter(g => g !== 'Web Series').slice(0, 2);
  const matchScore = Math.min(99, Math.round(85 + (avg_rating * 3)));

  const toggleLike = (e) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      const liked = JSON.parse(localStorage.getItem('cineai_liked_movies') || '[]');
      let updated;
      if (isLiked) {
        updated = liked.filter(m => m.movieId !== movieId);
      } else {
        updated = [...liked, movie];
      }
      localStorage.setItem('cineai_liked_movies', JSON.stringify(updated));
      setIsLiked(!isLiked);
      if (onLikeToggle) onLikeToggle(movieId, !isLiked);
      window.dispatchEvent(new Event('cineai_likes_updated'));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Link
      to={`/movie/${movieId}`}
      className={`netflix-card netflix-card--${size} fade-in`}
      aria-label={`View ${clean_title || title}`}
    >
      {/* Poster Image */}
      <div className="netflix-card__poster">
        {loadingPoster ? (
          <div className="netflix-card__skeleton" />
        ) : (
          <img
            src={posterUrl}
            alt={clean_title || title}
            className="netflix-card__img"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = getFallbackPoster(clean_title || title, year, genres);
            }}
          />
        )}

        {/* Media Type Badge */}
        <span className={`netflix-card__badge ${isWebSeries ? 'badge-series' : 'badge-movie'}`}>
          {isWebSeries ? 'SERIES' : 'FILM'}
        </span>

        {/* Like Heart Button */}
        <button
          className={`netflix-card__like ${isLiked ? 'is-liked' : ''}`}
          onClick={toggleLike}
          title={isLiked ? 'Remove from My List' : 'Add to My List'}
        >
          {isLiked ? '❤️' : '🤍'}
        </button>
      </div>

      {/* Info Container */}
      <div className="netflix-card__info">
        <h3 className="netflix-card__title">{clean_title || title}</h3>

        <div className="netflix-card__meta">
          <span className="match-badge">{matchScore}% Match</span>
          <span className="badge-maturity">{isWebSeries ? '16+' : 'PG-13'}</span>
          <span className="badge-hd">HD</span>
          {year && <span className="card-year">{year}</span>}
        </div>

        <div className="netflix-card__genres">
          {genreList.map(g => (
            <span key={g} className="genre-pill">{g}</span>
          ))}
          <span className="card-rating">⭐ {avg_rating.toFixed(1)}</span>
        </div>
      </div>
    </Link>
  );
}
