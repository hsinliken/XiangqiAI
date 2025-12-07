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
          relative w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full 
          flex items-center justify-center shadow-inner
          ${hasPiece ? 'wood-texture border-4 border-yellow-800/60 shadow-lg' : 'bg-black/20 border-2 border-dashed border-white/20'}
          ${isNext && !hasPiece ? 'animate-pulse border-yellow-400/50 bg-yellow-400/10' : ''}
        `}>
          {hasPiece ? (
            <div className="w-[85%] h-[85%] rounded-full border-2 border-yellow-900/30 flex items-center justify-center">
              <span className={`font-serif text-3xl sm:text-4xl font-bold ${piece?.color === PieceColor.RED ? 'text-red-700' : 'text-black'}`}>
                {piece?.label}
              </span>
            </div>
          ) : (
            <span className="text-white/20 text-xs sm:text-sm">{SLOT_LABELS[position].split(' ')[0]}</span>
          )}
        </div>
        <span className="mt-2 text-xs text-yellow-100/70 font-light">{SLOT_LABELS[position]}</span>
      </div>
    );
  };

  return (
    <div id="layout-slots-capture" className="grid grid-cols-3 gap-4 sm:gap-8 mx-auto w-fit my-4 p-4 bg-emerald-900/20 rounded-xl">
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