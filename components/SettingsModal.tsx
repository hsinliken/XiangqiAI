import React, { useState, useEffect } from 'react';
import { DEFAULT_SYSTEM_PROMPT } from '../constants';
import { storage } from '../services/storage';
import { StoredDivinationRecord } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPrompt: string;
  onSave: (newPrompt: string) => void;
}

type Tab = 'SETTINGS' | 'RECORDS';

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, currentPrompt, onSave }) => {
  const [activeTab, setActiveTab] = useState<Tab>('SETTINGS');
  const [prompt, setPrompt] = useState(currentPrompt);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');

  // DB Records State
  const [records, setRecords] = useState<StoredDivinationRecord[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<StoredDivinationRecord>>({});

  useEffect(() => {
    setPrompt(currentPrompt);
  }, [currentPrompt]);

  useEffect(() => {
    if (isOpen && activeTab === 'RECORDS') {
      loadRecords();
    }
    // Also preload records when modal is opened and admin is authenticated
    // so the header count (`卜卦紀錄 ({records.length})`) reflects actual data
    // even before switching to the RECORDS tab.
    if (isOpen && isAuthenticated) {
      loadRecords();
    }
  }, [isOpen, activeTab, isAuthenticated]);

  // Reset auth on close
  useEffect(() => {
    if (!isOpen) {
      setIsAuthenticated(false);
      setPassword('');
    }
  }, [isOpen]);

  const handleLogin = () => {
    if (password === 'admin') {
      setIsAuthenticated(true);
    } else {
      alert("密碼錯誤");
    }
  };

  const loadRecords = async () => {
    const results = await storage.getAllResults();
    setRecords(results);
  };

  const handleResetPrompt = () => {
    if (window.confirm("是否恢復預設提示詞？")) {
      setPrompt(DEFAULT_SYSTEM_PROMPT);
    }
  };

  const handleEdit = (record: StoredDivinationRecord) => {
    setEditingId(record._id);
    setEditForm({
      hexagram_name: record.hexagram_name,
      luck_level: record.luck_level,
      analysis: record.analysis,
      advice: record.advice,
      layout_image: record.layout_image // Ensure image is passed for display
    });
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("確定要刪除此筆紀錄嗎？")) {
      await storage.deleteResult(id);
      await loadRecords();
    }
  };

  const handleSaveEdit = async () => {
    if (editingId) {
      await storage.updateResult(editingId, editForm);
      setEditingId(null);
      setEditForm({});
      await loadRecords();
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  if (!isOpen) return null;

  // Auth Screen
  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
        <div className="bg-gray-900 border border-yellow-700/50 rounded-lg p-8 w-full max-w-sm shadow-2xl">
          <h2 className="text-xl font-bold text-yellow-500 mb-4 text-center">後台登入</h2>
          <label htmlFor="admin-password" className="sr-only">管理密碼</label>
          <input
            id="admin-password"
            name="admin-password"
            type="password"
            placeholder="輸入管理密碼 (admin)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white mb-4 focus:border-yellow-500 outline-none"
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
          />
          <div className="flex gap-2">
            <button onClick={onClose} className="flex-1 py-2 text-gray-400 hover:text-white">取消</button>
            <button onClick={handleLogin} className="flex-1 py-2 bg-yellow-700 hover:bg-yellow-600 text-white rounded font-bold">登入</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-gray-900 border border-yellow-700/50 rounded-lg w-full max-w-5xl flex flex-col h-[85vh] shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-900">
          <div className="flex gap-6 items-center">
            <h2 className="text-xl font-bold text-yellow-500">後台管理中心</h2>
            <div className="flex gap-1 bg-gray-800 rounded p-1">
              <button
                onClick={() => setActiveTab('SETTINGS')}
                className={`px-4 py-1 rounded text-sm transition-colors ${activeTab === 'SETTINGS' ? 'bg-yellow-700 text-white' : 'text-gray-400 hover:text-white'}`}
              >
                系統設定
              </button>
              <button
                onClick={() => setActiveTab('RECORDS')}
                className={`px-4 py-1 rounded text-sm transition-colors ${activeTab === 'RECORDS' ? 'bg-yellow-700 text-white' : 'text-gray-400 hover:text-white'}`}
              >
                卜卦紀錄 ({records.length})
              </button>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl leading-none">&times;</button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-gray-950/50">

          {/* TAB: SYSTEM SETTINGS */}
          {activeTab === 'SETTINGS' && (
            <div className="p-6 h-full flex flex-col">
              <div className="mb-4 bg-yellow-900/20 border border-yellow-700/30 p-3 rounded text-sm text-yellow-200/80">
                <p className="font-bold mb-1">⚠️ 重要規則變數</p>
                <p>請務必保留 <code className="text-white bg-black/40 px-1 rounded">{'{{USER_INPUT_CODE}}'}</code> 與 <code className="text-white bg-black/40 px-1 rounded">{'{{USER_INPUT_CATEGORY}}'}</code> 標籤，系統將自動填入棋局代碼與問題類別。</p>
              </div>
              <label htmlFor="system-prompt" className="sr-only">系統提示詞</label>
              <textarea
                id="system-prompt"
                name="system-prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="flex-1 w-full bg-black text-green-400 font-mono text-sm p-4 rounded border border-gray-700 focus:border-yellow-500 focus:outline-none resize-none"
                spellCheck={false}
              />
              <div className="mt-4 flex justify-between items-center">
                <button
                  onClick={handleResetPrompt}
                  className="text-red-400 text-sm hover:text-red-300 underline"
                >
                  恢復預設
                </button>
                <button
                  onClick={() => { onSave(prompt); onClose(); }}
                  className="px-6 py-2 bg-yellow-700 hover:bg-yellow-600 text-white rounded font-bold shadow-lg"
                >
                  儲存 Prompt 設定
                </button>
              </div>

              {/* DB Connection Test */}
              <div className="mt-8 pt-4 border-t border-gray-800">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-yellow-500 font-bold text-sm">資料庫狀態檢查</h3>
                  <button
                    onClick={async () => {
                      const res = await storage.checkConnection();
                      alert(res.message);
                    }}
                    className="text-xs border border-gray-600 px-3 py-1 rounded text-gray-400 hover:text-white hover:border-gray-400 transition-colors"
                  >
                    測試連線
                  </button>
                </div>
                <p className="text-xs text-gray-500">
                  若發現資料沒有存入 Firebase (只存在 Local)，請點擊測試連線確認權限設定。
                </p>
              </div>
            </div>
          )}

          {/* TAB: RECORDS */}
          {activeTab === 'RECORDS' && (
            <div className="p-0 h-full overflow-hidden flex flex-col">
              {editingId ? (
                // --- EDIT MODE ---
                <div className="p-6 flex flex-col gap-4 overflow-y-auto">
                  <h3 className="text-yellow-400 font-bold border-b border-gray-700 pb-2">編輯紀錄 (ID: {editingId.substring(0, 15)}...)</h3>

                  {editForm.layout_image && (
                    <div className="flex justify-center my-2 p-2 bg-black/30 rounded border border-gray-700">
                      <img src={editForm.layout_image} alt="Gua Layout" className="max-h-48 rounded shadow-md" />
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="edit-hexagram-name" className="block text-gray-400 text-xs mb-1">格局名稱</label>
                      <input
                        id="edit-hexagram-name"
                        name="hexagram_name"
                        type="text"
                        value={editForm.hexagram_name || ''}
                        onChange={e => setEditForm(prev => ({ ...prev, hexagram_name: e.target.value }))}
                        className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white focus:border-yellow-500 outline-none"
                      />
                    </div>
                    <div>
                      <label htmlFor="edit-luck-level" className="block text-gray-400 text-xs mb-1">吉凶</label>
                      <input
                        id="edit-luck-level"
                        name="luck_level"
                        type="text"
                        value={editForm.luck_level || ''}
                        onChange={e => setEditForm(prev => ({ ...prev, luck_level: e.target.value }))}
                        className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white focus:border-yellow-500 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="edit-analysis" className="block text-gray-400 text-xs mb-1">卦象分析</label>
                    <textarea
                      id="edit-analysis"
                      name="analysis"
                      value={editForm.analysis || ''}
                      onChange={e => setEditForm(prev => ({ ...prev, analysis: e.target.value }))}
                      className="w-full h-32 bg-gray-800 border border-gray-700 rounded p-2 text-white focus:border-yellow-500 outline-none"
                    />
                  </div>

                  <div>
                    <label htmlFor="edit-advice" className="block text-gray-400 text-xs mb-1">神諭建議</label>
                    <textarea
                      id="edit-advice"
                      name="advice"
                      value={editForm.advice || ''}
                      onChange={e => setEditForm(prev => ({ ...prev, advice: e.target.value }))}
                      className="w-full h-24 bg-gray-800 border border-gray-700 rounded p-2 text-white focus:border-yellow-500 outline-none"
                    />
                  </div>

                  <div className="flex gap-3 justify-end pt-4">
                    <button onClick={handleCancelEdit} className="px-4 py-2 text-gray-400 hover:text-white">取消</button>
                    <button onClick={handleSaveEdit} className="px-4 py-2 bg-green-700 hover:bg-green-600 text-white rounded">確認更新</button>
                  </div>
                </div>
              ) : (
                // --- TABLE MODE ---
                <div className="flex-1 overflow-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-900 sticky top-0 z-10 shadow-sm">
                      <tr>
                        <th className="p-3 text-xs font-bold text-gray-400 border-b border-gray-800 w-32">時間</th>
                        <th className="p-3 text-xs font-bold text-gray-400 border-b border-gray-800 w-24">類別</th>
                        <th className="p-3 text-xs font-bold text-gray-400 border-b border-gray-800 w-16 text-center">卦象</th>
                        <th className="p-3 text-xs font-bold text-gray-400 border-b border-gray-800">代碼 (Gua Code)</th>
                        <th className="p-3 text-xs font-bold text-gray-400 border-b border-gray-800 w-32">格局</th>
                        <th className="p-3 text-xs font-bold text-gray-400 border-b border-gray-800 w-20">吉凶</th>
                        <th className="p-3 text-xs font-bold text-gray-400 border-b border-gray-800 w-24 text-center">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {records.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-8 text-center text-gray-500">尚無卜卦紀錄</td>
                        </tr>
                      ) : (
                        records.map(r => {
                          const date = new Date(r.created_at).toLocaleString('zh-TW', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
                          return (
                            <tr key={r._id} className="border-b border-gray-800 hover:bg-white/5 transition-colors">
                              <td className="p-3 text-sm text-gray-400 font-mono">{date}</td>
                              <td className="p-3 text-sm text-yellow-500">{r.category}</td>
                              <td className="p-3 text-center">
                                {r.layout_image ? (
                                  <div className="relative group inline-block">
                                    <img src={r.layout_image} alt="Gua" className="h-8 w-8 object-contain rounded border border-gray-700" />
                                    <div className="absolute left-10 top-0 hidden group-hover:block z-50">
                                      <img src={r.layout_image} alt="Gua Large" className="h-40 w-40 object-contain rounded-lg border-2 border-yellow-600 shadow-xl bg-gray-900" />
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-gray-600">-</span>
                                )}
                              </td>
                              <td className="p-3 text-xs text-gray-500 font-mono">{r.gua_code}</td>
                              <td className="p-3 text-sm font-bold text-white">{r.hexagram_name}</td>
                              <td className="p-3 text-sm">
                                <span className={`px-2 py-0.5 rounded text-xs border ${r.luck_level.includes('吉') ? 'bg-red-900/40 border-red-800 text-red-200' :
                                    'bg-gray-800 border-gray-700 text-gray-300'
                                  }`}>
                                  {r.luck_level}
                                </span>
                              </td>
                              <td className="p-3 flex justify-center gap-2">
                                <button
                                  onClick={() => handleEdit(r)}
                                  className="p-1.5 text-blue-400 hover:bg-blue-900/30 rounded"
                                  title="編輯"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                                </button>
                                <button
                                  onClick={() => handleDelete(r._id)}
                                  className="p-1.5 text-red-400 hover:bg-red-900/30 rounded"
                                  title="刪除"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};