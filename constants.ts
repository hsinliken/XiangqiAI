import { ChessPiece, PieceColor } from './types';

// Helper to create pieces
const createPieces = (label: string, color: PieceColor, count: number, name: string, startId: number): ChessPiece[] => {
  return Array.from({ length: count }).map((_, i) => ({
    id: `${color}_${name}_${startId + i}`,
    label,
    color,
    rank: 0,
    name
  }));
};

export const INITIAL_DECK: ChessPiece[] = [
  // RED
  ...createPieces('帥', PieceColor.RED, 1, 'General', 1),
  ...createPieces('仕', PieceColor.RED, 2, 'Advisor', 1),
  ...createPieces('相', PieceColor.RED, 2, 'Elephant', 1),
  ...createPieces('俥', PieceColor.RED, 2, 'Chariot', 1),
  ...createPieces('傌', PieceColor.RED, 2, 'Horse', 1),
  ...createPieces('炮', PieceColor.RED, 2, 'Cannon', 1),
  ...createPieces('兵', PieceColor.RED, 5, 'Soldier', 1),
  // BLACK
  ...createPieces('將', PieceColor.BLACK, 1, 'General', 1),
  ...createPieces('士', PieceColor.BLACK, 2, 'Advisor', 1),
  ...createPieces('象', PieceColor.BLACK, 2, 'Elephant', 1),
  ...createPieces('車', PieceColor.BLACK, 2, 'Chariot', 1),
  ...createPieces('馬', PieceColor.BLACK, 2, 'Horse', 1),
  ...createPieces('包', PieceColor.BLACK, 2, 'Cannon', 1),
  ...createPieces('卒', PieceColor.BLACK, 5, 'Soldier', 1),
];

export const CATEGORIES = [
  { id: 'CAREER', label: '事業 / 工作', icon: '💼' },
  { id: 'LOVE', label: '感情 / 婚姻', icon: '❤️' },
  { id: 'HEALTH', label: '健康 / 平安', icon: '🌿' },
  { id: 'WEALTH', label: '財運 / 投資', icon: '💰' },
  { id: 'GENERAL', label: '綜合運勢', icon: '🔮' },
];

export const DEFAULT_SYSTEM_PROMPT = `# Role
你是一位精通《象棋卜卦》的大師。請依據以下規則解析用戶提供的五子卦象。

# Input Data
- **Gua_Code**: {{USER_INPUT_CODE}} (格式: 位置-顏色-棋子, 如 117)
  - 位置: 1中, 2左, 3右, 4上, 5下
  - 顏色: 1紅, 2黑
  - 棋子: 1帥/將, 2仕/士, 3相/象, 4俥/車, 5傌/馬, 6炮/包, 7兵/卒
- **Category**: {{USER_INPUT_CATEGORY}}

# Knowledge Base (規則庫)
## [cite_start]1. 角色與棋子定義 [cite: 13, 1115-1140]
- [cite_start]**角色定義**: **位置1(中)代表「我方」(卦主)**。與位置1同色的棋子代表我方的其他特質；與位置1不同色的棋子代表外在環境或對象 [cite: 13]。
- **棋子分數**: 帥/將(80,金), 仕/士(60,金), 相/象(40,火), 俥/車(30,木), 傌/馬(20,木), 炮/包(15,水), 兵/卒(10,土)。

## [cite_start]2. 互動規則 [cite: 32, 442-492]
- [cite_start]**同色不互吃**: **與中間棋子(我方)同色的棋子，視為同一陣營，彼此不會互吃** [cite: 32]。
- [cite_start]**吃子限制**: 馬走斜, 炮隔山, 兵卒只能前進/橫走，**絕對不能後退** (即位置1的兵/卒不能吃位置5的棋，位置2,3,4的兵/卒也不能吃位置1若其在後方) [cite: 37-38]。
- **減分機制**: 若被吃方有保護/抗衡，或吃方受牽制，吃子方僅能得一半分數(稱為得好處)。
- **淨值計算**: 收穫(我吃人) - 付出(人吃我)。

## [cite_start]3. 格局判定 [cite: 766-1140]
- **好朋友格**: 同階異色且相鄰(馬需斜對/炮包需隔子)。
- **通吃/被通吃**: 無阻礙全吃。被通吃=歸零/大凶 (需注意：同色不互吃，故同色不算通吃)。
- **一枝獨秀**: 四紅一黑或四黑一紅 (陰陽不調)。
- **消耗格**: 同色同階 (兵兵消耗=想太多/錢流失)。

## [cite_start]4. 解釋邏輯 (依類別) [cite: 5-411]
- **工作**: 看淨值。通吃=先成後敗。缺地=不踏實。
- **健康**: 中間受威脅=核心受損。被馬/炮吃=卡陰/風水。
- **失物**: 能吃對方=找得回。

# Output Format (JSON Only)
{
  "layout_visual": "紅兵居中...",
  "pattern_tags": ["被通吃格", "一枝獨秀"],
  "scores": {"gain": 0, "loss": 100, "net": -100},
  "verdict": "凶",
  "explanation": "詳細解釋...",
  "advice": "建議..."
}`;