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
        
        {/* Back of Card (Face Down) - Sage green texture */}
        <div className="absolute w-full h-full backface-hidden rounded-full tactile-shadow wood-texture border-[3px] border-slate-700/50 flex items-center justify-center">
          {/* Subtle pattern on back with layered depth */}
          <div className="w-[90%] h-[90%] rounded-full border-2 border-slate-600/40 flex items-center justify-center relative overflow-hidden">
            {/* Subtle texture overlay */}
            <div className="absolute inset-0 opacity-15">
              <div className="w-full h-full" style={{
                backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 3px, rgba(0,0,0,0.08) 3px, rgba(0,0,0,0.08) 6px)`
              }}></div>
            </div>
            {/* Subtle symbol hint with depth */}
            <span className="text-slate-700/40 text-xs sm:text-sm font-serif relative z-10 drop-shadow-sm">卦</span>
          </div>
        </div>

        {/* Front of Card (Face Up) - Revealed piece */}
        <div className="absolute w-full h-full backface-hidden rotate-y-180 rounded-full tactile-shadow wood-texture border-[3px] border-slate-600/60 flex items-center justify-center">
           {/* Inner Ring with layered borders for depth */}
           <div className="w-[88%] h-[88%] rounded-full border-2 border-slate-500/50 flex items-center justify-center relative">
              {/* Inner glow ring */}
              <div className="absolute inset-0 rounded-full border border-slate-400/30"></div>
              <span className={`text-2xl sm:text-3xl md:text-4xl font-bold relative z-10 ${piece.color === PieceColor.RED ? 'text-red-900 drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]' : 'text-black drop-shadow-[0_2px_4px_rgba(255,255,255,0.3)]'}`}>
                {piece.label}
              </span>
           </div>
        </div>
      </div>
    </div>
  );
};
