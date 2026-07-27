// src/components/MovieGrid.jsx
// Responsive grid of MovieCards with skeleton loading state.
import React from 'react';
import MovieCard from './MovieCard';
import './MovieGrid.css';

function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <div className="skeleton skeleton-poster" />
      <div className="skeleton-info">
        <div className="skeleton skeleton-line skeleton-line--lg" />
        <div className="skeleton skeleton-line skeleton-line--sm" />
        <div className="skeleton skeleton-line skeleton-line--md" />
      </div>
    </div>
  );
}

export default function MovieGrid({ movies = [], loading = false, skeletonCount = 12, size = 'default', emptyMessage = 'No movies found.' }) {
  if (loading) {
    return (
      <div className="movie-grid">
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (!movies.length) {
    return (
      <div className="movie-grid-empty">
        <span className="movie-grid-empty__icon">🎬</span>
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="movie-grid">
      {movies.map((movie, i) => (
        <div key={movie.movieId} style={{ animationDelay: `${i * 40}ms` }}>
          <MovieCard movie={movie} size={size} />
        </div>
      ))}
    </div>
  );
}
