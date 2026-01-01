import { GoogleGenAI, Type } from "@google/genai";
import { ChessPiece, DivinationResult, SlotPosition, PieceColor } from "../types";
import { storage } from "./storage";
import { DEFAULT_SYSTEM_PROMPT } from "../constants";

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
  layoutImage?: string, // Optional captured image
  gender?: string
): Promise<DivinationResult> => {

  // 1. Generate Gua Code string for the prompt
  // Order: Top(4), Left(2), Center(1), Right(3), Bottom(5)
  const orderedPositions = [
    SlotPosition.TOP,
    SlotPosition.LEFT,
    SlotPosition.CENTER,
    SlotPosition.RIGHT,
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

  // Debug: log generated code and related context
  try {
    console.log('[DEBUG][analyzeDivination] guaCodeString=', guaCodeString);
    console.log('[DEBUG][analyzeDivination] codeList.length=', codeList.length);
    console.log('[DEBUG][analyzeDivination] selectedPieces=', selectedPieces);
    console.log('[DEBUG][analyzeDivination] categoryLabel=', categoryLabel);
  } catch (e) {
    console.error('[DEBUG][analyzeDivination] Error logging guaCodeString', e);
  }

  // Validate inputs before proceeding
  if (!guaCodeString || guaCodeString.trim() === '' || codeList.length !== 5) {
    console.error('[ERROR][analyzeDivination] Invalid guaCodeString:', guaCodeString, 'codeList.length:', codeList.length);
    return {
      luck_level: "資料不完整",
      hexagram_name: "請重新選取",
      analysis: `卦象代碼生成失敗。\n已選取棋子數量: ${codeList.length}/5\n請確保已選滿 5 個棋子。`,
      advice: "請回到選棋階段，重新選取 5 個棋子。"
    };
  }

  if (!categoryLabel || categoryLabel.trim() === '') {
    console.error('[ERROR][analyzeDivination] Invalid categoryLabel:', categoryLabel);
    return {
      luck_level: "資料不完整",
      hexagram_name: "請重新選擇",
      analysis: `問卦類別未選擇。\n請選擇您想詢問的問題類別。`,
      advice: "請回到類別選擇階段，選擇一個問題類別。"
    };
  }

  // 2. Cache Key (Using semantic values)
  const cacheKey = storage.generateCacheKey(guaCodeString, categoryId, gender);

  // 3. Check Cache
  const cachedResult = await storage.getCachedResult(cacheKey);
  if (cachedResult) {
    // If we have a cached result but no image, and we just captured one, update it
    // Also update if we have a new image (to ensure latest capture is saved)
    if (layoutImage) {
      if (!cachedResult.layout_image) {
        console.log(`[Cache] Updating missing image for ${cacheKey}`);
      } else {
        console.log(`[Cache] Updating existing image for ${cacheKey} with new capture`);
      }
      // Update the image using storage service
      await storage.saveResult(cacheKey, guaCodeString, categoryId, cachedResult, layoutImage, gender);
      console.log(`[Cache] Image updated for ${cacheKey}, size: ${layoutImage.length} characters`);

      // Re-fetch the updated result to get the new image URL
      const updatedResult = await storage.getCachedResult(cacheKey);
      if (updatedResult) {
        console.log(`[Cache] Returning updated result with image URL: ${updatedResult.layout_image ? 'Yes' : 'No'}`);
        return updatedResult;
      }
    } else {
      console.log(`[Cache] No image provided for ${cacheKey}, using cached result`);
    }
    return cachedResult;
  }

  // 4. Prepare Prompt
  // Replace placeholders in the stored System Prompt
  let systemPromptTemplate = await storage.getSystemPrompt();

  // Ensure we have a valid prompt template
  if (!systemPromptTemplate || systemPromptTemplate.trim() === '') {
    console.error('[ERROR] System prompt template is empty, using default');
    systemPromptTemplate = DEFAULT_SYSTEM_PROMPT;
  }

  // Debug: log template before replacement
  console.log('[DEBUG][analyzeDivination] Template contains placeholders:', {
    hasCode: systemPromptTemplate.includes('{{USER_INPUT_CODE}}'),
    hasCategory: systemPromptTemplate.includes('{{USER_INPUT_CATEGORY}}'),
    hasGender: systemPromptTemplate.includes('{{USER_INPUT_GENDER}}'),
    templateLength: systemPromptTemplate.length
  });

  // Inject User Data (use replaceAll to handle multiple occurrences)
  // Try multiple replacement patterns to ensure all variations are caught
  let finalPrompt = systemPromptTemplate
    .replace(/\{\{USER_INPUT_CODE\}\}/g, guaCodeString)
    .replace(/\{\{USER_INPUT_CATEGORY\}\}/g, categoryLabel)
    .replace(/\{\{USER_INPUT_GENDER\}\}/g, gender || '');

  // Also try without curly braces (in case template was modified)
  finalPrompt = finalPrompt
    .replace(/USER_INPUT_CODE/g, guaCodeString)
    .replace(/USER_INPUT_CATEGORY/g, categoryLabel)
    .replace(/USER_INPUT_GENDER/g, gender || '');

  // Validate that all placeholders were replaced
  const hasUnreplacedCode = finalPrompt.includes('{{USER_INPUT_CODE}}') || finalPrompt.includes('USER_INPUT_CODE');
  const hasUnreplacedCategory = finalPrompt.includes('{{USER_INPUT_CATEGORY}}') || finalPrompt.includes('USER_INPUT_CATEGORY');

  if (hasUnreplacedCode || hasUnreplacedCategory) {
    console.error('[ERROR] Placeholders not fully replaced in prompt');
    console.error('[ERROR] Remaining placeholders:', {
      hasCode: hasUnreplacedCode,
      hasCategory: hasUnreplacedCategory
    });
    console.error('[ERROR] Values being replaced:', {
      guaCodeString,
      categoryLabel,
      gender: gender || '(empty)'
    });
  }

  // Debug: show the Input Data section of the prompt to verify replacement
  try {
    const inputDataMatch = finalPrompt.match(/# Input Data[\s\S]*?(?=# |$)/);
    if (inputDataMatch) {
      console.log('[DEBUG][analyzeDivination] Input Data section after replacement:', inputDataMatch[0]);
      // Verify that the actual values are in the prompt
      if (!inputDataMatch[0].includes(guaCodeString)) {
        console.error('[ERROR] GuaCode not found in Input Data section!', {
          expected: guaCodeString,
          found: inputDataMatch[0]
        });
      }
      if (!inputDataMatch[0].includes(categoryLabel)) {
        console.error('[ERROR] Category not found in Input Data section!', {
          expected: categoryLabel,
          found: inputDataMatch[0]
        });
      }
    }
    console.log('[DEBUG][analyzeDivination] finalPrompt (truncated)=', finalPrompt.substring(0, 500).replace(/\n/g, ' '));
  } catch (e) {
    console.error('[DEBUG][analyzeDivination] Error logging finalPrompt', e);
  }

  // Final validation: ensure the prompt contains the actual values
  if (!finalPrompt.includes(guaCodeString)) {
    console.error('[ERROR] Final prompt does not contain guaCodeString!', {
      guaCodeString,
      promptPreview: finalPrompt.substring(0, 200)
    });
    return {
      luck_level: "系統錯誤",
      hexagram_name: "Prompt 替換失敗",
      analysis: `系統無法正確處理卦象代碼。\n代碼: ${guaCodeString}\n請聯繫管理員檢查系統設定。`,
      advice: "請重新嘗試，或聯繫管理員。"
    };
  }

  if (!finalPrompt.includes(categoryLabel)) {
    console.error('[ERROR] Final prompt does not contain categoryLabel!', {
      categoryLabel,
      promptPreview: finalPrompt.substring(0, 200)
    });
    return {
      luck_level: "系統錯誤",
      hexagram_name: "Prompt 替換失敗",
      analysis: `系統無法正確處理問卦類別。\n類別: ${categoryLabel}\n請聯繫管理員檢查系統設定。`,
      advice: "請重新嘗試，或聯繫管理員。"
    };
  }


  try {
    const ai = getAI();
    // Get model from storage
    const modelVersion = await storage.getGeminiModel();
    console.log(`[Gemini] Using model: ${modelVersion}`);

    const response = await ai.models.generateContent({
      model: modelVersion,
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
    await storage.saveResult(cacheKey, guaCodeString, categoryId, uiResult, layoutImage, gender);
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

export const chatWithDivinationAI = async (
  divinationResult: DivinationResult,
  history: { role: 'user' | 'model', text: string }[],
  userMessage: string,
  conversationId?: string
): Promise<string> => {
  try {
    const ai = getAI();
    // Get model from storage
    const modelVersion = await storage.getGeminiModel();

    // Construct the system instruction (persona and context)
    const context = `
你是一位精通《象棋卜卦》的智慧長者與大師。
你剛剛為用戶進行了卜卦，結果如下：
- 卦名：${divinationResult.hexagram_name}
- 吉凶：${divinationResult.luck_level}
- 分析：${divinationResult.analysis}
- 建議：${divinationResult.advice}

用戶現在對這個結果有疑問或想深入了解。
請以日常口語、親切但富有智慧的方式回答用戶的問題。
不要過於嚴肅，像是一位以此為樂、樂於助人的老朋友或長者。
回答請簡潔有力，切中要害，不要長篇大論。
`.trim();

    // Prepare contents history
    const contents = [
      ...history.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.text }]
      })),
      {
        role: 'user',
        parts: [{ text: userMessage }]
      }
    ];

    const response = await ai.models.generateContent({
      model: modelVersion,
      config: {
        systemInstruction: context,
      },
      contents: contents
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    // Persist conversation (history + user message + model response)
    try {
      const messagesForSave = contents.map(c => ({ role: (c.role as string) || 'user', text: (c.parts || []).map((p: any) => p.text).join(' ') }));
      // Append model response as last message
      messagesForSave.push({ role: 'model', text });

      // Non-blocking persistence: await but don't fail the chat if saving errors
      try {
        await storage.saveConversation(conversationId, {
          messages: messagesForSave,
          divination: divinationResult || null,
          session: undefined
        });
      } catch (e) {
        console.error('[Chat] Failed to save conversation:', e);
      }
    } catch (e) {
      console.error('[Chat] Error preparing conversation payload:', e);
    }

    return text;

  } catch (error) {
    console.error("Gemini Chat API Error:", error);
    return "抱歉，神諭暫時無法連結，請稍後再試。";
  }
};
