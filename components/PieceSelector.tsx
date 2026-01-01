import React from 'react';
import { ChessPiece, PieceColor } from '../types';
import { INITIAL_DECK } from '../constants';

interface PieceSelectorProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (piece: ChessPiece) => void;
    unavailablePieceIds?: Set<string>; // Ids of pieces already placed or exhausted
}

export const PieceSelector: React.FC<PieceSelectorProps> = ({
    isOpen,
    onClose,
    onSelect,
    unavailablePieceIds = new Set()
}) => {
    if (!isOpen) return null;

    // Group initial deck by color to display them organized
    // distinct types: 14 types (7 Red, 7 Black)
    // We can just show one of each type, but we need to track counts if we want to be strict.
    // For simplicity first iteration: Show all unique types (7 Red, 7 Black).
    // When user clicks, we generate a fresh piece object or pick one from available.

    // Let's create a "template" list of 14 pieces for selection buttons
    const uniquePieces: ChessPiece[] = [
        // Red
        { id: 'template_red_1', label: '帥', color: PieceColor.RED, rank: 80, name: 'General' },
        { id: 'template_red_2', label: '仕', color: PieceColor.RED, rank: 60, name: 'Advisor' },
        { id: 'template_red_3', label: '相', color: PieceColor.RED, rank: 40, name: 'Elephant' },
        { id: 'template_red_4', label: '俥', color: PieceColor.RED, rank: 30, name: 'Chariot' },
        { id: 'template_red_5', label: '傌', color: PieceColor.RED, rank: 20, name: 'Horse' },
        { id: 'template_red_6', label: '炮', color: PieceColor.RED, rank: 15, name: 'Cannon' },
        { id: 'template_red_7', label: '兵', color: PieceColor.RED, rank: 10, name: 'Soldier' },
        // Black
        { id: 'template_black_1', label: '將', color: PieceColor.BLACK, rank: 80, name: 'General' },
        { id: 'template_black_2', label: '士', color: PieceColor.BLACK, rank: 60, name: 'Advisor' },
        { id: 'template_black_3', label: '象', color: PieceColor.BLACK, rank: 40, name: 'Elephant' },
        { id: 'template_black_4', label: '車', color: PieceColor.BLACK, rank: 30, name: 'Chariot' },
        { id: 'template_black_5', label: '馬', color: PieceColor.BLACK, rank: 20, name: 'Horse' },
        { id: 'template_black_6', label: '包', color: PieceColor.BLACK, rank: 15, name: 'Cannon' },
        { id: 'template_black_7', label: '卒', color: PieceColor.BLACK, rank: 10, name: 'Soldier' },
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-slate-900 border border-blue-500/30 rounded-xl shadow-2xl w-full max-w-2xl p-6 relative overflow-hidden">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                <h3 className="text-xl font-serif text-yellow-100 text-center mb-6">請選擇棋子</h3>

                <div className="grid grid-cols-2 gap-8">
                    {/* RED Column */}
                    <div className="flex flex-col gap-3 items-center">
                        <span className="text-red-400 font-bold mb-2 tracking-widest border-b border-red-500/30 pb-1 w-full text-center">紅方 (陽)</span>
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                            {uniquePieces.filter(p => p.color === PieceColor.RED).map(p => (
                                <button
                                    key={p.id}
                                    onClick={() => onSelect(p)}
                                    className="w-12 h-12 rounded-full bg-[#fde8d0] border-2 border-red-800/20 shadow-md hover:scale-110 active:scale-95 transition-all flex items-center justify-center"
                                >
                                    <span className="text-xl font-bold text-[#8b0000]">{p.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* BLACK Column */}
                    <div className="flex flex-col gap-3 items-center">
                        <span className="text-cyan-400 font-bold mb-2 tracking-widest border-b border-cyan-500/30 pb-1 w-full text-center">黑方 (陰)</span>
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                            {uniquePieces.filter(p => p.color === PieceColor.BLACK).map(p => (
                                <button
                                    key={p.id}
                                    onClick={() => onSelect(p)}
                                    className="w-12 h-12 rounded-full bg-[#fde8d0] border-2 border-slate-800/20 shadow-md hover:scale-110 active:scale-95 transition-all flex items-center justify-center"
                                >
                                    <span className="text-xl font-bold text-black">{p.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="mt-8 text-center text-sm text-slate-400 font-serif">
                    點擊棋子以填入當前位置
                </div>

            </div>
        </div>
    );
};
