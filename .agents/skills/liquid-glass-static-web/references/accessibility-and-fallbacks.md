# 無障礙與降級處理

## 必要檢查

- 一般文字對比盡量符合 WCAG AA：內文 4.5:1，大型文字 3:1。
- 長文字不得直接放在高度透明玻璃上。
- 保留正確標題階層、標籤、按鈕名稱與地標元素。
- 使用真正的 `<button>`、`<input>`、`<nav>`、`<main>` 與適當對話框語意，不以可點擊 `<div>` 取代。
- 所有互動都能使用鍵盤完成。
- `:focus-visible` 使用高對比實線外框與適當偏移。
- 觸控目標約 44×44 CSS 像素。
- 不只以色彩傳達狀態。
- 純圖示按鈕需提供 `aria-label` 或等效可存取名稱。

## 減少動態

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    scroll-behavior: auto !important;
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }

  .liquid-indicator {
    filter: none;
  }
}
```

使用前確認沒有互動依賴動畫完成事件。

## 背景模糊降級

先宣告接近不透明的背景，再增強：

```css
.glass-surface {
  background: rgba(20, 28, 48, 0.92);
}

@supports ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
  .glass-surface {
    background: rgba(255, 255, 255, 0.12);
    -webkit-backdrop-filter: blur(20px) saturate(140%);
    backdrop-filter: blur(20px) saturate(140%);
  }
}
```

不可把唯一可讀的背景放在 `@supports` 內。

## SVG 折射降級

- 折射只作為增強效果，不得影響文字或操作辨識。
- 將位移濾鏡套在選取塊或裝飾層，不套在文字內容。
- 不支援 `filter: url()` 或 `backdrop-filter: url()` 時保留圓角、覆色、內高光與陰影。
- `backdrop-filter: url(...)` 實務上偏 Chromium；Firefox、Safari 或部分行動瀏覽器需視為可能只看到 fallback 材質。
- 小螢幕、低效能裝置或減少動態模式可直接停用折射。
- 動態產生 `<feImage>` 位移圖時，必須限制 canvas 尺寸並只在幾何變化時重建，不在捲動或指標移動時重建。

## 強制色彩與高對比

```css
@media (forced-colors: active) {
  .glass-surface,
  .toolbar-group {
    border: 1px solid CanvasText;
    background: Canvas;
    color: CanvasText;
    box-shadow: none;
    filter: none;
  }
}
```

允許系統色彩與原生焦點外框優先。

## 效能

- 避免大量重疊的 `backdrop-filter` 區域。
- 優先模糊一個父層，而非每個子元素各自模糊。
- 不動畫化模糊、飽和度或 SVG 位移強度。
- SVG `feImage`、`feTurbulence` 與 `feDisplacementMap` 只用在小型重要元素。
- 動態位移圖的資料 URL 不應大於實際元件尺寸，也不應套在整頁或大型清單。
- 動態場景優先動畫化 `transform` 與 `opacity`。
- 在手機尺寸測試捲動、鍵盤彈出與固定底部工具列。
- 若出現卡頓，先移除折射與裝飾動畫，再降低必要功能品質。
