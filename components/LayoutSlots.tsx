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
          ${hasPiece
            ? 'bg-gradient-to-br from-[#fff9e6] to-[#fceeb5] border-[3px] border-[#e6d07a] shadow-[0_4px_12px_rgba(0,0,0,0.3)]'
            : 'bg-yellow-50/10 border-2 border-dashed border-yellow-200/30'}
          ${isNext && !hasPiece ? 'animate-pulse border-yellow-300/50 bg-yellow-100/10' : ''}
        `}>
          {hasPiece ? (
            <div className="w-[88%] h-[88%] rounded-full border border-[#e6d07a]/50 flex items-center justify-center relative shadow-inner">
              {/* Inner ring for depth */}
              <div className="absolute inset-0 rounded-full border border-white/40"></div>
              <span className={`text-3xl sm:text-4xl md:text-5xl font-bold relative z-10 ${piece?.color === PieceColor.RED ? 'text-[#8b0000]' : 'text-[#1a1a1a]'} drop-shadow-sm`}>
                {piece?.label}
              </span>
            </div>
          ) : (
            <span className="text-yellow-100/40 text-xs sm:text-sm font-serif">{SLOT_LABELS[position].split(' ')[0]}</span>
          )}
        </div>
        <span className="mt-2 text-xs text-yellow-100/60 font-light font-serif tracking-widest">{SLOT_LABELS[position]}</span>
      </div>
    );
  };

  return (
    <div id="layout-slots-capture" className="grid grid-cols-3 gap-6 sm:gap-10 mx-auto w-fit my-4 p-8 relative bg-slate-900/30 backdrop-blur-md rounded-3xl border border-white/10 shadow-2xl">
      {/* Subtle warm glow around the layout */}
      <div className="absolute inset-0 -z-10 warm-glow rounded-3xl opacity-50"></div>

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