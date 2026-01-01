import React, { useState, useEffect, useCallback } from 'react';
import { ChessPiece, GamePhase, SlotPosition, DivinationResult, PromptSettings } from './types';
import { INITIAL_DECK, CATEGORIES } from './constants';
import { analyzeDivination } from './services/geminiService_fixed';
import { storage } from './services/storage';
import { ChessPieceCard } from './components/ChessPieceCard';
import { LayoutSlots } from './components/LayoutSlots';
import { PieceSelector } from './components/PieceSelector'; // New import
import { SettingsModal } from './components/SettingsModal';
import { ChatInterface } from './components/ChatInterface';

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

  // New State for Input Mode
  const [inputMode, setInputMode] = useState<'FLIP' | 'MANUAL'>('FLIP');
  const [isPieceSelectorOpen, setIsPieceSelectorOpen] = useState(false);
  const [activeSlot, setActiveSlot] = useState<SlotPosition | null>(null);

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
  const [category, setCategory] = useState<{ id: string, label: string } | null>(null);
  const [gender, setGender] = useState<string | null>(null);
  const [result, setResult] = useState<DivinationResult | null>(null);

  // Admin/Settings
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState('');

  const resetGame = useCallback((mode: 'FLIP' | 'MANUAL' = 'FLIP') => {
    // Determine initial phase based on mode
    const initialPhase = mode === 'FLIP' ? GamePhase.SHUFFLING : GamePhase.PICKING;
    setPhase(initialPhase);
    setInputMode(mode);

    // Reset common state
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

    if (mode === 'FLIP') {
      setTimeout(() => {
        setDeck(shuffleDeck(INITIAL_DECK));
        setPhase(GamePhase.PICKING);
      }, 800);
    } else {
      // In Manual mode, we don't need to shuffle, just go straight to picking
      // No deck needed for manual layout really, but good to keep state consistent
      setDeck([]);
    }
  }, []);

  // Initialize
  useEffect(() => {
    // Load prompt from storage service (simulating DB fetch)
    const loadPrompt = async () => {
      const storedPrompt = await storage.getSystemPrompt();
      setSystemPrompt(storedPrompt);
    };
    loadPrompt();

    // Initial Start (Default to FLIP)
    resetGame('FLIP');
  }, [resetGame]);

  // Handler for Flip Mode
  const handleCardClick = (piece: ChessPiece) => {
    if (phase !== GamePhase.PICKING || inputMode !== 'FLIP') return;
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

  // Handlers for Manual Mode
  const handleManualSlotClick = (position: SlotPosition) => {
    if (phase !== GamePhase.PICKING || inputMode !== 'MANUAL') return;
    setActiveSlot(position);
    setIsPieceSelectorOpen(true);
  };

  const handleManualPieceSelect = (piece: ChessPiece) => {
    if (!activeSlot) return;

    // Create a unique ID for the selected piece to avoid collision if same type selected multiple times
    // In manual mode, we relax the unique deployment constraints slightly for UX, 
    // but ideally we should track 'used' pieces if we want to be strict.
    // For now, constructing a new piece instance.
    const newPiece: ChessPiece = {
      ...piece,
      id: `${piece.id}_manual_${Date.now()}`
    };

    setSelectedPieces(prev => ({
      ...prev,
      [activeSlot]: newPiece
    }));

    setIsPieceSelectorOpen(false);
    setActiveSlot(null);
  };

  // Effect to update count in manual mode and check if ready for next phase
  useEffect(() => {
    if (inputMode === 'MANUAL') {
      const count = Object.values(selectedPieces).filter(p => p !== null).length;
      setSelectedCount(count);
    }
  }, [selectedPieces, inputMode]);

  const confirmManualSelection = () => {
    if (selectedCount === 5) {
      setPhase(GamePhase.CATEGORY_SELECT);
    } else {
      alert('請填滿所有 5 個位置');
    }
  };


  const handleCategorySelect = async (cat: typeof CATEGORIES[0]) => {
    if (!gender) {
      alert('請先選擇性別 (男 / 女 / 其他)');
      return;
    }

    // Validate that all 5 pieces are selected
    const currentSelectedCount = Object.values(selectedPieces).filter(p => p !== null).length;
    if (currentSelectedCount !== 5) {
      alert(`請確保已選滿 5 個棋子。目前選取數量: ${currentSelectedCount}/5`);
      return;
    }

    // Validate that all required positions have pieces
    const requiredPositions = [SlotPosition.CENTER, SlotPosition.LEFT, SlotPosition.RIGHT, SlotPosition.TOP, SlotPosition.BOTTOM];
    const missingPositions = requiredPositions.filter(pos => !selectedPieces[pos]);
    if (missingPositions.length > 0) {
      console.error('[ERROR] Missing pieces at positions:', missingPositions);
      alert(`部分位置尚未選取棋子，請重新選取。`);
      return;
    }

    setCategory(cat);

    // Capture visual representation using html2canvas BEFORE changing phase
    // This ensures the element is still visible and rendered
    let capturedImage = undefined;
    try {
      if (window.html2canvas) {
        const element = document.getElementById('layout-slots-capture');
        if (element) {
          console.log('[Image Capture] ✅ Element found, starting capture...');
          console.log('[Image Capture] Element dimensions:', {
            width: element.offsetWidth,
            height: element.offsetHeight,
            visible: element.offsetParent !== null
          });

          // Small delay to ensure DOM is fully rendered
          // 增加延遲時間，確保 DOM 渲染完成
          await new Promise(resolve => setTimeout(resolve, 500));

          // 創建一個完全獨立的副本，將所有計算樣式轉為內聯樣式
          // 這樣可以避免 html2canvas 解析 oklab 顏色函數
          const clonedElement = element.cloneNode(true) as HTMLElement;

          // 創建一個新的容器，用於隔離樣式
          const container = document.createElement('div');
          container.style.position = 'absolute';
          container.style.left = '-9999px';
          container.style.top = '0';
          container.style.width = element.offsetWidth + 'px';
          container.style.height = element.offsetHeight + 'px';
          container.style.backgroundColor = '#064e3b';
          container.id = 'temp-capture-container';
          document.body.appendChild(container);
          container.appendChild(clonedElement);

          // 簡單的 oklab/oklch 轉換為 rgb
          const convertColorFormat = (colorValue: string): string => {
            // 如果包含 oklab 或 oklch，轉換為備用顏色
            if (String(colorValue).includes('oklab') || String(colorValue).includes('oklch')) {
              return 'rgb(100, 100, 100)'; // 灰色備用
            }
            return colorValue;
          };

          // 將所有計算樣式應用到克隆元素的內聯樣式
          const applyComputedStyles = (original: Element, clone: Element) => {
            const computed = window.getComputedStyle(original);
            const cloneEl = clone as HTMLElement;

            // 獲取所有 CSS 屬性
            const allProps = [
              // 顏色相關
              'color', 'backgroundColor',
              'borderColor', 'borderTopColor', 'borderRightColor',
              'borderBottomColor', 'borderLeftColor',
              'outlineColor', 'textDecorationColor',
              // 邊框相關
              'borderWidth', 'borderStyle', 'borderRadius',
              'borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth',
              'borderTopStyle', 'borderRightStyle', 'borderBottomStyle', 'borderLeftStyle',
              // 尺寸和位置
              'width', 'height', 'minWidth', 'minHeight', 'maxWidth', 'maxHeight',
              'padding', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
              'margin', 'marginTop', 'marginRight', 'marginBottom', 'marginLeft',
              // 字體
              'fontSize', 'fontFamily', 'fontWeight', 'fontStyle', 'lineHeight',
              'textAlign', 'textDecoration', 'textTransform',
              // 顯示
              'display', 'position', 'top', 'right', 'bottom', 'left',
              'flexDirection', 'justifyContent', 'alignItems', 'alignContent',
              'gap', 'gridTemplateColumns', 'gridTemplateRows',
              // Grid Child Placement
              'gridColumn', 'gridRow',
              'gridColumnStart', 'gridColumnEnd',
              'gridRowStart', 'gridRowEnd',
              'gridArea',
              'justifySelf', 'alignSelf', 'placeSelf',
              // 其他
              'opacity', 'transform', 'boxShadow', 'textShadow',
              'overflow', 'overflowX', 'overflowY',
              'zIndex', 'pointerEvents', 'cursor'
            ];

            // 應用所有屬性
            allProps.forEach(prop => {
              try {
                let value = (computed as any)[prop];

                // 檢查並轉換 oklab/oklch 顏色
                const valueStr = String(value);
                if (valueStr.includes('oklab') || valueStr.includes('oklch')) {
                  value = convertColorFormat(value);
                }

                if (value &&
                  value !== 'none' &&
                  value !== 'auto' &&
                  value !== 'transparent' &&
                  value !== 'initial' &&
                  value !== 'inherit' &&
                  value !== 'rgba(0, 0, 0, 0)') {
                  cloneEl.style[prop as any] = value;
                }
              } catch (e) {
                // 忽略無法訪問的屬性
              }
            });

            // 遞歸處理子元素
            const originalChildren = Array.from(original.children);
            const cloneChildren = Array.from(clone.children);
            originalChildren.forEach((origChild, idx) => {
              if (cloneChildren[idx]) {
                applyComputedStyles(origChild, cloneChildren[idx]);
              }
            });
          };

          // 應用樣式到克隆元素及其所有子元素
          applyComputedStyles(element, clonedElement);

          // 臨時禁用所有樣式表，強制只使用內聯樣式
          const styleSheets: Array<{ link: HTMLLinkElement; disabled: boolean }> = [];
          const allLinks = document.querySelectorAll('link[rel="stylesheet"]');
          allLinks.forEach((link: Element) => {
            const linkEl = link as HTMLLinkElement;
            styleSheets.push({ link: linkEl, disabled: linkEl.disabled });
            linkEl.disabled = true; // 臨時禁用樣式表
          });

          // 等待樣式應用完成並強制重繪
          await new Promise(resolve => setTimeout(resolve, 200));

          let canvas: HTMLCanvasElement | null = null;
          try {
            // 使用容器進行截圖，配置選項以避免解析 oklab 顏色
            canvas = await window.html2canvas(container, {
              scale: 1.0,
              backgroundColor: '#064e3b',
              logging: false,
              useCORS: false, // 關閉 CORS 以避免加載外部樣式表
              allowTaint: true,
              foreignObjectRendering: false, // 使用原生渲染，避免 SVG 相關問題
              windowWidth: container.offsetWidth,
              windowHeight: container.offsetHeight
            });
          } finally {
            // 恢復所有樣式表
            styleSheets.forEach(({ link, disabled }) => {
              link.disabled = disabled;
            });

            // 清理臨時容器
            document.body.removeChild(container);
          }

          if (canvas && canvas.width > 0 && canvas.height > 0) {
            capturedImage = canvas.toDataURL('image/png');
            console.log(`[Image Capture] ✅ Successfully captured image, size: ${capturedImage.length} characters`);
            console.log(`[Image Capture] Image preview: ${capturedImage.substring(0, 50)}...`);
          } else {
            console.error('[Image Capture] ❌ html2canvas created an invalid or empty canvas.');
          }
        } else {
          console.error('[Image Capture] ❌ Element with id "layout-slots-capture" not found');
          console.error('[Image Capture] Available elements:', document.querySelectorAll('[id*="layout"]'));
        }
      } else {
        console.error('[Image Capture] ❌ html2canvas is not available');
      }
    } catch (e) {
      console.error("[Image Capture] ❌ Failed to capture image:", e);
    }

    if (!capturedImage) {
      console.warn('[Image Capture] ⚠️ No image captured, proceeding without image');
    }

    // Now change phase to ANALYZING
    setPhase(GamePhase.ANALYZING);

    // Call API (Service handles caching and prompt loading internally)
    console.log('[DEBUG] Calling analyzeDivination...');
    const res = await analyzeDivination(selectedPieces, cat.label, cat.id, capturedImage, gender || undefined);
    console.log('[DEBUG] analyzeDivination returned result:', res);
    setResult(res);
    setPhase(GamePhase.RESULT);
  };

  const handleSaveSettings = async (newPrompt: string, newModel: string) => {
    // Save to DB via service
    await storage.saveSystemPrompt(newPrompt);
    await storage.saveGeminiModel(newModel);
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

  // Generate magical dust motes
  const dustMotes = Array.from({ length: 12 }, (_, i) => (
    <div
      key={i}
      className="dust-mote"
      style={{
        left: `${Math.random() * 100}%`,
        animationDelay: `${Math.random() * 15}s`,
        animationDuration: `${15 + Math.random() * 10}s`
      }}
    />
  ));

  return (
    <div
      className="min-h-screen text-blue-50 flex flex-col relative overflow-hidden z-10 bg-cover bg-center bg-no-repeat fixed inset-0"
      style={{ backgroundImage: 'url(/bg-scifi.png)' }}
    >
      <div className="absolute inset-0 bg-black/40 pointer-events-none z-0"></div>

      {/* Magical dust motes */}
      {dustMotes}

      {/* Minimalist Header */}
      <header className="p-3 sticky top-0 z-40 flex justify-between items-center">
        {/* Mode Switcher */}
        {(phase === GamePhase.SHUFFLING || phase === GamePhase.PICKING) ? (
          <div className="flex bg-slate-800/50 rounded-full p-1 backdrop-blur-md border border-slate-700">
            <button
              onClick={() => resetGame('FLIP')}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${inputMode === 'FLIP'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-blue-300'
                }`}
            >
              翻棋模式
            </button>
            <button
              onClick={() => resetGame('MANUAL')}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${inputMode === 'MANUAL'
                  ? 'bg-yellow-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-yellow-300'
                }`}
            >
              手動輸入
            </button>
          </div>
        ) : <div></div>}

        <button
          onClick={() => setIsSettingsOpen(true)}
          className="text-slate-700/70 hover:text-slate-800 transition-colors p-2 rounded-full hover:bg-slate-700/15 backdrop-blur-sm"
          aria-label="設定"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-5xl mx-auto p-4 flex flex-col items-center justify-start relative pb-20 z-10">



        {/* Bottom: The Board / Controls */}
        <div className="w-full transition-opacity duration-500">

          {phase === GamePhase.SHUFFLING && (
            <div className="flex flex-col items-center justify-center mt-8 animate-pulse">
              <span className="text-2xl text-slate-700/80 mb-4 font-serif">洗牌中...</span>
              <div className="w-16 h-16 border-4 border-t-yellow-300 border-r-transparent border-b-yellow-300 border-l-transparent rounded-full animate-spin"></div>
            </div>
          )}

          {phase === GamePhase.PICKING && (
            <div className="animate-fade-in w-full">
              {/* Calligraphy instruction banner */}
              <div className="text-center mb-8 mt-4">
                <p className="calligraphy-text text-2xl sm:text-3xl md:text-4xl text-yellow-300 mb-2 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
                  {inputMode === 'FLIP' ? '靜心默念問題，憑直覺抽取棋子' : '請點擊格子，手動輸入卦象'}
                </p>
                {selectedCount > 0 && selectedCount < 5 && (
                  <p className="text-yellow-300 text-sm mt-2 font-serif drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                    已選 {selectedCount} / 5
                  </p>
                )}
              </div>

              {/* Render Cards only in FLIP mode */}
              {inputMode === 'FLIP' && renderBoard()}

              {/* In Manual Mode, show Confirm Button */}
              {inputMode === 'MANUAL' && (
                <div className="text-center mt-4 mb-4">
                  <button
                    onClick={confirmManualSelection}
                    disabled={selectedCount < 5}
                    className={`px-8 py-3 rounded-full font-bold tracking-wider transition-all shadow-lg ${selectedCount >= 5
                        ? 'bg-yellow-600 hover:bg-yellow-500 text-white shadow-yellow-500/30'
                        : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                      }`}
                  >
                    確認卦象
                  </button>
                </div>
              )}
            </div>
          )}

          {phase === GamePhase.CATEGORY_SELECT && (
            <div className="w-full max-w-lg mx-auto mt-4 animate-fade-in-up">
              <h2 className="text-2xl text-center text-yellow-300 mb-6 font-serif drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">請選擇您想詢問的類別</h2>
              <div className="flex flex-col items-center gap-2 mb-4">
                <div className="text-sm text-yellow-300 font-medium drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">性別</div>
                <div className="flex justify-center gap-4">
                  <label className="inline-flex items-center gap-2 text-sm">
                    <input id="gender-male" type="radio" name="gender" value="男" checked={gender === "男"} onChange={() => setGender('男')} />
                    <span className="text-yellow-300 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">男</span>
                  </label>
                  <label className="inline-flex items-center gap-2 text-sm">
                    <input id="gender-female" type="radio" name="gender" value="女" checked={gender === "女"} onChange={() => setGender('女')} />
                    <span className="text-yellow-300 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">女</span>
                  </label>
                  <label className="inline-flex items-center gap-2 text-sm">
                    <input id="gender-other" type="radio" name="gender" value="其他" checked={gender === "其他"} onChange={() => setGender('其他')} />
                    <span className="text-yellow-300 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">其他</span>
                  </label>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => handleCategorySelect(cat)}
                    className="p-4 bg-slate-900/60 backdrop-blur-sm border border-blue-500/30 rounded-lg hover:bg-slate-800/80 hover:border-blue-400/60 transition-all flex items-center gap-4 group shadow-md shadow-blue-900/20"
                    disabled={!gender}
                  >
                    <span className="text-2xl group-hover:scale-110 transition-transform text-blue-300">{cat.icon}</span>
                    <span className="text-lg text-blue-100 font-serif tracking-wider">{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {phase === GamePhase.ANALYZING && (
            <div className="flex flex-col items-center justify-center mt-8">
              <div className="text-4xl mb-4 animate-bounce">🔮</div>
              <h2 className="text-xl text-yellow-200 mb-2 font-serif">正在請示神諭...</h2>
              <p className="text-yellow-300 text-sm drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">正在分析五行方位與卦象...</p>
            </div>
          )}

          {phase === GamePhase.RESULT && result && (
            <div className="w-full max-w-2xl mx-auto mt-4 animate-fade-in">
              <div className="bg-slate-900/80 backdrop-blur-xl border border-blue-500/30 rounded-xl p-6 shadow-2xl shadow-blue-900/50 relative overflow-hidden text-blue-50">
                {/* Ornamental corner */}
                <div className="absolute top-0 left-0 w-16 h-16 border-t-4 border-l-4 border-blue-400/30 rounded-tl-xl shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
                <div className="absolute bottom-0 right-0 w-16 h-16 border-b-4 border-r-4 border-blue-400/30 rounded-br-xl shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>

                <div className="text-center mb-8">
                  <div className="inline-block px-4 py-1 bg-blue-900/60 rounded-full border border-blue-500/50 text-blue-200 text-sm mb-2 shadow-sm shadow-blue-500/20">
                    {category?.label}
                  </div>
                  <h2 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-200 via-white to-blue-200 font-serif mb-2 tracking-widest drop-shadow-[0_0_10px_rgba(59,130,246,0.8)]">{result.hexagram_name}</h2>
                  <span className={`text-xl font-bold px-3 py-1 rounded shadow-sm inline-block mt-2 ${result.luck_level.includes('吉') ? 'text-white bg-red-600/80 border border-red-500/50' :
                    result.luck_level.includes('凶') ? 'text-white bg-slate-600/80 border border-slate-500/50' : 'text-white bg-blue-600/80 border border-blue-500/50'
                    }`}>
                    {result.luck_level}
                  </span>
                </div>

                <div className="space-y-6 text-blue-100 leading-relaxed font-serif text-lg">
                  <div className="bg-black/40 p-5 rounded-lg border border-blue-500/20 shadow-inner">
                    <h3 className="text-blue-300 font-bold mb-2 uppercase text-xs tracking-wider border-b border-blue-500/30 pb-1">卦象分析</h3>
                    <p className="opacity-90">{result.analysis}</p>
                  </div>

                  <div className="bg-blue-900/20 p-5 rounded-lg border border-blue-500/20 shadow-inner">
                    <h3 className="text-blue-300 font-bold mb-2 uppercase text-xs tracking-wider border-b border-blue-500/30 pb-1">神諭建議</h3>
                    <p className="italic text-blue-50/90">"{result.advice}"</p>
                  </div>
                </div>

                <div className="mt-8 text-center">
                  <button
                    onClick={() => resetGame(inputMode)}
                    className="px-8 py-3 bg-red-800 hover:bg-red-700 text-white rounded-full border border-red-400/50 shadow-lg hover:shadow-red-900/50 transition-all font-bold tracking-wider"
                  >
                    再求一卦
                  </button>
                </div>
              </div>

              {/* Chat Interface */}
              <div className="mt-8">
                <ChatInterface divinationResult={result} categoryLabel={category?.label} gender={gender} />
              </div>
            </div>
          )}
        </div>

        {/* Bottom: Layout Visualizer (Slots) - Moved here */}
        <div className="w-full flex justify-center mt-8 order-last">
          <div className="scale-90 sm:scale-100">
            <LayoutSlots
              selectedPieces={selectedPieces}
              nextSlot={phase === GamePhase.PICKING && selectedCount < 5 && inputMode === 'FLIP' ? SELECTION_ORDER[selectedCount] : null}
              onSlotClick={handleManualSlotClick}
              isInteractive={phase === GamePhase.PICKING && inputMode === 'MANUAL'}
            />
          </div>
        </div>

      </main>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        currentPrompt={systemPrompt}
        onSave={handleSaveSettings}
      />

      <PieceSelector
        isOpen={isPieceSelectorOpen}
        onClose={() => setIsPieceSelectorOpen(false)}
        onSelect={handleManualPieceSelect}
        unavailablePieceIds={new Set()}
      />

    </div>
  );
}