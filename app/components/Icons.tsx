/*
 * 🎨 STL Platform - Minimalist SVG Icons
 * 📦 Version: 1.0.0
 * 📅 Created: 2026-03-24
 */

type IconProps = {
  color?: string;
  size?: number;
  className?: string;
};

export function PaletteIcon({ color = "currentColor", size = 48, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c.55 0 1-.45 1-1 0-.26-.1-.51-.26-.7-.16-.18-.26-.43-.26-.7 0-.55.45-1 1-1h1.18c3.03 0 5.5-2.47 5.5-5.5C20.16 5.48 16.52 2 12 2zm-5.5 9c-.83 0-1.5-.67-1.5-1.5S5.67 8 6.5 8 8 8.67 8 9.5 7.33 11 6.5 11zm3-4C8.67 7 8 6.33 8 5.5S8.67 4 9.5 4s1.5.67 1.5 1.5S10.33 7 9.5 7zm5 0c-.83 0-1.5-.67-1.5-1.5S13.67 4 14.5 4s1.5.67 1.5 1.5S15.33 7 14.5 7zm3 4c-.83 0-1.5-.67-1.5-1.5S16.67 8 17.5 8s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" fill={color}/>
    </svg>
  );
}

export function VideoIcon({ color = "currentColor", size = 48, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M18 4H6C4.9 4 4 4.9 4 6v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H6V6h12v12zM10 15l5-3-5-3v6z" fill={color}/>
    </svg>
  );
}

export function CubeIcon({ color = "currentColor", size = 48, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M12 2L2 7v10l10 5 10-5V7L12 2zm0 2.18l7.5 3.75L12 11.68 4.5 7.93 12 4.18zM4 9.47l7 3.5v7.36l-7-3.5V9.47zm9 10.86v-7.36l7-3.5v7.36l-7 3.5z" fill={color}/>
    </svg>
  );
}

export function SparkleIcon({ color = "currentColor", size = 48, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M12 2l2.4 7.2H22l-6 4.8 2.4 7.2L12 16.8 5.6 21.2 8 14l-6-4.8h7.6L12 2z" fill={color}/>
      <circle cx="6" cy="6" r="1.5" fill={color}/>
      <circle cx="18" cy="6" r="1.5" fill={color}/>
    </svg>
  );
}

export function MaskIcon({ color = "currentColor", size = 48, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M12 2C8.69 2 6 4.69 6 8v2c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V8c0-3.31-2.69-6-6-6zm-2 8c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm4 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-2 4c-2.21 0-4 1.79-4 4v2h8v-2c0-2.21-1.79-4-4-4z" fill={color}/>
    </svg>
  );
}

export function PeopleIcon({ color = "currentColor", size = 48, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" fill={color}/>
    </svg>
  );
}

export function HeartIcon({ color = "currentColor", size = 48, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill={color}/>
    </svg>
  );
}

export function FrameIcon({ color = "currentColor", size = 48, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M21 3H3C2 3 1 4 1 5v14c0 1.1.9 2 2 2h18c1 0 2-1 2-2V5c0-1-1-2-2-2zm0 15.92c-.02.03-.06.06-.08.08H3V5.08L3.08 5h17.83c.03.02.06.06.08.08v13.84zm-10-3.41L8.5 12.5 5 17h14l-4.5-6z" fill={color}/>
    </svg>
  );
}

export function StarIcon({ color = "currentColor", size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" fill={color}/>
    </svg>
  );
}
