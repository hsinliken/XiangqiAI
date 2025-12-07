import { DivinationResult, StoredDivinationRecord } from "../types";
import { DEFAULT_SYSTEM_PROMPT } from "../constants";

// 模擬 MongoDB Collection 名稱
const COLLECTIONS = {
  SYSTEM_SETTINGS: 'xiangqi_system_settings',
  DIVINATION_RESULTS: 'xiangqi_divination_results'
};

export const storage = {
  // --- System Settings (Prompt) ---

  getSystemPrompt: (): string => {
    const stored = localStorage.getItem(COLLECTIONS.SYSTEM_SETTINGS);
    return stored || DEFAULT_SYSTEM_PROMPT;
  },

  saveSystemPrompt: (prompt: string): void => {
    localStorage.setItem(COLLECTIONS.SYSTEM_SETTINGS, prompt);
  },

  resetSystemPrompt: (): string => {
    localStorage.removeItem(COLLECTIONS.SYSTEM_SETTINGS);
    return DEFAULT_SYSTEM_PROMPT;
  },

  // --- Divination Results (Caching & DB) ---

  /**
   * 產生唯一的 Cache Key
   * PRD 規則: "117-227-317-427-527_WORK"
   * @param guaCodeString - 空格分隔的代碼字串 (e.g. "117 227 ...")
   * @param category - 類別代碼 (e.g. "WORK")
   */
  generateCacheKey: (guaCodeString: string, category: string): string => {
    // Replace spaces with hyphens for the key
    const formattedCode = guaCodeString.replace(/\s+/g, '-');
    return `${formattedCode}_${category}`;
  },

  getCachedResult: (uniqueKey: string): StoredDivinationRecord | null => {
    try {
      const rawData = localStorage.getItem(COLLECTIONS.DIVINATION_RESULTS);
      if (!rawData) return null;
      
      const db = JSON.parse(rawData);
      const record = db[uniqueKey];
      
      if (record) {
        console.log(`[MongoDB Mock] Cache Hit for ${uniqueKey}`);
        return record;
      }
      return null;
    } catch (e) {
      console.error("Error reading cache", e);
      return null;
    }
  },

  saveResult: (uniqueKey: string, guaCode: string, category: string, result: DivinationResult, layoutImage?: string): void => {
    try {
      const rawData = localStorage.getItem(COLLECTIONS.DIVINATION_RESULTS);
      const db = rawData ? JSON.parse(rawData) : {};
      
      // 模擬 MongoDB Document Schema
      const newRecord: StoredDivinationRecord = {
        ...result,
        _id: uniqueKey, // Using unique_key as ID for simulation simplicity
        unique_key: uniqueKey,
        gua_code: guaCode,
        category: category,
        created_at: new Date().toISOString(),
        layout_image: layoutImage
      };

      db[uniqueKey] = newRecord;

      localStorage.setItem(COLLECTIONS.DIVINATION_RESULTS, JSON.stringify(db));
      console.log(`[MongoDB Mock] Result saved for ${uniqueKey}`);
    } catch (e) {
      console.error("Error saving cache", e);
    }
  },

  // --- Admin / CRUD Operations ---

  getAllResults: (): StoredDivinationRecord[] => {
    try {
      const rawData = localStorage.getItem(COLLECTIONS.DIVINATION_RESULTS);
      if (!rawData) return [];
      const db = JSON.parse(rawData);
      // Convert map to array and sort by date descending
      return Object.values(db).sort((a: any, b: any) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ) as StoredDivinationRecord[];
    } catch (e) {
      return [];
    }
  },

  updateResult: (id: string, updates: Partial<DivinationResult>): void => {
    try {
      const rawData = localStorage.getItem(COLLECTIONS.DIVINATION_RESULTS);
      const db = rawData ? JSON.parse(rawData) : {};
      
      if (db[id]) {
        db[id] = { ...db[id], ...updates };
        localStorage.setItem(COLLECTIONS.DIVINATION_RESULTS, JSON.stringify(db));
        console.log(`[MongoDB Mock] Record updated: ${id}`);
      }
    } catch (e) {
      console.error("Error updating record", e);
    }
  },

  deleteResult: (id: string): void => {
    try {
      const rawData = localStorage.getItem(COLLECTIONS.DIVINATION_RESULTS);
      const db = rawData ? JSON.parse(rawData) : {};
      
      if (db[id]) {
        delete db[id];
        localStorage.setItem(COLLECTIONS.DIVINATION_RESULTS, JSON.stringify(db));
        console.log(`[MongoDB Mock] Record deleted: ${id}`);
      }
    } catch (e) {
      console.error("Error deleting record", e);
    }
  }
};