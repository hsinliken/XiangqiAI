import React from 'react';
import { ChessPiece, SlotPosition, SLOT_LABELS, PieceColor } from '../types';

interface LayoutSlotsProps {
  selectedPieces: Record<SlotPosition, ChessPiece | null>;
  nextSlot: SlotPosition | null;
}

export const LayoutSlots: React.FC<LayoutSlotsProps> = ({ selectedPieces, nextSlot }) => {
  
  const renderSlot = (position: SlotPosition) => {
    const piece = selectedPieces[position];
    const isNext = nextSlot === position;
    const hasPiece = !!piece;

    return (
      <div className={`flex flex-col items-center justify-center transition-all duration-500 ${isNext ? 'scale-110' : 'scale-100'}`}>
        <div className={`
          relative w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full 
          flex items-center justify-center
          ${hasPiece ? 'wood-texture border-[3px] border-slate-600/60 tactile-shadow' : 'bg-slate-700/15 border-2 border-dashed border-slate-600/40'}
          ${isNext && !hasPiece ? 'animate-pulse border-slate-500/50 bg-slate-700/25 warm-glow' : ''}
        `}>
          {hasPiece ? (
            <div className="w-[88%] h-[88%] rounded-full border-2 border-slate-500/50 flex items-center justify-center relative">
              {/* Inner glow ring for depth */}
              <div className="absolute inset-0 rounded-full border border-slate-400/30"></div>
              <span className={`text-3xl sm:text-4xl md:text-5xl font-bold relative z-10 ${piece?.color === PieceColor.RED ? 'text-red-900 drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]' : 'text-black drop-shadow-[0_2px_4px_rgba(255,255,255,0.3)]'}`}>
                {piece?.label}
              </span>
            </div>
          ) : (
            <span className="text-slate-700/50 text-xs sm:text-sm font-serif">{SLOT_LABELS[position].split(' ')[0]}</span>
          )}
        </div>
        <span className="mt-2 text-xs text-slate-700/60 font-light font-serif">{SLOT_LABELS[position]}</span>
      </div>
    );
  };

  return (
    <div id="layout-slots-capture" className="grid grid-cols-3 gap-6 sm:gap-10 mx-auto w-fit my-4 p-6 relative">
      {/* Subtle warm glow around the layout */}
      <div className="absolute inset-0 -z-10 warm-glow rounded-3xl"></div>
      
      {/* Row 1: Top (Center Column) */}
      <div className="col-start-2 row-start-1 flex justify-center">
        {renderSlot(SlotPosition.TOP)}
      </div>

      {/* Row 2: Left, Center, Right */}
      <div className="col-start-1 row-start-2 flex justify-center">
        {renderSlot(SlotPosition.LEFT)}
      </div>
      <div className="col-start-2 row-start-2 flex justify-center">
        {renderSlot(SlotPosition.CENTER)}
      </div>
      <div className="col-start-3 row-start-2 flex justify-center">
        {renderSlot(SlotPosition.RIGHT)}
      </div>

      {/* Row 3: Bottom (Center Column) */}
      <div className="col-start-2 row-start-3 flex justify-center">
        {renderSlot(SlotPosition.BOTTOM)}
      </div>
    </div>
  );
};