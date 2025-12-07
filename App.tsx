import React, { useState, useEffect, useCallback } from 'react';
import { ChessPiece, GamePhase, SlotPosition, DivinationResult, PromptSettings } from './types';
import { INITIAL_DECK, CATEGORIES } from './constants';
import { analyzeDivination } from './services/geminiService';
import { storage } from './services/storage';
import { ChessPieceCard } from './components/ChessPieceCard';
import { LayoutSlots } from './components/LayoutSlots';
import { SettingsModal } from './components/SettingsModal';

// Extend window for html2canvas
declare global {
  interface Window {
    html2canvas: any;
  }
}

// Fisher-Yates Shuffle
const shuffleDeck = (deck: ChessPiece[]): ChessPiece[] => {
  const newDeck = [...deck];
  for (let i = newDeck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
  }
  return newDeck;
};

// Selection Order
const SELECTION_ORDER: SlotPosition[] = [
  SlotPosition.CENTER,
  SlotPosition.LEFT,
  SlotPosition.RIGHT,
  SlotPosition.TOP,
  SlotPosition.BOTTOM
];

export default function App() {
  // State
  const [deck, setDeck] = useState<ChessPiece[]>([]);
  const [phase, setPhase] = useState<GamePhase>(GamePhase.SHUFFLING);
  const [selectedPieces, setSelectedPieces] = useState<Record<SlotPosition, ChessPiece | null>>({
    [SlotPosition.CENTER]: null,
    [SlotPosition.LEFT]: null,
    [SlotPosition.RIGHT]: null,
    [SlotPosition.TOP]: null,
    [SlotPosition.BOTTOM]: null
  });
  const [selectedCount, setSelectedCount] = useState(0);
  // Track IDs of flipped cards on the board
  const [flippedIds, setFlippedIds] = useState<Set<string>>(new Set());
  const [category, setCategory] = useState<{id: string, label: string} | null>(null);
  const [result, setResult] = useState<DivinationResult | null>(null);
  
  // Admin/Settings
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState('');

  const resetGame = useCallback(() => {
    setPhase(GamePhase.SHUFFLING);
    setTimeout(() => {
      setDeck(shuffleDeck(INITIAL_DECK));
      setSelectedPieces({
        [SlotPosition.CENTER]: null,
        [SlotPosition.LEFT]: null,
        [SlotPosition.RIGHT]: null,
        [SlotPosition.TOP]: null,
        [SlotPosition.BOTTOM]: null
      });
      setSelectedCount(0);
      setFlippedIds(new Set());
      setCategory(null);
      setResult(null);
      setPhase(GamePhase.PICKING);
    }, 800);
  }, []);

  // Initialize
  useEffect(() => {
    // Load prompt from storage service (simulating DB fetch)
    const loadPrompt = async () => {
      const storedPrompt = await storage.getSystemPrompt();
      setSystemPrompt(storedPrompt);
    };
    loadPrompt();

    // Initial Shuffle
    resetGame();
  }, [resetGame]);

  const handleCardClick = (piece: ChessPiece) => {
    if (phase !== GamePhase.PICKING) return;
    if (flippedIds.has(piece.id)) return;
    if (selectedCount >= 5) return;

    // 1. Flip the card visually
    setFlippedIds(prev => new Set(prev).add(piece.id));

    // 2. Assign to next slot
    const currentSlot = SELECTION_ORDER[selectedCount];
    
    // Add delay for visual "travel" logic
    setTimeout(() => {
        setSelectedPieces(prev => ({
            ...prev,
            [currentSlot]: piece
        }));
    }, 400);

    const newCount = selectedCount + 1;
    setSelectedCount(newCount);

    // 3. Check completion
    if (newCount === 5) {
      setTimeout(() => {
        setPhase(GamePhase.CATEGORY_SELECT);
      }, 1000);
    }
  };

  const handleCategorySelect = async (cat: typeof CATEGORIES[0]) => {
    setCategory(cat);
    
    // Capture visual representation using html2canvas BEFORE changing phase
    // This ensures the element is still visible and rendered
    let capturedImage = undefined;
    try {
      if (window.html2canvas) {
        const element = document.getElementById('layout-slots-capture');
        if (element) {
          console.log('[Image Capture] Starting capture of layout-slots-capture element');
          // Small delay to ensure DOM is fully rendered
          await new Promise(resolve => setTimeout(resolve, 100));
          const canvas = await window.html2canvas(element, { 
            scale: 0.8, // Slightly lower scale to save DB space
            backgroundColor: '#064e3b', // Use the background color instead of transparent
            logging: false,
            useCORS: true,
            allowTaint: true
          });
          capturedImage = canvas.toDataURL('image/png');
          console.log(`[Image Capture] Successfully captured image, size: ${capturedImage.length} characters`);
        } else {
          console.warn('[Image Capture] Element with id "layout-slots-capture" not found');
        }
      } else {
        console.warn('[Image Capture] html2canvas is not available');
      }
    } catch (e) {
      console.error("[Image Capture] Failed to capture image:", e);
    }

    // Now change phase to ANALYZING
    setPhase(GamePhase.ANALYZING);

    // Call API (Service handles caching and prompt loading internally)
    const res = await analyzeDivination(selectedPieces, cat.label, cat.id, capturedImage);
    setResult(res);
    setPhase(GamePhase.RESULT);
  };

  const handleSaveSettings = async (newPrompt: string) => {
    // Save to DB via service
    await storage.saveSystemPrompt(newPrompt);
    setSystemPrompt(newPrompt);
  };

  // Render Helpers
  const renderBoard = () => (
    // Update: 8 cols on small-up screens (PRD: 4x8), 4 cols on mobile
    <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 sm:gap-3 md:gap-4 max-w-5xl mx-auto p-4">
      {deck.map((piece) => (
        <div key={piece.id} className="flex justify-center">
            <ChessPieceCard 
                piece={piece}
                isFlipped={flippedIds.has(piece.id)}
                onClick={() => handleCardClick(piece)}
                disabled={phase !== GamePhase.PICKING || selectedCount >= 5}
                isSelected={Object.values(selectedPieces).some((p) => (p as ChessPiece | null)?.id === piece.id)}
            />
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-green-800 to-teal-900 text-white flex flex-col relative overflow-hidden">
      
      {/* Header */}
      <header className="p-4 border-b border-white/10 bg-black/20 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full border-2 border-yellow-400 bg-red-900/80 flex items-center justify-center text-yellow-200 font-bold font-serif shadow-lg">
              卜
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-yellow-100/90 tracking-widest drop-shadow-md">
              象棋卜卦
            </h1>
          </div>
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="text-white/40 hover:text-white transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-5xl mx-auto p-4 flex flex-col items-center justify-start relative pb-20">
        
        {/* Top: Layout Visualizer (Slots) */}
        <div className="w-full flex justify-center mb-4">
            <div className="scale-90 sm:scale-100">
                <LayoutSlots 
                    selectedPieces={selectedPieces} 
                    nextSlot={phase === GamePhase.PICKING && selectedCount < 5 ? SELECTION_ORDER[selectedCount] : null}
                />
            </div>
        </div>

        {/* Bottom: The Board / Controls */}
        <div className="w-full transition-opacity duration-500">
          
          {phase === GamePhase.SHUFFLING && (
            <div className="flex flex-col items-center justify-center mt-8 animate-pulse">
                <span className="text-2xl text-yellow-100/70 mb-4 font-serif">洗牌中...</span>
                <div className="w-16 h-16 border-4 border-t-yellow-300 border-r-transparent border-b-yellow-300 border-l-transparent rounded-full animate-spin"></div>
            </div>
          )}

          {phase === GamePhase.PICKING && (
            <div className="animate-fade-in w-full">
               <p className="text-center text-yellow-100/90 mb-4 animate-bounce font-medium tracking-wide">
                  {selectedCount === 0 && "請直覺選取第一顆棋子（中宮）..."}
                  {selectedCount > 0 && selectedCount < 5 && `請選取下一顆棋子（還剩 ${5 - selectedCount} 顆）...`}
               </p>
               {renderBoard()}
            </div>
          )}

          {phase === GamePhase.CATEGORY_SELECT && (
             <div className="w-full max-w-lg mx-auto mt-4 animate-fade-in-up">
                <h2 className="text-2xl text-center text-white mb-6 font-serif">請選擇您想詢問的類別</h2>
                <div className="grid grid-cols-1 gap-4">
                  {CATEGORIES.map(cat => (
                    <button 
                      key={cat.id}
                      onClick={() => handleCategorySelect(cat)}
                      className="p-4 bg-white/10 backdrop-blur-sm border border-yellow-200/30 rounded-lg hover:bg-white/20 hover:border-yellow-300 transition-all flex items-center gap-4 group shadow-md"
                    >
                      <span className="text-2xl group-hover:scale-110 transition-transform">{cat.icon}</span>
                      <span className="text-lg text-yellow-50 font-serif tracking-wider">{cat.label}</span>
                    </button>
                  ))}
                </div>
             </div>
          )}

          {phase === GamePhase.ANALYZING && (
             <div className="flex flex-col items-center justify-center mt-8">
                <div className="text-4xl mb-4 animate-bounce">🔮</div>
                <h2 className="text-xl text-yellow-200 mb-2 font-serif">正在請示神諭...</h2>
                <p className="text-white/60 text-sm">正在分析五行方位與卦象...</p>
             </div>
          )}

          {phase === GamePhase.RESULT && result && (
             <div className="w-full max-w-2xl mx-auto mt-4 animate-fade-in">
                <div className="bg-white/10 backdrop-blur-xl border border-yellow-200/40 rounded-xl p-6 shadow-2xl relative overflow-hidden">
                   {/* Ornamental corner */}
                   <div className="absolute top-0 left-0 w-16 h-16 border-t-4 border-l-4 border-yellow-200/20 rounded-tl-xl"></div>
                   <div className="absolute bottom-0 right-0 w-16 h-16 border-b-4 border-r-4 border-yellow-200/20 rounded-br-xl"></div>
                   
                   <div className="text-center mb-8">
                      <div className="inline-block px-4 py-1 bg-emerald-900/60 rounded-full border border-emerald-400/30 text-emerald-100 text-sm mb-2 shadow-sm">
                        {category?.label}
                      </div>
                      <h2 className="text-4xl md:text-5xl font-bold text-yellow-300 font-serif mb-2 tracking-widest drop-shadow-md">{result.hexagram_name}</h2>
                      <span className={`text-xl font-bold px-3 py-1 rounded shadow-sm inline-block mt-2 ${
                        result.luck_level.includes('吉') ? 'text-red-100 bg-red-900/60 border border-red-400/30' : 
                        result.luck_level.includes('凶') ? 'text-gray-200 bg-gray-700/60 border border-gray-400/30' : 'text-blue-100 bg-blue-900/60 border border-blue-400/30'
                      }`}>
                        {result.luck_level}
                      </span>
                   </div>

                   <div className="space-y-6 text-gray-100 leading-relaxed font-serif text-lg">
                      <div className="bg-black/20 p-5 rounded-lg border border-white/10 shadow-inner">
                        <h3 className="text-yellow-400 font-bold mb-2 uppercase text-xs tracking-wider border-b border-white/10 pb-1">卦象分析</h3>
                        <p className="opacity-90">{result.analysis}</p>
                      </div>

                      <div className="bg-emerald-900/30 p-5 rounded-lg border border-emerald-500/20 shadow-inner">
                        <h3 className="text-emerald-300 font-bold mb-2 uppercase text-xs tracking-wider border-b border-emerald-500/20 pb-1">神諭建議</h3>
                        <p className="italic text-yellow-50/90">"{result.advice}"</p>
                      </div>
                   </div>

                   <div className="mt-8 text-center">
                     <button 
                       onClick={resetGame}
                       className="px-8 py-3 bg-red-800 hover:bg-red-700 text-white rounded-full border border-red-400/50 shadow-lg hover:shadow-red-900/50 transition-all font-bold tracking-wider"
                     >
                       再求一卦
                     </button>
                   </div>
                </div>
             </div>
          )}
        </div>

      </main>

      <SettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        currentPrompt={systemPrompt}
        onSave={handleSaveSettings}
      />

    </div>
  );
}