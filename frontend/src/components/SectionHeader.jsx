// src/components/SectionHeader.jsx
import React from 'react';
import './SectionHeader.css';

export default function SectionHeader({ title, subtitle, action }) {
  return (
    <div className="section-header">
      <div className="section-header__text">
        <h2 className="section-header__title">{title}</h2>
        {subtitle && <p className="section-header__sub">{subtitle}</p>}
      </div>
      {action && <div className="section-header__action">{action}</div>}
    </div>
  );
}
