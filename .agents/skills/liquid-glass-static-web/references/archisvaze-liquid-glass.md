# archisvaze/liquid-glass 技術整理

本文件整理 [archisvaze/liquid-glass](https://github.com/archisvaze/liquid-glass) 可轉譯到純靜態 HTML/CSS/JavaScript 的做法。實作時重新組合概念，不直接搬入完整 demo、遠端圖片、控制面板或 WebGL 依賴。

## 核心取向

這個參考的重點不是裝飾性的噪聲扭曲，而是「可參數化的折射玻璃」：

- 以 SVG `feDisplacementMap` 配合 `backdrop-filter` 讓背景在玻璃邊緣產生位移。
- 用玻璃厚度、斜邊寬度與折射率推導位移強度。
- 以 canvas 產生位移圖與 specular map，再透過 `<feImage>` 餵給 SVG filter。
- 視覺層同時由 tint、內陰影、外陰影、邊緣高光與圓角組成。
- Demo 另有 WebGL/Three.js 版本作跨瀏覽器示範；本 skill 預設不加入 Three.js、CDN 或 WebGL，除非使用者明確要求。

## 適合搬到靜態網站的部分

優先套用在小範圍、功能明確的元素：

- 底部工具列的目前選取塊
- 小型浮動按鈕
- 短標籤、切換器或 segmented control
- 不承載長文字的裝飾玻璃層

不要套用在整頁容器、大型清單或需要持續捲動的內容區。

## 參數建議

| 參數 | 靜態網站建議值 | 說明 |
| --- | --- | --- |
| 厚度 | 28–80 | 越高位移越明顯；工具列通常取低值 |
| 斜邊寬度 | 10–36 | 控制折射集中在邊緣的範圍 |
| 折射率 IOR | 1.35–2.2 | 不宜長期使用 demo 中的極端高值 |
| blur | 0.2–1.2 | 用於濾鏡內的背景柔化，不動畫化 |
| tint | 4%–16% | 玻璃覆色；深背景可略高 |
| specular opacity | 0.25–0.65 | 高光明顯但不可壓過文字 |

## SVG filter 結構

產生的濾鏡可採用這個順序：

1. `feGaussianBlur` 柔化 `SourceGraphic` 或 backdrop。
2. `feImage` 載入 canvas 產生的位移圖。
3. `feDisplacementMap` 依紅綠通道位移 X/Y。
4. `feColorMatrix type="saturate"` 提升折射後色彩。
5. 第二個 `feImage` 載入 specular map。
6. `feComponentTransfer` 調整高光 alpha。
7. `feBlend` 合成折射背景與高光。

CSS 優先使用一般材質作 fallback，再以支援的瀏覽器增強：

```css
.liquid-selection {
  background: rgba(235, 255, 252, 0.22);
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.12),
    inset 2px 2px 0 -1px rgba(255, 255, 255, 0.52),
    inset -2px -4px 2px -3px rgba(255, 255, 255, 0.22),
    0 8px 22px rgba(0, 8, 18, 0.22);
}

@supports ((backdrop-filter: url("#liquid-glass-filter")) or (-webkit-backdrop-filter: url("#liquid-glass-filter"))) {
  .liquid-selection {
    -webkit-backdrop-filter: url("#liquid-glass-filter");
    backdrop-filter: url("#liquid-glass-filter");
  }
}
```

`backdrop-filter: url(...)` 實務上偏 Chromium；非支援瀏覽器需保留可接受的覆色、邊框與陰影。

## 動態生成位移圖

靜態頁面可用原生 canvas 生成資料 URL，不需要外部套件。流程：

1. 量測玻璃元素寬高與圓角。
2. 根據厚度、斜邊寬度、IOR 與表面函式計算折射 profile。
3. 對圓角矩形邊緣區域寫入紅綠通道位移。
4. 另產生 specular map 作高光遮罩。
5. 將 `<defs>` 中的 filter innerHTML 替換成新尺寸版本。

重建時機：

- 初次載入
- active 選項尺寸或位置改變
- 視窗 resize
- 字型載入後

效能規則：

- 用 `requestAnimationFrame` 或短 debounce 合併重建。
- 不在 pointermove 時重建濾鏡。
- 將 canvas 尺寸限制在元件實際尺寸，避免全螢幕 data URL。
- 對同一寬高與圓角快取結果；簡單頁面可只在幾何變動時重建。

## 形狀與高光

可使用 convex squircle 作預設表面函式，因為它比直線 bevel 更像玻璃邊緣，也比誇張 lip 更安靜。

高光需與整個頁面的光源方向一致。若頁面已有 `--light-x`、`--light-y`，讓 specular 層與一般 CSS 高光同方向；不要讓每個元件像被不同光源照亮。

## 背景與可讀性

這個技法依賴背景可被折射，因此玻璃後方需要有可辨識的漸層、圖片或柔和光暈。但功能型網站仍以文字可讀為先：

- 長文字保持在較不透明的表面。
- active 選取塊可折射；文字本身不套濾鏡。
- 若背景太雜，增加 tint 或降低位移。
- 在清單、表單與對話框中使用穩定覆色，不追求強折射。

## 不應照搬的部分

- 不把 demo 的整套控制面板放進一般產品頁，除非使用者要求做參數 playground。
- 不預設加入 WebGL/Three.js 版本；這違反本 skill 的無框架、無遠端依賴預設。
- 不依賴 Unsplash 或遠端圖片才能呈現核心效果。
- 不將 SVG `backdrop-filter` 視為所有瀏覽器可用。
- 不使用高 IOR、高厚度與大位移影響操作辨識。
- 不在整頁或大型捲動區即時產生位移圖。
