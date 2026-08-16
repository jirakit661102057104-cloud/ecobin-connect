import React from 'react';

interface BrandLogoProps {
  className?: string;
  alt?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  className = 'w-9 h-9',
  alt = 'EcoBin Connect',
}) => (
  <img
    src="/ecobin-logo.png"
    alt={alt}
    className={`rounded-xl object-cover shadow-sm ring-1 ring-white/40 ${className}`}
  />
);
