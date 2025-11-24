// constants.tsx
import React from 'react';

export const PROJECT_NAME = "Associação dos Empreendedores Criativos do Cariri";
export const ASSOCIATION_ACRONYM = "AECC";
export const ERP_NAME = "ERP_AECC";
export const VERSION = "1.0.2";
export const LOGO_BASE64 = "[PLACEHOLDER_LOGO]";

// Logo da AECC como um componente SVG em React.
// Esta abordagem é mais robusta, leve e garante que a imagem sempre será renderizada corretamente.
export const LogoAECC: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 100 100"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="Logo da AECC"
  >
    <defs>
        <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            {/* Corresponde ao `secondary-700` e `secondary-500` do tema */}
            <stop offset="0%" style={{ stopColor: '#2d5e4d' }} /> 
            <stop offset="100%" style={{ stopColor: '#43846c' }} />
        </linearGradient>
    </defs>
    <rect width="100" height="100" rx="20" fill="url(#logoGradient)" />
    <text
      x="50"
      y="55"
      fontFamily="Inter, sans-serif"
      fontSize="38"
      fontWeight="bold"
      fill="white"
      textAnchor="middle"
      dominantBaseline="middle"
    >
      AECC
    </text>
  </svg>
);