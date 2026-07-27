// src/utils/api.js
// Centralized Axios instance for all backend API calls.
// The proxy in package.json forwards requests to http://localhost:8000

import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Movies ────────────────────────────────────────────────────────────────────

export const fetchTrending = (n = 20) =>
  api.get(`/movies/trending?n=${n}`).then(r => r.data);

export const fetchAllMovies = (page = 1, perPage = 50) =>
  api.get(`/movies/?page=${page}&per_page=${perPage}`).then(r => r.data);

export const fetchMovieById = (id) =>
  api.get(`/movies/${id}`).then(r => r.data);

export const searchMovies = (query, n = 20) =>
  api.get(`/movies/search?q=${encodeURIComponent(query)}&n=${n}`).then(r => r.data);

export const fetchGenres = () =>
  api.get('/movies/genres').then(r => r.data);

// ── Recommendations ───────────────────────────────────────────────────────────

export const recommendByMovie = (movieId, n = 10, method = 'hybrid') =>
  api.post('/recommend/by-movie', { movie_id: movieId, n, method }).then(r => r.data);

export const recommendByGenre = (genre, n = 10) =>
  api.post('/recommend/by-genre', { genre, n }).then(r => r.data);

export const fetchSimilar = (movieId, n = 10, method = 'hybrid') =>
  api.get(`/recommend/similar/${movieId}?n=${n}&method=${method}`).then(r => r.data);

export default api;

// ── Time-Based Recommendations ────────────────────────────────────────────────

export const fetchTimeNow = (n = 12) =>
  api.get(`/recommend/time/now?n=${n}`).then(r => r.data);

export const fetchTimeSlot = (slot, n = 12) =>
  api.get(`/recommend/time/slot/${slot}?n=${n}`).then(r => r.data);

export const fetchAllSlotPreviews = (n = 6) =>
  api.get(`/recommend/time/all?n=${n}`).then(r => r.data);
