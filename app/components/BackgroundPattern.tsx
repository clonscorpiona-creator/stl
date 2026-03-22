/*
 * 🔳 STL Platform - Background Pattern Component
 * 📦 Version: 1.0.0
 * 📅 Created: 2026-03-21
 * 👥 Developers: CERDEX, Claude (Anthropic)
 */

"use client";

import { useEffect, useState } from "react";

export default function BackgroundPattern() {
  const [patternStyle, setPatternStyle] = useState<React.CSSProperties>({});

  useEffect(() => {
    // 🎨 Apply background pattern based on theme settings
    async function applyPattern() {
      try {
        const res = await fetch('/api/theme/current');
        const data = await res.json();

        if (res.ok && data.settings) {
          const pattern = data.settings['background-pattern'] || 'none';
          const opacity = parseFloat(data.settings['background-pattern-opacity'] || '0.1');
          const size = parseInt(data.settings['background-pattern-size'] || '20');

          if (pattern === 'none') {
            setPatternStyle({ display: 'none' });
            return;
          }

          // 🎨 Generate SVG pattern
          let svgPattern = '';

          switch (pattern) {
            case 'dots':
              svgPattern = `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg"><circle cx="${size/2}" cy="${size/2}" r="2" fill="rgba(0,0,0,${opacity})"/></svg>`;
              break;
            case 'grid':
              svgPattern = `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg"><path d="M 0 0 L ${size} 0 L ${size} ${size} L 0 ${size} Z" fill="none" stroke="rgba(0,0,0,${opacity})" stroke-width="1"/></svg>`;
              break;
            case 'lines':
              svgPattern = `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg"><line x1="0" y1="0" x2="0" y2="${size}" stroke="rgba(0,0,0,${opacity})" stroke-width="1"/></svg>`;
              break;
            case 'diagonal':
              svgPattern = `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg"><line x1="0" y1="0" x2="${size}" y2="${size}" stroke="rgba(0,0,0,${opacity})" stroke-width="1"/></svg>`;
              break;
            case 'crosses':
              svgPattern = `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg"><line x1="${size/2}" y1="0" x2="${size/2}" y2="${size}" stroke="rgba(0,0,0,${opacity})" stroke-width="1"/><line x1="0" y1="${size/2}" x2="${size}" y2="${size/2}" stroke="rgba(0,0,0,${opacity})" stroke-width="1"/></svg>`;
              break;
          }

          if (svgPattern) {
            const encodedSvg = encodeURIComponent(svgPattern);
            setPatternStyle({
              backgroundImage: `url("data:image/svg+xml,${encodedSvg}")`,
              backgroundRepeat: 'repeat',
              backgroundSize: `${size}px ${size}px`,
            });
          }
        }
      } catch (error) {
        console.error('Failed to apply background pattern:', error);
      }
    }

    applyPattern();
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: -1,
        pointerEvents: 'none',
        ...patternStyle,
      }}
    />
  );
}
