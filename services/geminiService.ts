import { GoogleGenAI, Type } from "@google/genai";
import { ChessPiece, DivinationResult, SlotPosition, PieceColor } from "../types";
import { storage } from "./storage";

// Lazy initialization of Gemini Client (only when needed)
const getAI = () => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("VITE_GEMINI_API_KEY is not set. Please create a .env file with your API key.");
  }
  return new GoogleGenAI({ apiKey });
};

// Mappings for the Prompt Rules
const PIECE_TYPE_CODE: Record<string, number> = {
  '帥': 1, '將': 1,
  '仕': 2, '士': 2,
  '相': 3, '象': 3,
  '俥': 4, '車': 4,
  '傌': 5, '馬': 5,
  '炮': 6, '包': 6,
  '兵': 7, '卒': 7
};

const POSITION_CODE: Record<SlotPosition, number> = {
  [SlotPosition.CENTER]: 1,
  [SlotPosition.LEFT]: 2,
  [SlotPosition.RIGHT]: 3,
  [SlotPosition.TOP]: 4,
  [SlotPosition.BOTTOM]: 5
};

const COLOR_CODE: Record<PieceColor, number> = {
  [PieceColor.RED]: 1,
  [PieceColor.BLACK]: 2
};

const getPieceCode = (piece: ChessPiece, position: SlotPosition): string => {
  const pCode = POSITION_CODE[position];
  const cCode = COLOR_CODE[piece.color];
  const tCode = PIECE_TYPE_CODE[piece.label] || 7; // Default to soldier if error
  return `${pCode}${cCode}${tCode}`;
};

export const analyzeDivination = async (
  selectedPieces: Record<SlotPosition, ChessPiece | null>,
  categoryLabel: string,
  categoryId: string, // Added ID for DB
  layoutImage?: string // Optional captured image
): Promise<DivinationResult> => {

  // 1. Generate Gua Code string for the prompt
  // Order: Center(1), Left(2), Right(3), Top(4), Bottom(5)
  const orderedPositions = [
    SlotPosition.CENTER, 
    SlotPosition.LEFT, 
    SlotPosition.RIGHT, 
    SlotPosition.TOP, 
    SlotPosition.BOTTOM
  ];

  const codeList: string[] = [];
  
  orderedPositions.forEach(pos => {
    const piece = selectedPieces[pos];
    if (piece) {
      codeList.push(getPieceCode(piece, pos));
    }
  });

  const guaCodeString = codeList.join(' '); // e.g., "117 227 315..."

  // 2. Cache Key (Using semantic values)
  const cacheKey = storage.generateCacheKey(guaCodeString, categoryId);

  // 3. Check Cache
  const cachedResult = storage.getCachedResult(cacheKey);
  if (cachedResult) {
    // If we have a cached result but no image, and we just captured one, update it
    // Also update if we have a new image (to ensure latest capture is saved)
    if (layoutImage) {
      if (!cachedResult.layout_image) {
        console.log(`[Cache] Updating missing image for ${cacheKey}`);
      } else {
        console.log(`[Cache] Updating existing image for ${cacheKey} with new capture`);
      }
      // Update the image field directly
      const rawData = localStorage.getItem('xiangqi_divination_results');
      if (rawData) {
        const db = JSON.parse(rawData);
        if (db[cacheKey]) {
          db[cacheKey].layout_image = layoutImage;
          localStorage.setItem('xiangqi_divination_results', JSON.stringify(db));
          console.log(`[Cache] Image updated for ${cacheKey}, size: ${layoutImage.length} characters`);
        }
      }
    } else {
      console.log(`[Cache] No image provided for ${cacheKey}, using cached result`);
    }
    return cachedResult;
  }

  // 4. Prepare Prompt
  // Replace placeholders in the stored System Prompt
  let systemPromptTemplate = storage.getSystemPrompt();
  
  // Inject User Data
  const finalPrompt = systemPromptTemplate
    .replace('{{USER_INPUT_CODE}}', guaCodeString)
    .replace('{{USER_INPUT_CATEGORY}}', categoryLabel);

  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: finalPrompt, // Pass the fully constructed prompt with rules
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            layout_visual: { type: Type.STRING },
            pattern_tags: { 
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            scores: {
              type: Type.OBJECT,
              properties: {
                gain: { type: Type.NUMBER },
                loss: { type: Type.NUMBER },
                net: { type: Type.NUMBER }
              }
            },
            verdict: { type: Type.STRING },
            explanation: { type: Type.STRING },
            advice: { type: Type.STRING },
          },
          required: ['verdict', 'explanation', 'advice', 'pattern_tags']
        }
      },
      contents: [
        {
          role: 'user',
          parts: [{ text: "請依照 System Rules 開始解卦。" }] // Trigger execution
        }
      ]
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    const rawResult = JSON.parse(text);

    // Map the new JSON structure to the UI's DivinationResult interface
    const uiResult: DivinationResult = {
      luck_level: rawResult.verdict,
      hexagram_name: rawResult.pattern_tags?.[0] || '象棋神卦',
      analysis: `${rawResult.explanation}\n\n[格局]: ${rawResult.pattern_tags.join(', ')}\n[淨值]: ${rawResult.scores?.net || 0}`,
      advice: rawResult.advice
    };

    // 5. Save to Cache with Image
    storage.saveResult(cacheKey, guaCodeString, categoryId, uiResult, layoutImage);
    if (layoutImage) {
      console.log(`[Save] Result saved with image for ${cacheKey}, image size: ${layoutImage.length} characters`);
    } else {
      console.warn(`[Save] Result saved WITHOUT image for ${cacheKey}`);
    }

    return uiResult;

  } catch (error) {
    console.error("Gemini API Error:", error);
    return {
      luck_level: "系統繁忙",
      hexagram_name: "靜心等待",
      analysis: "無法連接神諭 (API Error)。\n" + (error instanceof Error ? error.message : String(error)),
      advice: "請稍後再試。"
    };
  }
};