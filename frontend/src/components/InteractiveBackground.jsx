// src/components/InteractiveBackground.jsx
// Interactive dynamic mesh background with mouse-tracking aura glow & ambient drift
import React, { useEffect, useState } from 'react';
import './InteractiveBackground.css';

export default function InteractiveBackground() {
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      // Calculate percentage coordinates
      const x = Math.round((e.clientX / window.innerWidth) * 100);
      const y = Math.round((e.clientY / window.innerHeight) * 100);
      setMousePos({ x, y });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="interactive-bg" aria-hidden="true">
      {/* Mouse tracker glow aura */}
      <div
        className="interactive-bg__cursor-glow"
        style={{
          left: `${mousePos.x}%`,
          top: `${mousePos.y}%`,
        }}
      />

      {/* Floating ambient glowing blobs */}
      <div className="interactive-bg__blob interactive-bg__blob--gold" />
      <div className="interactive-bg__blob interactive-bg__blob--purple" />
      <div className="interactive-bg__blob interactive-bg__blob--blue" />
      <div className="interactive-bg__blob interactive-bg__blob--teal" />

      {/* Subtle cosmic grid overlay */}
      <div className="interactive-bg__grid" />
    </div>
  );
}
