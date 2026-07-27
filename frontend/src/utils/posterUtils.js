// src/utils/posterUtils.js
// High-performance movie poster resolution with pre-fetched poster dataset + secure server proxy fallback.
import prefetchedPosters from './movie_posters.json';

const POSTER_CACHE_KEY = 'cineai_poster_cache_v3';
const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000';

function getCache() {
  try {
    const cached = localStorage.getItem(POSTER_CACHE_KEY);
    return cached ? JSON.parse(cached) : {};
  } catch (e) {
    return {};
  }
}

function saveCache(cache) {
  try {
    localStorage.setItem(POSTER_CACHE_KEY, JSON.stringify(cache));
  } catch (e) {}
}

const posterCache = getCache();

/**
 * Fetch high-res poster URL for any movie.
 * 1. Checks pre-fetched dataset by movieId (0ms local lookup)
 * 2. Checks local storage cache
 * 3. Calls secure server proxy (GET /poster/fetch) — API key hidden on backend
 * 4. Fallback to stylized SVG poster
 */
export async function fetchMoviePoster(title, year, movieId) {
  if (movieId && prefetchedPosters && prefetchedPosters[String(movieId)]) {
    return prefetchedPosters[String(movieId)];
  }

  if (!title) return null;

  const cleanTitle = title.replace(/\s*\(\d{4}\)$/, '').trim();
  const cacheKey = `${cleanTitle}_${year || ''}`;

  if (posterCache[cacheKey]) {
    return posterCache[cacheKey];
  }

  // Call secure server-side poster proxy (API key hidden on backend)
  try {
    const query = encodeURIComponent(cleanTitle);
    const yearParam = year ? `&year=${year}` : '';
    const res = await fetch(`${API_BASE}/poster/fetch?title=${query}${yearParam}`);
    const data = await res.json();

    if (data && data.poster) {
      posterCache[cacheKey] = data.poster;
      saveCache(posterCache);
      return data.poster;
    }
  } catch (err) {
    console.warn('Backend poster proxy fetch failed for:', cleanTitle, err);
  }

  // Fallback SVG poster
  const fallback = getFallbackPoster(cleanTitle, year);
  posterCache[cacheKey] = fallback;
  saveCache(posterCache);
  return fallback;
}

export const fetchTMDBPoster = fetchMoviePoster;

export function getFallbackPoster(title = 'Movie', year = '', genres = '') {
  const cleanTitle = title.replace(/\s*\(\d{4}\)$/, '').trim();
  const hues = [
    ['#1a1a2e', '#16213e', '#0f3460'],
    ['#2d1b69', '#9a0078', '#11998e'],
    ['#3a0000', '#7b0000', '#c20000'],
    ['#0f2027', '#203a43', '#2c5364'],
    ['#2b5876', '#4e4376', '#141e30'],
  ];
  const [c1, c2, c3] = hues[cleanTitle.length % hues.length];
  const displayTitle = cleanTitle.length > 28 ? cleanTitle.slice(0, 25) + '...' : cleanTitle;

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="500" height="750" viewBox="0 0 500 750">
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${c1}"/>
          <stop offset="50%" stop-color="${c2}"/>
          <stop offset="100%" stop-color="${c3}"/>
        </linearGradient>
      </defs>
      <rect width="500" height="750" fill="url(#g)"/>
      <circle cx="250" cy="280" r="160" fill="#ffffff" opacity="0.04"/>
      <text x="250" y="300" font-family="sans-serif" font-size="100" text-anchor="middle" fill="#ffffff" opacity="0.35">🎬</text>
      <rect x="25" y="500" width="450" height="200" rx="16" fill="#000000" opacity="0.5"/>
      <text x="250" y="565" font-family="sans-serif" font-size="28" font-weight="bold" text-anchor="middle" fill="#ffffff">${escapeXml(displayTitle)}</text>
      <text x="250" y="605" font-family="sans-serif" font-size="18" text-anchor="middle" fill="#E50914">${year || ''}</text>
      <text x="250" y="645" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#cccccc" opacity="0.8">${escapeXml((genres || 'Cinema').replace(/\|/g, ' • '))}</text>
    </svg>
  `;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function escapeXml(str) {
  return str.replace(/[<>&'"]/g, c => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}
