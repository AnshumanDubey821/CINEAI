// src/pages/RecommendPage.jsx
// Core page: user picks a movie or genre and the ML engine returns recommendations.
import React, { useState, useEffect, useRef } from 'react';
import { searchMovies, recommendByMovie, recommendByGenre, fetchGenres } from '../utils/api';
import MovieGrid from '../components/MovieGrid';
import SectionHeader from '../components/SectionHeader';
import './RecommendPage.css';

const METHOD_INFO = {
  hybrid: {
    label: '✨ Hybrid',
    desc: 'Blends content-based TF-IDF cosine similarity with collaborative user-rating patterns for diverse, accurate picks.',
  },
  content: {
    label: '📄 Content-Based',
    desc: 'Uses TF-IDF on genres + title tokens and cosine similarity to find movies with similar content profiles.',
  },
  collaborative: {
    label: '👥 Collaborative',
    desc: 'Item-item similarity derived from how users rated movies together — "people who liked this also liked…"',
  },
};

const GENRE_ICONS = {
  Action:'💥', Adventure:'🗺️', Animation:'🎨', Biography:'📖',
  Comedy:'😂', Crime:'🔍', Documentary:'📽️', Drama:'🎭',
  Fantasy:'🔮', History:'🏛️', Horror:'👻', Music:'🎵',
  Musical:'🎼', Mystery:'🕵️', Romance:'💕', 'Sci-Fi':'🚀',
  Sport:'🏆', Thriller:'😱', War:'⚔️', Western:'🤠',
};

export default function RecommendPage() {
  // Mode: 'movie' or 'genre'
  const [mode, setMode]             = useState('movie');
  const [method, setMethod]         = useState('hybrid');
  const [numRecs, setNumRecs]       = useState(12);

  // Movie mode
  const [query, setQuery]           = useState('');
  const [searchRes, setSearchRes]   = useState([]);
  const [searching, setSearching]   = useState(false);
  const [selectedMovie, setSelected]= useState(null);

  // Genre mode
  const [genres, setGenres]         = useState([]);
  const [selectedGenre, setGenre]   = useState('');

  // Results
  const [recs, setRecs]             = useState([]);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');
  const [ran, setRan]               = useState(false);

  const timerRef   = useRef(null);
  const resultsRef = useRef(null);

  useEffect(() => {
    fetchGenres().then(d => setGenres(d.genres || [])).catch(() => {});
  }, []);

  // Debounced movie search
  const handleQueryChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    setSelected(null);
    setSearchRes([]);
    clearTimeout(timerRef.current);
    if (val.trim().length < 2) return;
    timerRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const d = await searchMovies(val.trim(), 10);
        setSearchRes(d.movies || []);
      } catch (_) {}
      finally { setSearching(false); }
    }, 300);
  };

  const pickMovie = (movie) => {
    setSelected(movie);
    setQuery(movie.clean_title);
    setSearchRes([]);
  };

  const handleRecommend = async () => {
    setError('');
    setRecs([]);
    setLoading(true);
    setRan(true);
    try {
      let data;
      if (mode === 'movie') {
        if (!selectedMovie) { setError('Please select a movie from the search results.'); setLoading(false); return; }
        data = await recommendByMovie(selectedMovie.movieId, numRecs, method);
        setRecs(data.recommendations || []);
      } else {
        if (!selectedGenre) { setError('Please choose a genre.'); setLoading(false); return; }
        data = await recommendByGenre(selectedGenre, numRecs);
        setRecs(data.recommendations || []);
      }
    } catch (err) {
      setError('Failed to fetch recommendations. Is the backend running?');
    } finally {
      setLoading(false);
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 200);
    }
  };

  return (
    <div className="recommend-page">
      <div className="recommend-page__container">

        {/* Page header */}
        <div className="rp-header">
          <div className="rp-header__badge">🤖 ML Engine</div>
          <h1 className="rp-header__title">Movie Recommender</h1>
          <p className="rp-header__sub">
            Choose a movie you love — or a genre that fits your mood — and our
            machine learning engine will surface the best matches.
          </p>
        </div>

        {/* Config panel */}
        <div className="rp-panel">

          {/* Mode toggle */}
          <div className="rp-section">
            <label className="rp-label">Recommendation Type</label>
            <div className="rp-toggle">
              <button
                className={`rp-toggle__btn ${mode === 'movie' ? 'rp-toggle__btn--active' : ''}`}
                onClick={() => setMode('movie')}
              >
                🎬 By Movie
              </button>
              <button
                className={`rp-toggle__btn ${mode === 'genre' ? 'rp-toggle__btn--active' : ''}`}
                onClick={() => setMode('genre')}
              >
                🎭 By Genre
              </button>
            </div>
          </div>

          {/* Movie search */}
          {mode === 'movie' && (
            <div className="rp-section">
              <label className="rp-label">Search for a Movie</label>
              <div className="rp-search">
                <span className="rp-search__icon">🔍</span>
                <input
                  className="rp-search__input"
                  type="text"
                  placeholder="e.g. The Dark Knight, Inception…"
                  value={query}
                  onChange={handleQueryChange}
                  autoComplete="off"
                />
                {searching && <span className="rp-search__spinner" />}
              </div>
              {searchRes.length > 0 && !selectedMovie && (
                <div className="rp-search-results">
                  {searchRes.map(m => (
                    <button key={m.movieId} className="rp-search-item" onClick={() => pickMovie(m)}>
                      <div className="rp-search-item__title">{m.clean_title}</div>
                      <div className="rp-search-item__meta">
                        {m.year && <span>{m.year}</span>}
                        <span>{m.genres.split('|').slice(0,2).join(', ')}</span>
                        <span className="rp-search-item__rating">⭐ {m.avg_rating}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {selectedMovie && (
                <div className="rp-selected">
                  <span className="rp-selected__check">✓</span>
                  <div>
                    <div className="rp-selected__title">{selectedMovie.clean_title}</div>
                    <div className="rp-selected__meta">{selectedMovie.genres}</div>
                  </div>
                  <button className="rp-selected__clear" onClick={() => { setSelected(null); setQuery(''); }}>✕</button>
                </div>
              )}
            </div>
          )}

          {/* Genre selector */}
          {mode === 'genre' && (
            <div className="rp-section">
              <label className="rp-label">Choose a Genre</label>
              <div className="rp-genre-grid">
                {genres.map(g => (
                  <button
                    key={g}
                    className={`rp-genre-btn ${selectedGenre === g ? 'rp-genre-btn--active' : ''}`}
                    onClick={() => setGenre(g)}
                  >
                    <span>{GENRE_ICONS[g] || '🎬'}</span>
                    <span>{g}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ML Method (only shown in movie mode) */}
          {mode === 'movie' && (
            <div className="rp-section">
              <label className="rp-label">ML Algorithm</label>
              <div className="rp-methods">
                {Object.entries(METHOD_INFO).map(([key, info]) => (
                  <button
                    key={key}
                    className={`rp-method ${method === key ? 'rp-method--active' : ''}`}
                    onClick={() => setMethod(key)}
                  >
                    <div className="rp-method__label">{info.label}</div>
                    <div className="rp-method__desc">{info.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Count slider */}
          <div className="rp-section rp-section--row">
            <label className="rp-label">Number of Recommendations</label>
            <div className="rp-slider-row">
              <input
                type="range" min={4} max={24} step={4}
                value={numRecs}
                onChange={e => setNumRecs(+e.target.value)}
                className="rp-slider"
              />
              <span className="rp-slider-val">{numRecs}</span>
            </div>
          </div>

          {/* Submit */}
          {error && <div className="rp-error">⚠️ {error}</div>}
          <button
            className="rp-submit"
            onClick={handleRecommend}
            disabled={loading}
          >
            {loading ? (
              <><span className="rp-submit__spinner" /> Generating…</>
            ) : (
              '✨ Get Recommendations'
            )}
          </button>
        </div>

        {/* Results */}
        {ran && (
          <div className="rp-results" ref={resultsRef}>
            <SectionHeader
              title={
                mode === 'movie' && selectedMovie
                  ? `Because you liked "${selectedMovie.clean_title}"`
                  : selectedGenre
                  ? `Top ${selectedGenre} Movies`
                  : 'Recommendations'
              }
              subtitle={
                mode === 'movie'
                  ? `${METHOD_INFO[method]?.label} · ${recs.length} results`
                  : `${recs.length} results`
              }
            />
            <MovieGrid movies={recs} loading={loading} skeletonCount={numRecs} />
          </div>
        )}
      </div>
    </div>
  );
}
