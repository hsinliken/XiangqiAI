export enum PieceColor {
  RED = 'RED',
  BLACK = 'BLACK'
}

export interface ChessPiece {
  id: string; // Unique ID for keying
  label: string; // The Chinese character (e.g., 帥, 將)
  color: PieceColor;
  rank: number; // For internal logic/sorting if needed
  name: string; // English name for context
}

export enum GamePhase {
  SHUFFLING = 'SHUFFLING',
  PICKING = 'PICKING', // User is picking 5 cards
  CATEGORY_SELECT = 'CATEGORY_SELECT', // User selects question category
  ANALYZING = 'ANALYZING', // AI is thinking
  RESULT = 'RESULT', // Display result
}

export enum SlotPosition {
  CENTER = 'CENTER', // 中
  LEFT = 'LEFT',     // 左
  RIGHT = 'RIGHT',   // 右
  TOP = 'TOP',       // 上
  BOTTOM = 'BOTTOM'  // 下
}

export const SLOT_LABELS: Record<SlotPosition, string> = {
  [SlotPosition.CENTER]: '中',
  [SlotPosition.LEFT]: '左',
  [SlotPosition.RIGHT]: '右',
  [SlotPosition.TOP]: '上',
  [SlotPosition.BOTTOM]: '下'
};

export interface DivinationResult {
  luck_level: string; // 吉/凶
  hexagram_name: string; // 格局名稱
  analysis: string; // Detailed analysis
  advice: string; // Actionable advice
}

export interface StoredDivinationRecord extends DivinationResult {
  _id: string;
  unique_key: string; // PRD: 117-227-317-427-527_WORK
  gua_code: string;   // PRD: 117 227 ...
  category: string;
  gender?: string;
  created_at: string;
  layout_image?: string; // Base64 string of the Nine-Grid visual
}

export interface PromptSettings {
  systemPrompt: string;
}