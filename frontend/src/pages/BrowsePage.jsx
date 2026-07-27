// src/pages/BrowsePage.jsx
// Browse / search all movies & web series with category filtering, genre filtering, and pagination.
import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { fetchAllMovies, searchMovies, fetchGenres } from '../utils/api';
import axios from 'axios';
import MovieGrid from '../components/MovieGrid';
import SectionHeader from '../components/SectionHeader';
import './BrowsePage.css';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const GENRE_ICONS = {
  Action:'💥', Adventure:'🗺️', Animation:'🎨', Biography:'📖',
  Comedy:'😂', Crime:'🔍', Documentary:'📽️', Drama:'🎭',
  Fantasy:'🔮', History:'🏛️', Horror:'👻', Music:'🎵',
  Musical:'🎼', Mystery:'🕵️', Romance:'💕', 'Sci-Fi':'🚀',
  Sport:'🏆', Thriller:'😱', War:'⚔️', Western:'🤠',
  'Web Series': '📺',
};

export default function BrowsePage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [movies, setMovies]     = useState([]);
  const [genres, setGenres]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [query, setQuery]       = useState(searchParams.get('q') || '');
  const [activeGenre, setGenre] = useState(searchParams.get('genre') || '');
  const [mediaType, setMediaType] = useState(searchParams.get('type') || 'all'); // 'all', 'movie', 'series'
  const [page, setPage]         = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const PER_PAGE = 48;

  // Load genres once
  useEffect(() => {
    fetchGenres().then(d => setGenres((d.genres || []).filter(g => g !== 'Web Series'))).catch(() => {});
  }, []);

  // Main data loader
  const load = useCallback(async (q, genre, type, pg) => {
    setLoading(true);
    try {
      let resultList = [];
      if (q.trim()) {
        const data = await searchMovies(q.trim(), 200);
        resultList = data.movies || [];
      } else if (genre) {
        const data = await axios.get(`${API_BASE}/recommend/by-genre`, {
          params: { genre, n: 300 }
        }).then(r => r.data);
        resultList = data.recommendations || [];
      } else {
        const data = await fetchAllMovies(1, 500);
        resultList = data.movies || [];
      }

      // Apply Media Type filter if specified
      if (type === 'movie') {
        resultList = resultList.filter(m => !m.genres.includes('Web Series'));
      } else if (type === 'series') {
        resultList = resultList.filter(m => m.genres.includes('Web Series'));
      }

      setTotalCount(resultList.length);
      setTotalPages(Math.ceil(resultList.length / PER_PAGE) || 1);
      setMovies(resultList.slice((pg - 1) * PER_PAGE, pg * PER_PAGE));
    } catch (err) {
      console.error(err);
      setMovies([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // React to param changes
  useEffect(() => {
    const q = searchParams.get('q') || '';
    const g = searchParams.get('genre') || '';
    const t = searchParams.get('type') || 'all';
    setQuery(q);
    setGenre(g);
    setMediaType(t);
    setPage(1);
    load(q, g, t, 1);
  }, [searchParams, load]);

  const handleSearch = (e) => {
    e.preventDefault();
    const params = {};
    if (query.trim()) params.q = query.trim();
    if (activeGenre) params.genre = activeGenre;
    if (mediaType !== 'all') params.type = mediaType;
    setSearchParams(params);
  };

  const handleGenreClick = (g) => {
    const next = activeGenre === g ? '' : g;
    setGenre(next);
    const params = {};
    if (query.trim()) params.q = query.trim();
    if (next) params.genre = next;
    if (mediaType !== 'all') params.type = mediaType;
    setSearchParams(params);
  };

  const handleMediaTypeClick = (type) => {
    setMediaType(type);
    const params = {};
    if (query.trim()) params.q = query.trim();
    if (activeGenre) params.genre = activeGenre;
    if (type !== 'all') params.type = type;
    setSearchParams(params);
  };

  const handleClearFilters = () => {
    setQuery('');
    setGenre('');
    setMediaType('all');
    setSearchParams({});
  };

  const handlePageChange = (pg) => {
    setPage(pg);
    load(query, activeGenre, mediaType, pg);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const hasFilters = query.trim() || activeGenre || mediaType !== 'all';

  const getTitle = () => {
    let typeLabel = mediaType === 'series' ? 'Web Series' : mediaType === 'movie' ? 'Movies' : 'Titles';
    if (query.trim() && activeGenre) return `"${query}" · ${activeGenre} (${typeLabel})`;
    if (query.trim())  return `Search: "${query}"`;
    if (activeGenre)   return `${GENRE_ICONS[activeGenre] || '🎬'} ${activeGenre} ${typeLabel}`;
    return `All ${typeLabel}`;
  };

  return (
    <div className="browse-page">
      <div className="browse-page__container">

        {/* Page title */}
        <div className="browse-header fade-in">
          <h1 className="browse-header__title">Browse Movies &amp; Web Series</h1>
          <p className="browse-header__sub">
            Explore {totalCount > 0 ? totalCount.toLocaleString() : 'all'} movies and web series — filter by category or genre.
          </p>

          {/* Media Type Tabs */}
          <div className="media-type-tabs" style={{ display: 'flex', gap: '10px', marginTop: '16px', justifyContent: 'center' }}>
            <button
              className={`browse-genre-pill ${mediaType === 'all' ? 'browse-genre-pill--active' : ''}`}
              onClick={() => handleMediaTypeClick('all')}
              style={{ fontSize: '14px', padding: '8px 20px' }}
            >
              🌟 All Catalog
            </button>
            <button
              className={`browse-genre-pill ${mediaType === 'movie' ? 'browse-genre-pill--active' : ''}`}
              onClick={() => handleMediaTypeClick('movie')}
              style={{ fontSize: '14px', padding: '8px 20px' }}
            >
              🎬 Movies Only
            </button>
            <button
              className={`browse-genre-pill ${mediaType === 'series' ? 'browse-genre-pill--active' : ''}`}
              onClick={() => handleMediaTypeClick('series')}
              style={{ fontSize: '14px', padding: '8px 20px' }}
            >
              📺 Web Series Only
            </button>
          </div>
        </div>

        {/* Search bar */}
        <form className="browse-search" onSubmit={handleSearch}>
          <span className="browse-search__icon">🔍</span>
          <input
            className="browse-search__input"
            type="text"
            placeholder="Search by title…"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <button className="browse-search__btn" type="submit">Search</button>
        </form>

        {/* Genre pills */}
        <div className="browse-genres">
          {genres.map(g => (
            <button
              key={g}
              className={`browse-genre-pill ${activeGenre === g ? 'browse-genre-pill--active' : ''}`}
              onClick={() => handleGenreClick(g)}
            >
              {GENRE_ICONS[g] || '🎬'} {g}
            </button>
          ))}
        </div>

        {/* Active filter summary + clear */}
        {hasFilters && (
          <div className="browse-filter-bar fade-in">
            <span className="browse-filter-bar__label">Filtering by:</span>
            {mediaType !== 'all' && <span className="browse-filter-tag">{mediaType === 'series' ? '📺 Web Series' : '🎬 Movies'}</span>}
            {query.trim() && <span className="browse-filter-tag">🔍 "{query}"</span>}
            {activeGenre && <span className="browse-filter-tag">{GENRE_ICONS[activeGenre] || '🎬'} {activeGenre}</span>}
            <button className="browse-filter-clear" onClick={handleClearFilters}>✕ Clear</button>
          </div>
        )}

        {/* Grid Section */}
        <SectionHeader
          title={getTitle()}
          subtitle={
            loading
              ? 'Loading catalog…'
              : `Showing ${movies.length} of ${totalCount.toLocaleString()} results`
          }
        />

        <MovieGrid movies={movies} loading={loading} skeletonCount={PER_PAGE} />

        {/* Pagination */}
        {totalPages > 1 && !loading && (
          <div className="browse-pagination">
            <button
              className="pagination-btn"
              disabled={page === 1}
              onClick={() => handlePageChange(page - 1)}
            >
              ← Prev
            </button>

            <span className="pagination-info">
              Page {page} of {totalPages}
            </span>

            <button
              className="pagination-btn"
              disabled={page === totalPages}
              onClick={() => handlePageChange(page + 1)}
            >
              Next →
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
