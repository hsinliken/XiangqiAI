import { DivinationResult, StoredDivinationRecord } from "../types";
import { DEFAULT_SYSTEM_PROMPT } from "../constants";
import * as firebaseService from "./firebase";

// Check if Firebase is configured and initialized
const isFirebaseConfigured = async () => {
  try {
    const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
    const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;

    console.log('[Storage Check] Checking Firebase Config:', {
      hasApiKey: !!apiKey,
      hasProjectId: !!projectId,
      apiKeyStart: apiKey ? apiKey.substring(0, 5) : 'N/A'
    });

    // Check environment variables first
    if (!apiKey || !projectId) {
      console.warn('[Storage Check] Missing API Key or Project ID');
      return false;
    }

    // Try to import and check if db is initialized
    const firebaseModule = await import('./firebase');
    // Access db through a getter function if needed, or check if it exists
    // Since db is exported, we can check it directly after import
    console.log('[Storage Check] Firebase Module Imported');
    return true; // If import succeeds and env vars are set, assume it's configured
  } catch (e) {
    return false;
  }
};

// Fallback to localStorage if Firebase is not configured
const COLLECTIONS = {
  SYSTEM_SETTINGS: 'xiangqi_system_settings',
  DIVINATION_RESULTS: 'xiangqi_divination_results'
};

export const storage = {
  // --- System Settings (Prompt) ---

  getSystemPrompt: async (): Promise<string> => {
    if (await isFirebaseConfigured()) {
      const prompt = await firebaseService.getSystemPrompt();
      return prompt || DEFAULT_SYSTEM_PROMPT;
    }
    // Fallback to localStorage
    const stored = localStorage.getItem(COLLECTIONS.SYSTEM_SETTINGS);
    return stored || DEFAULT_SYSTEM_PROMPT;
  },

  saveSystemPrompt: async (prompt: string): Promise<void> => {
    if (await isFirebaseConfigured()) {
      await firebaseService.saveSystemPrompt(prompt);
      return;
    }
    // Fallback to localStorage
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

  getCachedResult: async (uniqueKey: string): Promise<StoredDivinationRecord | null> => {
    if (await isFirebaseConfigured()) {
      return await firebaseService.getCachedResult(uniqueKey);
    }
    // Fallback to localStorage
    try {
      const rawData = localStorage.getItem(COLLECTIONS.DIVINATION_RESULTS);
      if (!rawData) return null;

      const db = JSON.parse(rawData);
      const record = db[uniqueKey];

      if (record) {
        console.log(`[LocalStorage] Cache Hit for ${uniqueKey}`);
        return record;
      }
      return null;
    } catch (e) {
      console.error("Error reading cache", e);
      return null;
    }
  },

  saveResult: async (uniqueKey: string, guaCode: string, category: string, result: DivinationResult, layoutImage?: string): Promise<void> => {
    if (await isFirebaseConfigured()) {
      try {
        await firebaseService.saveDivinationResult(uniqueKey, guaCode, category, result, layoutImage);
        return;
      } catch (error: any) {
        console.error('[Storage] Firebase save failed, falling back to localStorage:', error);
        // Fall through to localStorage fallback
      }
    }
    // Fallback to localStorage
    try {
      const rawData = localStorage.getItem(COLLECTIONS.DIVINATION_RESULTS);
      const db = rawData ? JSON.parse(rawData) : {};

      // 模擬 MongoDB Document Schema
      const newRecord: StoredDivinationRecord = {
        ...result,
        _id: uniqueKey,
        unique_key: uniqueKey,
        gua_code: guaCode,
        category: category,
        created_at: new Date().toISOString(),
        layout_image: layoutImage
      };

      db[uniqueKey] = newRecord;

      localStorage.setItem(COLLECTIONS.DIVINATION_RESULTS, JSON.stringify(db));
      if (layoutImage) {
        console.log(`[LocalStorage] Result saved for ${uniqueKey} with image (${layoutImage.length} chars)`);
      } else {
        console.log(`[LocalStorage] Result saved for ${uniqueKey} WITHOUT image`);
      }
    } catch (e) {
      console.error("Error saving cache", e);
    }
  },

  // --- Admin / CRUD Operations ---

  getAllResults: async (): Promise<StoredDivinationRecord[]> => {
    if (await isFirebaseConfigured()) {
      return await firebaseService.getAllResults();
    }
    // Fallback to localStorage
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

  updateResult: async (id: string, updates: Partial<DivinationResult>): Promise<void> => {
    if (await isFirebaseConfigured()) {
      await firebaseService.updateResult(id, updates);
      return;
    }
    // Fallback to localStorage
    try {
      const rawData = localStorage.getItem(COLLECTIONS.DIVINATION_RESULTS);
      const db = rawData ? JSON.parse(rawData) : {};

      if (db[id]) {
        db[id] = { ...db[id], ...updates };
        localStorage.setItem(COLLECTIONS.DIVINATION_RESULTS, JSON.stringify(db));
        console.log(`[LocalStorage] Record updated: ${id}`);
      }
    } catch (e) {
      console.error("Error updating record", e);
    }
  },

  deleteResult: async (id: string): Promise<void> => {
    if (await isFirebaseConfigured()) {
      await firebaseService.deleteResult(id);
      return;
    }
    // Fallback to localStorage
    try {
      const rawData = localStorage.getItem(COLLECTIONS.DIVINATION_RESULTS);
      const db = rawData ? JSON.parse(rawData) : {};

      if (db[id]) {
        delete db[id];
        localStorage.setItem(COLLECTIONS.DIVINATION_RESULTS, JSON.stringify(db));
        console.log(`[LocalStorage] Record deleted: ${id}`);
      }
    } catch (e) {
      console.error("Error deleting record", e);
    }
  },

  checkConnection: async (): Promise<{ success: boolean; message: string }> => {
    if (await isFirebaseConfigured()) {
      return await firebaseService.checkConnection();
    }
    return { success: false, message: 'Firebase Not Configured (Local Mode)' };
  }
};