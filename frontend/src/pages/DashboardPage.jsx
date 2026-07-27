// src/pages/DashboardPage.jsx
// User Dashboard Page with Liked Movies, Similar to Liked Movies, and Personalized AI Recommendations.
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchSimilar, fetchTrending } from '../utils/api';
import MovieGrid from '../components/MovieGrid';
import SectionHeader from '../components/SectionHeader';
import './DashboardPage.css';

export default function DashboardPage() {
  const { user } = useAuth();
  const [likedMovies, setLikedMovies] = useState([]);
  const [similarToLiked, setSimilarToLiked] = useState([]);
  const [personalizedRecs, setPersonalizedRecs] = useState([]);
  const [loadingSimilar, setLoadingSimilar] = useState(false);
  const [loadingRecs, setLoadingRecs] = useState(true);

  // Load liked movies from localStorage
  const loadLikes = () => {
    try {
      const liked = JSON.parse(localStorage.getItem('cineai_liked_movies') || '[]');
      setLikedMovies(liked);
      return liked;
    } catch (e) {
      setLikedMovies([]);
      return [];
    }
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    const currentLikes = loadLikes();

    // Event listener for cross-component like updates
    const handleLikesUpdated = () => {
      loadLikes();
    };
    window.addEventListener('cineai_likes_updated', handleLikesUpdated);

    // Fetch similar movies based on liked titles
    async function loadDashboardRecs(likes) {
      if (likes.length > 0) {
        setLoadingSimilar(true);
        try {
          // Take up to 3 recent liked movies and fetch similar movies for them
          const sampleLikes = likes.slice(-3);
          const promises = sampleLikes.map(m => fetchSimilar(m.movieId, 6, 'hybrid'));
          const results = await Promise.all(promises);
          
          let combined = [];
          const seen = new Set(likes.map(m => m.movieId));
          
          results.forEach(res => {
            if (res && res.recommendations) {
              res.recommendations.forEach(rec => {
                if (!seen.has(rec.movieId)) {
                  seen.add(rec.movieId);
                  combined.push(rec);
                }
              });
            }
          });
          setSimilarToLiked(combined.slice(0, 12));
        } catch (err) {
          console.error('Failed loading similar to liked:', err);
        } finally {
          setLoadingSimilar(false);
        }
      }

      // Fetch general personalized trending recommendations
      try {
        setLoadingRecs(true);
        const data = await fetchTrending(12);
        setPersonalizedRecs(data.movies || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingRecs(false);
      }
    }

    loadDashboardRecs(currentLikes);

    return () => {
      window.removeEventListener('cineai_likes_updated', handleLikesUpdated);
    };
  }, []);

  // Compute stats
  const totalLiked = likedMovies.length;
  
  // Calculate top genre
  const genreCounts = {};
  likedMovies.forEach(m => {
    if (m.genres) {
      m.genres.split('|').forEach(g => {
        genreCounts[g] = (genreCounts[g] || 0) + 1;
      });
    }
  });

  let topGenre = 'None yet';
  let maxCount = 0;
  Object.entries(genreCounts).forEach(([g, count]) => {
    if (count > maxCount) {
      maxCount = count;
      topGenre = g;
    }
  });

  const avgLikedRating = totalLiked > 0
    ? (likedMovies.reduce((acc, m) => acc + (m.avg_rating || 0), 0) / totalLiked).toFixed(1)
    : 'N/A';

  return (
    <div className="dashboard container">
      {/* Header Banner */}
      <div className="dashboard__banner">
        <div className="dashboard__avatar">
          {user?.name ? user.name[0].toUpperCase() : '👤'}
        </div>
        <div className="dashboard__welcome">
          <h1 className="dashboard__name">Welcome back, {user?.name || 'Cinephile'}!</h1>
          <p className="dashboard__sub">Your personalized movie hub, liked titles, and AI recommendation engine.</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="dashboard__stats-grid">
        <div className="dashboard__stat-card">
          <div className="stat-card__icon">❤️</div>
          <div className="stat-card__content">
            <span className="stat-card__val">{totalLiked}</span>
            <span className="stat-card__label">Liked Movies</span>
          </div>
        </div>

        <div className="dashboard__stat-card">
          <div className="stat-card__icon">🎭</div>
          <div className="stat-card__content">
            <span className="stat-card__val">{topGenre}</span>
            <span className="stat-card__label">Favorite Genre</span>
          </div>
        </div>

        <div className="dashboard__stat-card">
          <div className="stat-card__icon">⭐</div>
          <div className="stat-card__content">
            <span className="stat-card__val">{avgLikedRating}</span>
            <span className="stat-card__label">Avg Rating of Liked</span>
          </div>
        </div>
      </div>

      {/* 1. ❤️ Liked Movies Section */}
      <section className="dashboard__section">
        <SectionHeader
          title="❤️ Your Liked Movies"
          subtitle="Films you've saved and liked across the catalog"
        />

        {likedMovies.length === 0 ? (
          <div className="dashboard__empty">
            <span className="empty__icon">🎬</span>
            <h3>No liked movies yet</h3>
            <p>Click the heart ❤️ icon on any movie card or detail page to add movies to your dashboard!</p>
            <Link to="/browse" className="btn btn--primary">Browse Catalog →</Link>
          </div>
        ) : (
          <MovieGrid movies={likedMovies} loading={false} />
        )}
      </section>

      {/* 2. 🎯 Similar to Your Liked Movies */}
      {likedMovies.length > 0 && (
        <section className="dashboard__section">
          <SectionHeader
            title="🎯 Similar to Your Liked Movies"
            subtitle="AI recommendations generated specifically based on your liked films"
          />
          <MovieGrid movies={similarToLiked} loading={loadingSimilar} skeletonCount={6} />
        </section>
      )}

      {/* 3. ✨ Personalized AI Recommendations */}
      <section className="dashboard__section">
        <SectionHeader
          title="✨ Recommended For You"
          subtitle="Top trending hybrid recommendations tailored for your taste"
          action={<Link to="/recommend" className="link-more">Custom AI Recommender →</Link>}
        />
        <MovieGrid movies={personalizedRecs} loading={loadingRecs} skeletonCount={8} />
      </section>
    </div>
  );
}
