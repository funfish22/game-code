# CodePen 液態玻璃技術整理

本文件整理兩個參考範例中可泛化的技術，實作時應重新組合，不直接複製完整作品或外部資產。

來源：

- [Liquid Glass Switcher. CSS](https://codepen.io/fooontic/pen/KwpRaGr)
- [Apple Liquid Glass UI (2025)](https://codepen.io/samarkandiy/pen/yyNvNGQ)

## 流動選取塊

第一個範例以單一偽元素作為目前選取背景，依已勾選 radio 移動位置，避免每個選項各自產生厚重背景。

轉譯為一般工具列時：

1. 在工具列內建立一個 `aria-hidden="true"` 的選取塊。
2. 讀取目前按鈕與工具列的 `getBoundingClientRect()`。
3. 更新選取塊的 X、Y、寬度與高度 CSS 變數。
4. 使用彈性貝茲曲線平移。
5. 移動期間只讓選取塊內部高光短暫橫向拉伸。

```js
function updateIndicator() {
  const bar = document.querySelector(".liquid-toolbar");
  const active = bar.querySelector("[aria-selected='true']");
  const indicator = bar.querySelector(".liquid-indicator");
  const barRect = bar.getBoundingClientRect();
  const activeRect = active.getBoundingClientRect();

  indicator.style.setProperty("--x", `${activeRect.left - barRect.left}px`);
  indicator.style.setProperty("--y", `${activeRect.top - barRect.top}px`);
  indicator.style.setProperty("--w", `${activeRect.width}px`);
  indicator.style.setProperty("--h", `${activeRect.height}px`);
}
```

如需方向感，可記錄前一個選項，依左右移動設定 `transform-origin`。

## 光學邊緣

第一個範例不是只使用一條白色邊框，而是疊加多道內陰影：

- 最外層極淡描邊
- 左上高亮反射
- 右下低亮反射
- 深色內側折射
- 柔和外陰影

使用 `color-mix()` 搭配反射強度變數，可讓同一套材質適應亮色、暗色與染色主題。

```css
.liquid-surface {
  box-shadow:
    inset 0 0 0 1px color-mix(in srgb, white 10%, transparent),
    inset 2px 2px 0 -1px color-mix(in srgb, white 55%, transparent),
    inset -2px -3px 1px -2px color-mix(in srgb, white 20%, transparent),
    inset -1px 2px 4px -2px color-mix(in srgb, black 35%, transparent),
    0 10px 28px color-mix(in srgb, black 20%, transparent);
}
```

## 四層玻璃結構

第二個範例將材質拆成四層：

1. `glass-filter`：背景模糊與折射。
2. `glass-overlay`：半透明覆色。
3. `glass-specular`：鏡面高光與內側亮邊。
4. `glass-content`：清晰內容。

這種拆分比把所有效果塞進單一元素更容易調整、降級與除錯。

```css
.glass-shell {
  position: relative;
  overflow: hidden;
  isolation: isolate;
}

.glass-layer {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.glass-filter { z-index: 0; }
.glass-overlay { z-index: 1; }
.glass-specular { z-index: 2; }
.glass-content { position: relative; z-index: 3; }
```

## SVG 折射

第二個範例使用 `feTurbulence`、`feGaussianBlur` 與 `feDisplacementMap` 製作不規則折射。

```html
<svg aria-hidden="true" class="filter-defs">
  <filter id="liquid-warp" x="-20%" y="-30%" width="140%" height="160%">
    <feTurbulence
      type="fractalNoise"
      baseFrequency="0.012 0.022"
      numOctaves="2"
      seed="14"
      result="noise">
    </feTurbulence>
    <feGaussianBlur in="noise" stdDeviation="1.4" result="softNoise"></feGaussianBlur>
    <feDisplacementMap
      in="SourceGraphic"
      in2="softNoise"
      scale="5"
      xChannelSelector="R"
      yChannelSelector="G">
    </feDisplacementMap>
  </filter>
</svg>
```

使用限制：

- 只套在小型選取塊、按鈕或裝飾層。
- 不套在文字與表單內容。
- 位移強度保持低值。
- 不動畫化 turbulence 或位移強度。
- 在減少動態、高對比或效能不足時停用。

## 動態高光

可依指標位置更新鏡面高光的徑向漸層中心：

```js
surface.addEventListener("pointermove", (event) => {
  const rect = surface.getBoundingClientRect();
  surface.style.setProperty("--light-x", `${(event.clientX - rect.left) / rect.width * 100}%`);
  surface.style.setProperty("--light-y", `${(event.clientY - rect.top) / rect.height * 100}%`);
});
```

這是裝飾增強，不可取代焦點或選取狀態；觸控裝置與減少動態模式可忽略。

## 不應照搬的部分

- 不直接使用大型 base64 位移圖。
- 不在整頁或大型捲動區持續套 SVG 折射。
- 不使用背景持續位移動畫干擾內容閱讀。
- 不依賴遠端字型、照片或圖示才能呈現核心介面。
- 不為了視覺效果犧牲鍵盤操作、文字對比與捲動效能。
