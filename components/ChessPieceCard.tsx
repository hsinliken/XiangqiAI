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
      className={`relative w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 cursor-pointer perspective-1000 ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${isSelected ? 'opacity-0 pointer-events-none transition-opacity duration-700' : ''}`}
      onClick={() => !disabled && !isSelected && onClick()}
    >
      <div className={`w-full h-full relative transition-transform duration-700 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
        
        {/* Back of Card (Face Down) */}
        <div className="absolute w-full h-full backface-hidden rounded-full shadow-md bg-gradient-to-br from-red-900 to-red-950 border-2 border-yellow-700 flex items-center justify-center">
          <div className="w-3/4 h-3/4 rounded-full border border-red-800/50 flex items-center justify-center opacity-40">
            <span className="text-yellow-700 text-xs sm:text-sm font-serif">卦</span>
          </div>
        </div>

        {/* Front of Card (Face Up) */}
        <div className="absolute w-full h-full backface-hidden rotate-y-180 rounded-full shadow-lg wood-texture border-4 border-yellow-800/60 flex items-center justify-center">
           {/* Inner Ring */}
           <div className="w-[85%] h-[85%] rounded-full border-2 border-yellow-900/30 flex items-center justify-center dashed-border">
              <span className={`font-serif text-2xl sm:text-3xl md:text-4xl font-bold ${piece.color === PieceColor.RED ? 'text-red-700' : 'text-black'}`}>
                {piece.label}
              </span>
           </div>
        </div>
      </div>
    </div>
  );
};
