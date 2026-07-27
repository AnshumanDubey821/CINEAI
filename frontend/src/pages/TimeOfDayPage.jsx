// src/pages/TimeOfDayPage.jsx
// Recommends movies based on the time of day with a gorgeous animated sky background.
import React, { useState, useEffect, useRef } from 'react';
import { fetchTimeSlot, fetchAllSlotPreviews } from '../utils/api';
import MovieGrid from '../components/MovieGrid';
import SectionHeader from '../components/SectionHeader';
import './TimeOfDayPage.css';

// ── Slot configuration (mirrors backend, used for UI only) ──────────────────
const SLOTS = [
  {
    key:       'morning',
    emoji:     '🌅',
    label:     'Morning',
    hours:     '5 AM – 11 AM',
    mood:      'Uplifting & Inspiring',
    tagline:   'Start your day right',
    desc:      'Animated wonders, comedies, and feel-good stories to brighten your morning.',
    genres:    ['Animation', 'Comedy', 'Family', 'Music'],
    palette:   'morning',
  },
  {
    key:       'afternoon',
    emoji:     '☀️',
    label:     'Afternoon',
    hours:     '12 PM – 4 PM',
    mood:      'Action-Packed & Bold',
    tagline:   'Keep the energy high',
    desc:      'Blockbusters, sci-fi epics, and high-octane adventures for your peak hours.',
    genres:    ['Action', 'Adventure', 'Sci-Fi', 'Sport'],
    palette:   'afternoon',
  },
  {
    key:       'evening',
    emoji:     '🌆',
    label:     'Evening',
    hours:     '5 PM – 9 PM',
    mood:      'Dramatic & Rewarding',
    tagline:   'Settle in for greatness',
    desc:      'Deep dramas, compelling romances, and cinematic masterpieces for your evening.',
    genres:    ['Drama', 'Crime', 'Romance', 'History'],
    palette:   'evening',
  },
  {
    key:       'night',
    emoji:     '🌙',
    label:     'Night',
    hours:     '10 PM – 4 AM',
    mood:      'Intense & Atmospheric',
    tagline:   'Embrace the darkness',
    desc:      'Psychological thrillers, horror, and noir for those who stay up late.',
    genres:    ['Horror', 'Thriller', 'Mystery', 'Fantasy'],
    palette:   'night',
  },
];

// ── Detect current slot from local time ────────────────────────────────────
function detectCurrentSlot() {
  const h = new Date().getHours();
  if (h >= 5  && h < 12) return 'morning';
  if (h >= 12 && h < 17) return 'afternoon';
  if (h >= 17 && h < 22) return 'evening';
  return 'night';
}

// ── Sky / ambient animation particles ──────────────────────────────────────
function SkyCanvas({ palette }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;
    let particles = [];

    const configs = {
      morning:   { bg: ['#FF9A5C','#FFD580','#FFEEDD'], particleColor: 'rgba(255,230,150,0.7)', count: 35, speed: 0.3  },
      afternoon: { bg: ['#87CEEB','#4A9FD5','#FFF8E7'], particleColor: 'rgba(255,255,255,0.6)', count: 25, speed: 0.2  },
      evening:   { bg: ['#FF6B35','#C0392B','#4A1942'], particleColor: 'rgba(255,160,80,0.5)',  count: 40, speed: 0.25 },
      night:     { bg: ['#0D0D2B','#1A1A4E','#0A0A1A'], particleColor: 'rgba(220,220,255,0.8)', count: 80, speed: 0.15 },
    };

    const cfg = configs[palette] || configs.night;

    const resize = () => {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Initialise particles
    for (let i = 0; i < cfg.count; i++) {
      particles.push({
        x:    Math.random() * canvas.width,
        y:    Math.random() * canvas.height,
        r:    palette === 'night' ? Math.random() * 2 + 0.5 : Math.random() * 4 + 2,
        vx:   (Math.random() - 0.5) * cfg.speed,
        vy:   -Math.random() * cfg.speed,
        o:    Math.random(),
        dO:   (Math.random() - 0.5) * 0.01,
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Background gradient
      const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      cfg.bg.forEach((c, i) => grad.addColorStop(i / (cfg.bg.length - 1), c));
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Particles (stars or dust motes)
      particles.forEach(p => {
        p.x  = (p.x  + p.vx + canvas.width)  % canvas.width;
        p.y  = (p.y  + p.vy + canvas.height) % canvas.height;
        p.o += p.dO;
        if (p.o > 1 || p.o < 0) p.dO *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = cfg.particleColor.replace('0.', `${Math.max(0.1, p.o).toFixed(2)}.`).replace(/\.\d+\./, '.');
        ctx.fillStyle = cfg.particleColor;
        ctx.globalAlpha = Math.max(0.05, p.o);
        ctx.fill();
        ctx.globalAlpha = 1;
      });

      // Lens-flare orb for morning/afternoon
      if (palette === 'morning' || palette === 'afternoon') {
        const cx = canvas.width * 0.82, cy = canvas.height * 0.18;
        const sunGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 120);
        sunGrad.addColorStop(0, 'rgba(255,240,180,0.35)');
        sunGrad.addColorStop(1, 'rgba(255,200,80,0)');
        ctx.fillStyle = sunGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, 120, 0, Math.PI * 2);
        ctx.fill();
      }

      // Moon for night
      if (palette === 'night') {
        const mx = canvas.width * 0.8, my = canvas.height * 0.15;
        const moonGrad = ctx.createRadialGradient(mx, my, 0, mx, my, 50);
        moonGrad.addColorStop(0, 'rgba(220,220,255,0.22)');
        moonGrad.addColorStop(1, 'rgba(100,100,200,0)');
        ctx.fillStyle = moonGrad;
        ctx.beginPath();
        ctx.arc(mx, my, 50, 0, Math.PI * 2);
        ctx.fill();
      }

      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, [palette]);

  return <canvas ref={canvasRef} className="sky-canvas" />;
}

// ── Clock display ───────────────────────────────────────────────────────────
function LiveClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <span className="live-clock">
      {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
    </span>
  );
}

// ── Slot selector tab ───────────────────────────────────────────────────────
function SlotTab({ slot, isActive, isCurrent, onClick }) {
  return (
    <button
      className={`slot-tab slot-tab--${slot.palette} ${isActive ? 'slot-tab--active' : ''} ${isCurrent ? 'slot-tab--current' : ''}`}
      onClick={onClick}
      aria-label={`${slot.label} recommendations`}
    >
      <span className="slot-tab__emoji">{slot.emoji}</span>
      <span className="slot-tab__label">{slot.label}</span>
      <span className="slot-tab__hours">{slot.hours}</span>
      {isCurrent && <span className="slot-tab__now">NOW</span>}
    </button>
  );
}

// ── Main Page ───────────────────────────────────────────────────────────────
export default function TimeOfDayPage() {
  const autoSlot                    = detectCurrentSlot();
  const [activeSlot, setActiveSlot] = useState(autoSlot);
  const [movies, setMovies]         = useState([]);
  const [slotData, setSlotData]     = useState(null);
  const [loading, setLoading]       = useState(true);
  const [numRecs, setNumRecs]       = useState(12);
  const resultsRef                  = useRef(null);

  const slotInfo = SLOTS.find(s => s.key === activeSlot);

  // Load recommendations whenever slot or count changes
  useEffect(() => {
    setLoading(true);
    fetchTimeSlot(activeSlot, numRecs)
      .then(data => {
        setMovies(data.recommendations || []);
        setSlotData(data);
      })
      .catch(() => setMovies([]))
      .finally(() => setLoading(false));
  }, [activeSlot, numRecs]);

  const handleSlotChange = (key) => {
    if (key === activeSlot) return;
    setActiveSlot(key);
    setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
  };

  return (
    <div className={`tod-page tod-page--${activeSlot}`}>

      {/* ── Animated Sky Hero ─────────────────────────────────────────── */}
      <div className="tod-hero">
        <SkyCanvas palette={activeSlot} />

        <div className="tod-hero__overlay" />

        <div className="tod-hero__content">
          <div className="tod-hero__clock-row">
            <LiveClock />
            <span className="tod-hero__now-badge">
              {slotInfo?.emoji} {slotInfo?.label} Mode
            </span>
          </div>

          <h1 className="tod-hero__title">
            {slotInfo?.emoji} {slotData?.label || slotInfo?.label}
          </h1>
          <p className="tod-hero__tagline">{slotData?.tagline || slotInfo?.tagline}</p>
          <p className="tod-hero__mood">
            <span className="tod-hero__mood-label">Mood:</span> {slotData?.mood || slotInfo?.mood}
          </p>
          <p className="tod-hero__desc">{slotData?.description || slotInfo?.desc}</p>

          {/* Genre pills */}
          <div className="tod-hero__genres">
            {(slotData?.primary_genres || slotInfo?.genres || []).map(g => (
              <span key={g} className="tod-genre-pill">{g}</span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Slot Selector Tabs ─────────────────────────────────────────── */}
      <div className="tod-tabs-wrapper">
        <div className="tod-tabs">
          {SLOTS.map(slot => (
            <SlotTab
              key={slot.key}
              slot={slot}
              isActive={activeSlot === slot.key}
              isCurrent={slot.key === autoSlot}
              onClick={() => handleSlotChange(slot.key)}
            />
          ))}
        </div>
      </div>

      {/* ── Results ───────────────────────────────────────────────────── */}
      <div className="tod-results container" ref={resultsRef}>

        {/* Count control */}
        <div className="tod-controls">
          <span className="tod-controls__label">Showing</span>
          <div className="tod-controls__pills">
            {[8, 12, 16, 24].map(n => (
              <button
                key={n}
                className={`tod-count-btn ${numRecs === n ? 'tod-count-btn--active' : ''}`}
                onClick={() => setNumRecs(n)}
              >
                {n}
              </button>
            ))}
          </div>
          <span className="tod-controls__label">movies</span>
        </div>

        <SectionHeader
          title={`${slotInfo?.emoji} ${slotInfo?.label} Picks`}
          subtitle={`${movies.length} hand-picked ${slotInfo?.mood?.toLowerCase()} films for ${slotInfo?.hours}`}
        />

        <MovieGrid
          movies={movies}
          loading={loading}
          skeletonCount={numRecs}
          emptyMessage="No movies found for this time slot."
        />
      </div>

      {/* ── All Slots Preview Strip ────────────────────────────────────── */}
      <div className="tod-strip-section container">
        <SectionHeader
          title="🕐 Explore All Time Slots"
          subtitle="Every slot has its own curated collection"
        />
        <div className="tod-strip-grid">
          {SLOTS.map(slot => (
            <button
              key={slot.key}
              className={`tod-strip-card tod-strip-card--${slot.palette} ${activeSlot === slot.key ? 'tod-strip-card--active' : ''}`}
              onClick={() => handleSlotChange(slot.key)}
            >
              <div className="tod-strip-card__emoji">{slot.emoji}</div>
              <div className="tod-strip-card__label">{slot.label}</div>
              <div className="tod-strip-card__hours">{slot.hours}</div>
              <div className="tod-strip-card__mood">{slot.mood}</div>
              <div className="tod-strip-card__genres">
                {slot.genres.slice(0, 3).join(' · ')}
              </div>
              {slot.key === autoSlot && (
                <div className="tod-strip-card__now-badge">You are here</div>
              )}
            </button>
          ))}
        </div>
      </div>

    </div>
  );
}
