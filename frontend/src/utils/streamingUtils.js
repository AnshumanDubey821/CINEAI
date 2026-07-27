// src/utils/streamingUtils.js
// Utility to generate search and direct streaming links for major platforms.

export const STREAMING_PROVIDERS = [
  {
    id: 'netflix',
    name: 'Netflix',
    icon: '🔴',
    color: '#E50914',
    bg: 'linear-gradient(135deg, #E50914 0%, #B81D24 100%)',
    getUrl: (title) => `https://www.netflix.com/search?q=${encodeURIComponent(title)}`,
  },
  {
    id: 'hotstar',
    name: 'Disney+ Hotstar',
    icon: '✨',
    color: '#13357B',
    bg: 'linear-gradient(135deg, #113CCF 0%, #001253 100%)',
    getUrl: (title) => `https://www.hotstar.com/in/search?q=${encodeURIComponent(title)}`,
  },
  {
    id: 'prime',
    name: 'Prime Video',
    icon: '📦',
    color: '#00A8E1',
    bg: 'linear-gradient(135deg, #00A8E1 0%, #005F83 100%)',
    getUrl: (title) => `https://www.primevideo.com/search/ref=atv_nb_sr?phrase=${encodeURIComponent(title)}`,
  },
  {
    id: 'jiocinema',
    name: 'JioCinema',
    icon: '🍿',
    color: '#D4006B',
    bg: 'linear-gradient(135deg, #E10078 0%, #850043 100%)',
    getUrl: (title) => `https://www.jiocinema.com/search/${encodeURIComponent(title)}`,
  },
  {
    id: 'apple',
    name: 'Apple TV+',
    icon: '🍏',
    color: '#A2AAAD',
    bg: 'linear-gradient(135deg, #2A2A2E 0%, #111113 100%)',
    getUrl: (title) => `https://tv.apple.com/search?term=${encodeURIComponent(title)}`,
  },
];

export function getStreamingLinks(movieTitle) {
  const cleanTitle = (movieTitle || '').replace(/\s*\(\d{4}\)$/, '').trim();
  return STREAMING_PROVIDERS.map(provider => ({
    ...provider,
    link: provider.getUrl(cleanTitle),
  }));
}
