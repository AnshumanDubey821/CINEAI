// src/components/MovieReviews.jsx
// Interactive User Reviews & Ratings Component
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './MovieReviews.css';

// Initial sample reviews for popular movies
const DEFAULT_REVIEWS = [
  {
    id: 101,
    movieId: 1,
    author: 'Sarah M.',
    rating: 5,
    date: '2 days ago',
    content: 'An absolute masterpiece of cinema! The story, cinematography, and direction are top notch. Must watch for everyone.',
  },
  {
    id: 102,
    movieId: 1,
    author: 'Alex Rivera',
    rating: 4,
    date: '1 week ago',
    content: 'Incredible performances throughout. The pacing kept me hooked from start to finish. Highly recommended!',
  },
];

export default function MovieReviews({ movieId, movieTitle }) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [userRating, setUserRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [authorName, setAuthorName] = useState(user?.name || '');
  const [submitted, setSubmitted] = useState(false);

  const storageKey = `cineai_reviews_movie_${movieId}`;

  // Load reviews from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        setReviews(JSON.parse(stored));
      } else {
        // Initial default reviews
        const initial = DEFAULT_REVIEWS.map(r => ({ ...r, movieId }));
        setReviews(initial);
        localStorage.setItem(storageKey, JSON.stringify(initial));
      }
    } catch (e) {
      setReviews(DEFAULT_REVIEWS);
    }
  }, [movieId, storageKey]);

  useEffect(() => {
    if (user?.name) setAuthorName(user.name);
  }, [user]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!reviewText.trim()) return;

    const newReview = {
      id: Date.now(),
      movieId,
      author: authorName.trim() || 'Anonymous Cinephile',
      rating: userRating,
      date: 'Just now',
      content: reviewText.trim(),
    };

    const updated = [newReview, ...reviews];
    setReviews(updated);
    try {
      localStorage.setItem(storageKey, JSON.stringify(updated));
    } catch (e) {}

    setReviewText('');
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 4000);
  };

  // Calculate average score and distribution
  const totalReviews = reviews.length;
  const avgScore = totalReviews > 0
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews).toFixed(1)
    : '5.0';

  const distribution = [5, 4, 3, 2, 1].map(stars => {
    const count = reviews.filter(r => r.rating === stars).length;
    const pct = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
    return { stars, count, pct };
  });

  return (
    <div className="reviews-section">
      <h2 className="reviews-section__title">💬 User Reviews & Ratings</h2>
      <p className="reviews-section__sub">See what other cinephiles think or share your own review</p>

      <div className="reviews-grid">
        {/* Rating Breakdown */}
        <div className="reviews-summary">
          <div className="summary-score">
            <span className="summary-score__val">{avgScore}</span>
            <div className="summary-score__stars">
              {[1, 2, 3, 4, 5].map(star => (
                <span
                  key={star}
                  className={`star ${star <= Math.round(avgScore) ? 'on' : ''}`}
                >★</span>
              ))}
            </div>
            <span className="summary-score__count">Based on {totalReviews} reviews</span>
          </div>

          <div className="summary-dist">
            {distribution.map(({ stars, count, pct }) => (
              <div key={stars} className="dist-row">
                <span className="dist-row__label">{stars} ★</span>
                <div className="dist-row__bar-bg">
                  <div className="dist-row__bar-fill" style={{ width: `${pct}%` }} />
                </div>
                <span className="dist-row__count">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Write a Review Form */}
        <div className="reviews-form-card">
          <h3 className="form-card__title">✍️ Write a Review</h3>
          
          {submitted && (
            <div className="form-card__success">
              ✅ Thank you! Your review has been published.
            </div>
          )}

          <form onSubmit={handleSubmit} className="reviews-form">
            <div className="form-group">
              <label>Your Name</label>
              <input
                type="text"
                placeholder="e.g. Christopher Nolan"
                value={authorName}
                onChange={e => setAuthorName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Rating</label>
              <div className="star-picker">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    type="button"
                    className={`star-btn ${star <= userRating ? 'on' : ''}`}
                    onClick={() => setUserRating(star)}
                  >
                    ★
                  </button>
                ))}
                <span className="star-picker__val">{userRating} / 5 Stars</span>
              </div>
            </div>

            <div className="form-group">
              <label>Review</label>
              <textarea
                rows="4"
                placeholder="What did you think of the story, acting, direction, or visual effects?"
                value={reviewText}
                onChange={e => setReviewText(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn btn--primary submit-review-btn">
              Submit Review →
            </button>
          </form>
        </div>
      </div>

      {/* Reviews List Feed */}
      <div className="reviews-feed">
        <h3 className="feed-title">Recent Community Reviews ({reviews.length})</h3>

        {reviews.length === 0 ? (
          <div className="feed-empty">
            <p>No reviews yet. Be the first to share your thoughts on {movieTitle || 'this movie'}!</p>
          </div>
        ) : (
          <div className="feed-list">
            {reviews.map(review => (
              <div key={review.id} className="review-card">
                <div className="review-card__header">
                  <div className="review-card__avatar">
                    {review.author[0].toUpperCase()}
                  </div>
                  <div className="review-card__author-info">
                    <span className="author-name">{review.author}</span>
                    <span className="review-date">{review.date}</span>
                  </div>
                  <div className="review-card__rating">
                    {[1, 2, 3, 4, 5].map(star => (
                      <span
                        key={star}
                        className={`star ${star <= review.rating ? 'on' : ''}`}
                      >★</span>
                    ))}
                  </div>
                </div>
                <p className="review-card__text">{review.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
