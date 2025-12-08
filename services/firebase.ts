import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, getDoc, getDocs, deleteDoc, updateDoc, query, orderBy } from 'firebase/firestore';
import { getStorage, ref, uploadString, getDownloadURL } from 'firebase/storage';
import { StoredDivinationRecord, DivinationResult } from '../types';

// Firebase configuration - these should be set via environment variables
let app: any = null;
let db: any = null;
let storage: any = null;

const initFirebase = () => {
  if (app) return; // Already initialized

  const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
  };

  // Check if Firebase is configured
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    console.warn('[Firebase] Firebase not configured, will use localStorage fallback');
    return;
  }

  try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    storage = getStorage(app);
    console.log('[Firebase] Initialized successfully');
  } catch (error) {
    console.error('[Firebase] Initialization error:', error);
  }
};

// Initialize on import
initFirebase();

export { db, storage };

// Collection names
const COLLECTIONS = {
  DIVINATION_RESULTS: 'divination_results',
  SYSTEM_SETTINGS: 'system_settings'
};

/**
 * Upload image to Firebase Storage and return the download URL
 */
export const uploadImageToStorage = async (imageData: string, uniqueKey: string): Promise<string | null> => {
  try {
    if (!imageData) {
      console.warn('[Firebase Storage] No image data provided');
      return null;
    }

    if (!storage) {
      console.warn('[Firebase Storage] Storage not initialized');
      return null;
    }

    // Convert base64 to blob if needed, or upload directly as base64
    const imageRef = ref(storage, `divination_images/${uniqueKey}.png`);

    // Upload base64 string directly
    await uploadString(imageRef, imageData, 'data_url');

    // Get download URL
    const downloadURL = await getDownloadURL(imageRef);
    console.log(`[Firebase Storage] Image uploaded: ${downloadURL}`);
    return downloadURL;
  } catch (error: any) {
    console.error('[Firebase Storage] Error uploading image:', error);

    // Provide helpful error messages
    if (error?.code === 'storage/unauthorized') {
      console.error('[Firebase Storage] 权限被拒绝。请检查 Storage 安全规则。');
    } else if (error?.code === 'storage/quota-exceeded') {
      console.error('[Firebase Storage] 存储配额已满。');
    }

    return null;
  }
};

/**
 * Save divination result to Firestore
 */
export const saveDivinationResult = async (
  uniqueKey: string,
  guaCode: string,
  category: string,
  result: DivinationResult,
  layoutImage?: string
): Promise<void> => {
  try {
    if (!db) {
      throw new Error('Firebase not initialized');
    }

    let imageUrl: string | undefined = undefined;

    // Upload image to Firebase Storage if provided
    if (layoutImage) {
      console.log(`[Firebase] Attempting to upload image for ${uniqueKey}, image size: ${layoutImage.length} characters`);
      imageUrl = await uploadImageToStorage(layoutImage, uniqueKey);
      if (imageUrl) {
        console.log(`[Firebase] Image uploaded successfully, URL: ${imageUrl.substring(0, 50)}...`);
      } else {
        console.error(`[Firebase] Failed to upload image for ${uniqueKey}, saving without image`);
      }
    } else {
      console.log(`[Firebase] No layoutImage provided for ${uniqueKey}`);
    }

    // Build record object, only include layout_image if imageUrl exists
    // Firestore doesn't accept undefined values
    const record: any = {
      ...result,
      _id: uniqueKey,
      unique_key: uniqueKey,
      gua_code: guaCode,
      category: category,
      created_at: new Date().toISOString()
    };

    // Only add layout_image if we have a URL
    if (imageUrl) {
      record.layout_image = imageUrl; // Store the Firebase Storage URL instead of base64
      console.log(`[Firebase] Adding layout_image to record: ${imageUrl.substring(0, 50)}...`);
    } else {
      console.log(`[Firebase] No imageUrl to add to record`);
    }

    const docRef = doc(db, COLLECTIONS.DIVINATION_RESULTS, uniqueKey);
    console.log(`[Firebase] Saving record to Firestore: ${uniqueKey}`);
    console.log(`[Firebase] Record data:`, {
      has_layout_image: !!record.layout_image,
      layout_image_preview: record.layout_image ? record.layout_image.substring(0, 50) + '...' : 'none'
    });
    await setDoc(docRef, record);

    if (imageUrl) {
      console.log(`[Firebase] ✅ Result saved for ${uniqueKey} with image URL: ${imageUrl}`);
    } else {
      console.log(`[Firebase] ⚠️ Result saved for ${uniqueKey} WITHOUT image`);
    }
  } catch (error: any) {
    console.error('[Firebase] Error saving result:', error);

    // Provide more helpful error messages
    if (error?.code === 'permission-denied') {
      throw new Error('Firebase 权限被拒绝。请检查 Firestore 安全规则是否允许写入。');
    } else if (error?.code === 'unavailable') {
      throw new Error('Firebase 服务不可用。请检查网络连接和 Firebase 项目配置。');
    } else if (error?.message?.includes('Firebase not initialized')) {
      throw new Error('Firebase 未初始化。请检查环境变量配置。');
    }

    throw error;
  }
};

/**
 * Get cached divination result from Firestore
 */
export const getCachedResult = async (uniqueKey: string): Promise<StoredDivinationRecord | null> => {
  try {
    if (!db) {
      return null;
    }

    const docRef = doc(db, COLLECTIONS.DIVINATION_RESULTS, uniqueKey);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data() as StoredDivinationRecord;
      console.log(`[Firebase] Cache Hit for ${uniqueKey}`);
      return data;
    }

    return null;
  } catch (error) {
    console.error('[Firebase] Error getting cached result:', error);
    return null;
  }
};

/**
 * Get all divination results from Firestore
 */
export const getAllResults = async (): Promise<StoredDivinationRecord[]> => {
  try {
    if (!db) {
      return [];
    }

    const q = query(
      collection(db, COLLECTIONS.DIVINATION_RESULTS),
      orderBy('created_at', 'desc')
    );
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => doc.data() as StoredDivinationRecord);
  } catch (error) {
    console.error('[Firebase] Error getting all results:', error);
    return [];
  }
};

/**
 * Update divination result in Firestore
 */
export const updateResult = async (id: string, updates: Partial<DivinationResult>): Promise<void> => {
  try {
    if (!db) {
      throw new Error('Firebase not initialized');
    }

    // Remove undefined values - Firestore doesn't accept undefined
    const cleanUpdates: any = {};
    Object.keys(updates).forEach(key => {
      const value = (updates as any)[key];
      if (value !== undefined) {
        cleanUpdates[key] = value;
      }
    });

    // If no valid updates, return early
    if (Object.keys(cleanUpdates).length === 0) {
      console.log(`[Firebase] No valid updates for ${id}, skipping`);
      return;
    }

    const docRef = doc(db, COLLECTIONS.DIVINATION_RESULTS, id);
    await updateDoc(docRef, cleanUpdates);
    console.log(`[Firebase] Record updated: ${id}`);
  } catch (error) {
    console.error('[Firebase] Error updating record:', error);
    throw error;
  }
};

/**
 * Delete divination result from Firestore
 */
export const deleteResult = async (id: string): Promise<void> => {
  try {
    if (!db) {
      throw new Error('Firebase not initialized');
    }

    const docRef = doc(db, COLLECTIONS.DIVINATION_RESULTS, id);
    await deleteDoc(docRef);
    console.log(`[Firebase] Record deleted: ${id}`);
  } catch (error) {
    console.error('[Firebase] Error deleting record:', error);
    throw error;
  }
};

/**
 * Get system prompt from Firestore
 */
export const getSystemPrompt = async (): Promise<string> => {
  try {
    if (!db) {
      return '';
    }

    const docRef = doc(db, COLLECTIONS.SYSTEM_SETTINGS, 'prompt');
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data().value || '';
    }

    return '';
  } catch (error) {
    console.error('[Firebase] Error getting system prompt:', error);
    return '';
  }
};

/**
 * Save system prompt to Firestore
 */
export const saveSystemPrompt = async (prompt: string): Promise<void> => {
  try {
    if (!db) {
      throw new Error('Firebase not initialized');
    }

    const docRef = doc(db, COLLECTIONS.SYSTEM_SETTINGS, 'prompt');
    await setDoc(docRef, { value: prompt });
    console.log('[Firebase] System prompt saved');
  } catch (error) {
    console.error('[Firebase] Error saving system prompt:', error);
    throw error;
  }
};


/**
 * Check connection to Firestore
 */
export const checkConnection = async (): Promise<{ success: boolean; message: string }> => {
  try {
    if (!db) {
      return { success: false, message: 'Firebase Init Failed (db is null)' };
    }

    // Try to read a non-existent doc to test permission/connection
    const docRef = doc(db, COLLECTIONS.SYSTEM_SETTINGS, '_connection_test_');
    try {
      await getDoc(docRef);
      return { success: true, message: 'Connected to Firestore' };
    } catch (e: any) {
      if (e.code === 'permission-denied') {
        // Write permission check?
        return { success: false, message: 'Permission Denied (Check Rules)' };
      }
      throw e;
    }
  } catch (error: any) {
    return { success: false, message: error.message || String(error) };
  }
};
