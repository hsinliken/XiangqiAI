import React from 'react';
import { ChessPiece, PieceColor } from '../types';

interface ChessPieceCardProps {
  piece: ChessPiece;
  isFlipped: boolean;
  onClick: () => void;
  disabled?: boolean;
  isSelected?: boolean;
}

export const ChessPieceCard: React.FC<ChessPieceCardProps> = ({
  piece,
  isFlipped,
  onClick,
  disabled,
  isSelected
}) => {
  return (
    <div
      className={`relative w-14 h-14 sm:w-18 sm:h-18 md:w-24 md:h-24 cursor-pointer perspective-1000 transition-all duration-300 ${disabled ? 'opacity-40 cursor-not-allowed' : 'hover:scale-110'} ${isSelected ? 'opacity-0 pointer-events-none transition-opacity duration-700' : ''}`}
      onClick={() => !disabled && !isSelected && onClick()}
    >
      <div className={`w-full h-full relative transition-transform duration-700 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>

        {/* Back of Card (Face Down) - Orange Red Sphere */}
        <div className="absolute w-full h-full backface-hidden rounded-full bg-gradient-to-br from-orange-400 via-red-500 to-red-700 shadow-[0_0_15px_rgba(239,68,68,0.6)] flex items-center justify-center border border-orange-300/30">
          {/* Circuit pattern overlay */}
          <div className="absolute inset-0 rounded-full circuit-pattern opacity-40 mix-blend-overlay"></div>

          {/* Inner glow ring */}
          <div className="absolute inset-[15%] rounded-full border border-yellow-200/30 glow-ring bg-gradient-to-tr from-transparent via-orange-500/10 to-transparent"></div>

          {/* Center symbol */}
          <div className="relative z-10 flex flex-col items-center justify-center">
            <span className="text-yellow-100/90 text-xs sm:text-sm font-serif drop-shadow-[0_0_8px_rgba(251,191,36,0.8)] animate-pulse-slow">卜卦</span>
          </div>

          {/* Floating particles effect */}
          <div className="absolute inset-0 rounded-full particle-field"></div>
        </div>

        {/* Front of Card (Face Up) - Revealed piece with holographic effect */}
        <div className="absolute w-full h-full backface-hidden rotate-y-180 rounded-full holographic-sphere flex items-center justify-center">
          {/* Circuit pattern overlay */}
          <div className="absolute inset-0 rounded-full circuit-pattern opacity-60"></div>

          {/* Inner glow ring */}
          <div className="absolute inset-[15%] rounded-full border border-cyan-400/40 glow-ring"></div>

          {/* Center piece label */}
          <div className="relative z-10 flex items-center justify-center">
            <span className={`text-2xl sm:text-3xl md:text-4xl font-bold holographic-text ${piece.color === PieceColor.RED ? 'text-red-400' : 'text-cyan-300'}`}>
              {piece.label}
            </span>
          </div>

          {/* Floating particles effect */}
          <div className="absolute inset-0 rounded-full particle-field"></div>
        </div>
      </div>
    </div>
  );
};
