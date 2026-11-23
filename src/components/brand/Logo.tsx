import React from 'react';

const LOGO_URL = "/Logo.png";

interface LogoProps {
  compact?: boolean;
  scale?: number;
  className?: string;
}

/** Crops the padded logo artwork to the wordmark (or just the Q mark when compact). */
export function Logo({ compact = false, scale = 0.075, className = '' }: LogoProps) {
  const width = (compact ? 385 : 1440) * scale;
  const height = 400 * scale;
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full border border-[#eadbc4] bg-white ${
      compact ? 'h-11 w-11' : 'h-12 px-4'} ${
      className}`}>
      
      <span
        role="img"
        aria-label="Queldrin"
        className="block bg-no-repeat"
        style={{
          width,
          height,
          backgroundImage: `url(${LOGO_URL})`,
          backgroundSize: `${1500 * scale}px ${1000 * scale}px`,
          backgroundPosition: `${-30 * scale}px ${-300 * scale}px`
        }} />
      
    </span>);

}