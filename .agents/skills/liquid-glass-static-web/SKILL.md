---
name: liquid-glass-static-web
description: 使用純靜態 HTML、CSS 與可選的原生 JavaScript，設計、建立或改造具 Apple 設計觀念的液態玻璃網頁介面。適用於無框架網站中的工具列、分頁導覽、表單、卡片、按鈕、選取器、選單、彈出視窗、JSON 資料清單、本機 localStorage 狀態工具與既有頁面重構；包含玻璃分層、流動選取動畫、光學高光、折射效果、響應式配置、無障礙與瀏覽器降級，不使用 React、Vue、Tailwind、npm 或建置工具。
---

# 液態玻璃靜態網頁

以語意化 HTML、原生 CSS 與必要的原生 JavaScript，製作清晰、流暢且可維護的液態玻璃介面。

## 工作流程

1. 檢查既有 HTML、CSS、JavaScript、資產與使用者可見行為。
2. 除非需求明確要求變更，保留既有 ID、表單語意、事件掛鉤、儲存鍵與正常互動。
3. 先建立背景景深，再加入玻璃：
   - 使用節制的漸層、圖片或柔和色彩光暈。
   - 讓背景襯托功能層，不搶走內容焦點。
4. 在 `:root` 定義色彩、透明度、模糊、飽和度、反光、陰影、圓角、間距與動態設計變數。
5. 只在重要功能層使用玻璃：
   - 主容器或浮動導覽
   - 分組工具列、控制項、選單與彈出視窗
   - 目前選取或聚焦的項目
6. 依需求選擇效果層級：
   - 一般玻璃：透明覆色、背景模糊、邊框與陰影
   - 分層玻璃：濾鏡、覆色、鏡面高光、內容四層
   - 流動選取：獨立選取塊平移並短暫拉伸
   - 折射效果：只在小型、重要元素使用以厚度、斜邊與折射率推導的 SVG 位移濾鏡
7. 驗證響應式版面、鍵盤焦點、文字對比、減少動態、降低透明度與不支援濾鏡時的降級樣式。
8. 直接測試靜態頁面，不加入建置流程。

## 實作規則

- 使用有效的語意化 HTML 與瀏覽器原生 API。
- 不加入框架、套件管理器、元件庫、預處理器或建置工具。
- 優先使用 CSS 類別與自訂屬性，避免重複行內樣式。
- 同時宣告 `backdrop-filter` 與 `-webkit-backdrop-filter`。
- 先提供接近不透明的可靠背景，再以 `@supports` 增強透明與模糊效果。
- 將玻璃視為控制與導覽的頂層功能材質，而不是內容裝飾。
- 一個畫面最多使用三種玻璃高度層級。
- 長文字必須位於足夠不透明的表面上。
- 工具列依功能或影響區域分組；無關操作之間保留明確間距。
- 同一玻璃群組內保持圖示、文字或圖示加文字的呈現方式一致。
- 純圖示按鈕必須提供可存取名稱。
- 手機上的主要分頁導覽固定在底部安全區上方；寬螢幕才依情境改用頂部、側邊或尾端位置。
- 讓內容可從浮動工具列下方捲動，並保留足夠底部捲動間距。
- 選取塊使用獨立元素或偽元素移動，避免重建每個按鈕背景。
- 動畫只改變 `transform`、`opacity`、位置或尺寸；不要動畫化模糊值。
- SVG 位移濾鏡只套用於小型玻璃元素；若動態生成位移圖，需依元素尺寸節流重建並提供無濾鏡版本。
- 不使用巨型 base64 位移圖，除非使用者明確要求且已驗證效能。
- 互動狀態需涵蓋預設、滑入、按下、`focus-visible`、選取與停用。
- 在 `prefers-reduced-motion: reduce` 下移除拉伸、漂浮與非必要轉場。
- 能以行內 SVG、CSS 圖形、系統字型或既有本機資產完成時，不加入遠端依賴。

## 建議的玻璃分層

```html
<div class="glass-shell">
  <div class="glass-filter" aria-hidden="true"></div>
  <div class="glass-overlay" aria-hidden="true"></div>
  <div class="glass-specular" aria-hidden="true"></div>
  <div class="glass-content">內容</div>
</div>
```

各層職責：

1. `glass-filter`：背景模糊、飽和或小幅折射。
2. `glass-overlay`：控制材質色調與透明度。
3. `glass-specular`：加入方向一致的鏡面高光與內陰影。
4. `glass-content`：保持清晰，不直接套用濾鏡。

## 建議的 CSS 排列

1. 重設與文件預設值
2. 設計變數
3. 背景場景
4. 版面
5. 玻璃基礎與分層
6. 元件
7. 互動狀態與流動選取
8. 響應式規則
9. 無障礙與功能降級

## 視覺判斷

- 先以透明度、間距與明暗建立層次，再增加模糊。
- 高光應暗示同一光源方向。
- 外層與內層圓角保持同心且留白均勻。
- 使用邊緣對比區分重疊表面，不只依靠陰影。
- 讓選取塊有輕微彈性，不做黏稠、拖沓或過度果凍化的動畫。
- 優先製作安靜、可讀、可操作的介面，而非堆滿玻璃卡片。

## JSON 清單與本機狀態工具

- 讀取外部 JSON 時，使用 `fetch()` 載入相鄰檔案，並提示需要以本機伺服器開啟，避免 `file://` 無法讀取。
- 日期分組清單優先支援 `{ "YYYY-MM-DD": ["CODE"] }`，也可容錯支援 `[{ "date": "YYYY-MM-DD", "codes": [...] }]`。
- 需要一行一筆資料時，同時支援陣列項目與以換行分隔的字串，再於渲染前修剪空白與移除空行。
- 依日期排序後，將日期呈現為內容區標籤或區段標題，不把日期分組誤做工具列。
- 每筆資料的勾選狀態以穩定鍵寫入 `localStorage`；鍵值需包含日期與內容，避免不同日期的相同項目互相覆蓋。
- 複製按鈕使用 Clipboard API，並提供 `document.execCommand("copy")` 後備；按鈕需有文字或可存取名稱與短暫回饋。
- 統計摘要從同一份狀態推導，不另外保存，避免 JSON 更新後與本機狀態不同步。
- 清單列保持輕量分隔與足夠觸控面積；長序號使用 `overflow-wrap: anywhere`，手機版不可溢出容器。

## 參考資料

- 選擇設計變數、層級與元件樣式時，讀取 [references/design-system.md](references/design-system.md)。
- 製作工具列、分頁、導覽或選單時，讀取 [references/apple-toolbar-patterns.md](references/apple-toolbar-patterns.md)。
- 製作折射、分層玻璃或流動選取動畫時，讀取 [references/archisvaze-liquid-glass.md](references/archisvaze-liquid-glass.md)。
- 完成前讀取 [references/accessibility-and-fallbacks.md](references/accessibility-and-fallbacks.md)。
- 建立全新頁面時可複製 [assets/static-starter](assets/static-starter)；修改既有網站時，應保留原有結構與行為。
