\# 產品需求文件 (PRD): 象棋卜卦 AI 解算系統 (V2.0)

| 版本 | 日期 | 作者 | 狀態 |  
| :--- | :--- | :--- | :--- |  
| V2.0 | 2024-05-23 | Project Owner | 定稿 (Final) |

\#\# 1\. 專案概述 (Executive Summary)

\#\#\# 1.1 產品願景  
打造一款結合傳統儀式感與現代 AI 技術的線上象棋卜卦系統。透過擬真的「洗牌與翻牌」互動，還原實體占卜的手氣與隨機性；後端結合 Google Gemini 的強大推理能力，提供即時且深入的卦象解析。

\#\#\# 1.2 核心技術  
\* \*\*前端\*\*: Next.js (React)  
\* \*\*資料庫\*\*: \*\*MongoDB Atlas\*\* (M0 Free Tier)  
\* \*\*AI 模型\*\*: Google Gemini Pro  
\* \*\*部署\*\*: Vercel

\---

\#\# 2\. 使用者流程 (User Flow)

1\.  \*\*進入首頁\*\*: 用戶看到一個 4x8 的棋盤網格，上面排列著 32 顆背面朝上的棋子（已隨機洗牌）。  
2\.  \*\*靜心選棋\*\*:  
    \* 用戶依直覺點選第一顆 \-\> 棋子翻開（如紅帥） \-\> 落入「中」位。  
    \* 點選第二顆 \-\> 翻開 \-\> 落入「左」位。  
    \* 點選第三顆 \-\> 翻開 \-\> 落入「右」位。  
    \* 點選第四顆 \-\> 翻開 \-\> 落入「上」位。  
    \* 點選第五顆 \-\> 翻開 \-\> 落入「下」位。  
3\.  \*\*鎖定與確認\*\*: 選滿 5 顆後，其餘 27 顆棋子變暗鎖定。介面顯示選出的五子十字佈局。  
4\.  \*\*提問\*\*: 用戶選擇問題類別（如：工作、健康、感情）。  
5\.  \*\*解卦\*\*: 系統呼叫 AI 進行分析（或讀取快取）。  
6\.  \*\*結果\*\*: 顯示吉凶判斷、格局標籤與詳細建議。

\---

\#\# 3\. 功能需求 (Functional Requirements)

\#\#\# 3.1 前端：擬真棋盤互動 (Chessboard Interface)  
\* \*\*棋子池生成\*\*: 每次重整頁面時，系統需生成包含以下 32 顆棋子的陣列：  
    \* \*\*紅方 (16顆)\*\*: 帥(1), 仕(2), 相(2), 俥(2), 傌(2), 炮(2), 兵(5)  
    \* \*\*黑方 (16顆)\*\*: 將(1), 士(2), 象(2), 車(2), 馬(2), 包(2), 卒(5)  
\* \*\*洗牌演算法\*\*: 使用 \*\*Fisher-Yates Shuffle\*\* 演算法將上述陣列隨機打亂。  
\* \*\*網格佈局\*\*: 使用 CSS Grid 呈現 4行 x 8列 的佈局。  
\* \*\*翻牌邏輯\*\*:  
    \* 初始狀態顯示「棋背」圖片。  
    \* 點擊後播放 CSS 翻轉動畫 (Flip)，顯示真實棋子內容。  
    \* 依序填入 \`\[Center, Left, Right, Top, Bottom\]\` 陣列。  
\* \*\*狀態控制\*\*:  
    \* 計數器：紀錄目前已選數量 (0/5)。  
    \* 重置按鈕：重新洗牌，清空已選。

\#\#\# 3.2 後端：AI 解算 API  
\* \*\*Endpoint\*\*: \`POST /api/divine\`  
\* \*\*輸入\*\*: \`{ "gua\_code": "117 227...", "category": "WORK" }\`  
\* \*\*邏輯\*\*:  
    1\.  檢查 MongoDB \`divination\_results\` 是否有快取。  
    2\.  若無，從 MongoDB \`system\_settings\` 讀取最新的 Prompt。  
    3\.  將代碼注入 Prompt，呼叫 Gemini API。  
    4\.  將結果存入 MongoDB 並回傳。

\#\#\# 3.3 後台管理：Prompt 維護介面 (Admin Dashboard)  
\* \*\*路徑\*\*: \`/admin/prompt\` (需加上 Basic Auth 或簡易密碼保護)。  
\* \*\*功能\*\*:  
    \* \*\*讀取\*\*: 顯示目前運作中的 System Prompt。  
    \* \*\*編輯\*\*: 提供 Textarea 讓管理者調整解卦規則（例如修改五行的解釋比重）。  
    \* \*\*儲存\*\*: 更新 MongoDB 中的設定檔。  
    \* \*\*還原\*\*: 提供「恢復原廠設定」按鈕。

\---

\#\# 4\. 資料庫設計 (MongoDB Schema)

使用 Mongoose 定義 Schema。

\#\#\# 4.1 System Settings (Prompt 設定)  
用於存儲動態的 AI 提示詞，讓管理者可隨時調整邏輯。

\`\`\`javascript  
// Collection: system\_settings  
const SystemSettingSchema \= new Schema({  
  \_id: { type: String, default: 'divination\_prompt' }, // 固定 ID  
  content: { type: String, required: true }, // 完整的 Super Prompt  
  updated\_at: { type: Date, default: Date.now }  
});

### **4.2 Divination Results (解卦快取)**

用於快取 AI 算過的結果，節省 Token 費用並加速回應。

// Collection: divination\_results  
const DivinationResultSchema \= new Schema({  
  unique\_key: { type: String, required: true, unique: true, index: true }, // 格式: "117-227-317-427-527\_WORK"  
  gua\_code: String,  
  category: String,  
  ai\_result: {  
    layout\_visual: String,  
    pattern\_tags: \[String\],  
    scores: { gain: Number, loss: Number, net: Number },  
    verdict: String,  
    explanation: String,  
    advice: String  
  },  
  created\_at: { type: Date, default: Date.now, expires: '30d' } // TTL 索引: 30天後自動刪除  
});

## **5\. 核心邏輯：AI Super Prompt**

此內容將預設存入 `system_settings` 資料庫中。

\# Role  
你是一位精通《象棋卜卦》的大師。請依據以下規則解析用戶提供的五子卦象。

\# Input Data  
\- \*\*Gua\_Code\*\*: {{USER\_INPUT\_CODE}} (格式: 位置-顏色-棋子, 如 117\)  
  \- 位置: 1中, 2左, 3右, 4上, 5下  
  \- 顏色: 1紅, 2黑  
  \- 棋子: 1帥/將, 2仕/士, 3相/象, 4俥/車, 5傌/馬, 6炮/包, 7兵/卒  
\- \*\*Category\*\*: {{USER\_INPUT\_CATEGORY}}

\# Knowledge Base (規則庫)  
\#\# \[cite\_start\]1. 棋子屬性 \[cite: 654, 738-751\]  
\- 帥/將(80,金), 仕/士(60,金), 相/象(40,火), 俥/車(30,木), 傌/馬(20,木), 炮/包(15,水), 兵/卒(10,土)。

\#\# \[cite\_start\]2. 互動規則 \[cite: 442-492\]  
\- \*\*吃子\*\*: 馬走斜, 炮隔山, 兵卒不退(不能吃位置5)。  
\- \*\*減分\*\*: 若被吃方有保護/抗衡，或吃方受牽制，僅能得一半分數(得好處)。  
\- \*\*淨值\*\*: 收穫(我吃人) \- 付出(人吃我)。

\#\# \[cite\_start\]3. 格局判定 \[cite: 766-1140\]  
\- \*\*好朋友格\*\*: 同階異色且相鄰(馬斜/炮隔)。  
\- \*\*通吃/被通吃\*\*: 無阻礙全吃。被通吃=歸零/大凶。  
\- \*\*一枝獨秀\*\*: 四紅一黑或四黑一紅 (陰陽不調)。  
\- \*\*消耗格\*\*: 同色同階 (兵兵消耗=想太多)。

\#\# \[cite\_start\]4. 解釋邏輯 (依類別) \[cite: 5-411\]  
\- \*\*工作\*\*: 看淨值。通吃=先成後敗。缺地=不踏實。  
\- \*\*健康\*\*: 中間受威脅=核心受損。被馬/炮吃=卡陰/風水。  
\- \*\*失物\*\*: 能吃對方=找得回。

\# Output Format (JSON Only)  
{  
  "layout\_visual": "紅兵居中...",  
  "pattern\_tags": \["被通吃格", "一枝獨秀"\],  
  "scores": {"gain": 0, "loss": 100, "net": \-100},  
  "verdict": "凶",  
  "explanation": "詳細解釋...",  
  "advice": "建議..."  
}

## **6\. 開發與部署檢查清單 (Checklist)**

### **Phase 1: 環境建置**

* \[ \] 註冊 MongoDB Atlas (M0 Free Tier)。  
* \[ \] 取得 Connection String (`mongodb+srv://...`)。  
* \[ \] 建立 Vercel 專案，設定 Environment Variables (`MONGODB_URI`, `GEMINI_API_KEY`)。

### **Phase 2: 後端 API**

* \[ \] 建立 Model: `SystemSetting` 與 `DivinationResult`。  
* \[ \] 實作 `GET /api/admin/prompt` (讀取設定)。  
* \[ \] 實作 `POST /api/admin/prompt` (更新設定)。  
* \[ \] 實作 `POST /api/divine` (核心解卦邏輯)。

### **Phase 3: 前端介面**

* \[ \] 製作 32 顆棋子圖檔 (或使用 CSS 文字)。  
* \[ \] 實作 `ChessGrid` 元件 (Shuffle & Flip 邏輯)。  
* \[ \] 實作選棋狀態管理 (Selected Pieces Array)。  
* \[ \] 整合 API 並顯示 Loading / Result 狀態。

### **Phase 4: 測試**

* \[ \] 驗證：修改後台 Prompt 是否立即影響前台解卦結果。  
* \[ \] 驗證：相同的卦象是否正確命中 MongoDB Cache (不扣 AI Quota)。

