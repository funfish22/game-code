# Apple 液態玻璃工具列模式

將 Apple 液態玻璃指引轉譯為靜態 HTML 與 CSS 時，遵循本文件；保留 Web 語意，不照搬平台專屬 API。

來源：[Adopting Liquid Glass](https://developer.apple.com/documentation/TechnologyOverviews/adopting-liquid-glass)，重點參考「視覺更新」、「控制項」、「導覽」與「選單和工具列」。

## 功能層

- 將導覽與主要控制放在視覺上獨立的頂層。
- 讓工具列浮在內容前方，不與內容表面融合。
- 內容仍是視覺焦點；玻璃只用在重要功能層。
- 避免自訂裝飾背景干擾材質、捲動邊緣或選取狀態。

## 位置

- 手機上類似分頁列的主要導覽應固定於底部。
- 使用 `bottom: max(12px, env(safe-area-inset-bottom))` 避開裝置安全區。
- 平板與桌面可依工作流程放在頂部、側邊或尾端。
- 位置是情境判斷，不是所有工具列一律置底。
- 固定工具列必須搭配內容底部留白，讓最後一項能完整捲到上方。

## 分組

- 將相似操作或影響同一內容區域的項目放在一起。
- 不同尺寸仍維持穩定的群組順序與位置。
- 無關群組之間使用固定視覺間距。
- 不要把無關命令塞進同一個連續玻璃膠囊。
- 控制不可用時隱藏整個項目，不留下空白槽位。

```html
<nav class="liquid-toolbar" aria-label="檢視選項">
  <div class="toolbar-group">
    <button type="button" aria-label="上一頁">←</button>
    <button type="button" aria-label="下一頁">→</button>
  </div>
  <div class="toolbar-group">
    <button type="button" aria-label="更多選項">•••</button>
  </div>
</nav>
```

## 圖示與標籤

- 常見且高頻操作可使用熟悉圖示減少雜訊。
- 每個純圖示控制都需明確可存取名稱。
- 同一共享背景內，不任意混用純圖示、純文字與圖示加文字。
- 圖示需保持一致的視覺重量與光學尺寸。

## 形狀與互動

- 圓角需與容器保持同心。
- 觸控目標至少 44px。
- 選取狀態同時使用材質、對比與高度差，不只改變色彩。
- 滑入、焦點與選取轉場需輕微、快速且可預測。
- 不動畫化模糊值。

## 捲動與響應式

- 內容滑過工具列下方時，以覆色、模糊或邊緣漸層維持對比。
- 狹窄螢幕保持群組完整；若需隱藏標籤，整個群組採一致策略。
- 避免多個玻璃群組彼此重疊。
- 測試降低透明度、減少動態、提高對比、鍵盤焦點與 320px 寬度。

## CSS 基準

```css
.liquid-toolbar {
  position: fixed;
  left: 50%;
  bottom: max(12px, env(safe-area-inset-bottom));
  transform: translateX(-50%);
  display: flex;
  gap: 10px;
}

.toolbar-group {
  padding: 5px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 999px;
  background: rgba(20, 32, 48, 0.9);
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.2);
}

@supports ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
  .toolbar-group {
    background: rgba(255, 255, 255, 0.1);
    -webkit-backdrop-filter: blur(20px) saturate(140%);
    backdrop-filter: blur(20px) saturate(140%);
  }
}
```

依產品調整色彩與版面，但保留功能層、分組、底部安全區與內容留白原則。
