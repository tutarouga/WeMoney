import React from 'react';

export function Logo({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <rect width="120" height="120" rx="35" fill="#5b4efc"/>
      
      {/* Plant */}
      <path d="M57 38 V26" stroke="white" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M57 32 C47 32 41 24 41 16 C51 16 57 24 57 32 Z" stroke="white" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M57 26 C65 26 71 18 71 10 C63 10 57 18 57 26 Z" stroke="white" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round"/>

      {/* Wallet */}
      <path d="M28 58 H76 C81.5 58 86 53.5 86 48 C86 42.5 81.5 38 76 38 H38 C32.5 38 28 42.5 28 48 V92 C28 97.5 32.5 102 38 102 H76 C81.5 102 86 97.5 86 92 V70" stroke="white" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round"/>
      
      {/* Rings Background Mask */}
      <circle cx="76" cy="92" r="16" fill="#5b4efc"/>
      <circle cx="94" cy="92" r="16" fill="#5b4efc"/>
      
      {/* Left Ring */}
      <circle cx="76" cy="92" r="10" stroke="white" strokeWidth="5"/>
      
      {/* Right Ring */}
      <circle cx="94" cy="92" r="10" stroke="white" strokeWidth="5"/>
      
      {/* Interlock Overlap */}
      <path d="M85 84.5 A 10 10 0 0 0 85 99.5" stroke="white" strokeWidth="5" strokeLinecap="round"/>
    </svg>
  );
}
