const DATA_URL = "codes.json";
const STORAGE_KEY = "yanyun-code-claims:v1";

const state = {
  groups: [],
  activeDate: "",
  claimed: readClaimedState(),
};

const els = {};

document.addEventListener("DOMContentLoaded", () => {
  els.sourceStatus = document.getElementById("sourceStatus");
  els.totalCodes = document.getElementById("totalCodes");
  els.claimedCodes = document.getElementById("claimedCodes");
  els.remainingCodes = document.getElementById("remainingCodes");
  els.dateSummary = document.getElementById("dateSummary");
  els.dateTabs = document.getElementById("dateTabs");
  els.notice = document.getElementById("notice");
  els.codeGroups = document.getElementById("codeGroups");

  loadCodes();
});

async function loadCodes() {
  setNotice("正在讀取序號資料");

  try {
    const response = await fetch(DATA_URL, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const payload = await response.json();
    state.groups = normalizeCodeData(payload);
    state.activeDate = getInitialActiveDate(state.groups, state.activeDate);
    renderDateTabs();
    renderCodeGroups();
    updateSourceStatus("已載入 codes.json", "is-ready");
    setNotice("");
  } catch (error) {
    state.groups = [];
    state.activeDate = "";
    renderDateTabs();
    renderCodeGroups();
    updateSourceStatus("讀取失敗", "is-error");
    setNotice("無法讀取 codes.json，請確認正在使用本機伺服器開啟此頁面。", "is-error");
  }
}

function normalizeCodeData(payload) {
  const entries = Array.isArray(payload)
    ? payload.map((item) => ({
        date: item?.date ?? item?.day ?? item?.label ?? "",
        codes: item?.codes ?? item?.serials ?? item?.items ?? item?.value ?? [],
      }))
    : Object.entries(payload ?? {}).map(([date, codes]) => ({ date, codes }));

  return entries
    .map(({ date, codes }) => {
      const dateText = String(date).trim();
      const parsedCodes = parseCodes(codes).map((code) => ({
        code,
        key: createClaimKey(dateText, code),
        id: `claim-${hashString(`${dateText}:${code}`)}`,
      }));

      return {
        date: dateText,
        label: formatDate(dateText),
        codes: parsedCodes,
      };
    })
    .filter((group) => group.date && group.codes.length > 0)
    .sort(compareGroupsByDateDesc);
}

function parseCodes(value) {
  if (value == null) {
    return [];
  }

  if (Array.isArray(value)) {
    return value.flatMap((entry) => {
      if (entry && typeof entry === "object") {
        return parseCodes(entry.code ?? entry.serial ?? entry.value ?? "");
      }

      return parseCodes(entry);
    });
  }

  return String(value)
    .split(/\r?\n/)
    .map((code) => code.trim())
    .filter(Boolean);
}

function compareGroupsByDateDesc(a, b) {
  const aTime = getDateTime(a.date);
  const bTime = getDateTime(b.date);

  if (Number.isFinite(aTime) && Number.isFinite(bTime) && aTime !== bTime) {
    return bTime - aTime;
  }

  return b.date.localeCompare(a.date, "zh-Hant", { numeric: true });
}

function getDateTime(dateText) {
  const value = dateText.includes("T") ? dateText : `${dateText}T00:00:00`;
  return Date.parse(value);
}

function formatDate(dateText) {
  const time = getDateTime(dateText);

  if (!Number.isFinite(time)) {
    return dateText;
  }

  return new Intl.DateTimeFormat("zh-Hant-TW", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(time));
}

function getInitialActiveDate(groups, currentDate) {
  if (currentDate && groups.some((group) => group.date === currentDate)) {
    return currentDate;
  }

  return groups[0]?.date ?? "";
}

function getActiveGroup() {
  return state.groups.find((group) => group.date === state.activeDate) ?? state.groups[0] ?? null;
}

function selectDate(date) {
  if (state.activeDate === date) {
    return;
  }

  state.activeDate = date;
  renderDateTabs();
  renderCodeGroups();
}

function renderDateTabs() {
  els.dateTabs.replaceChildren();

  if (state.groups.length === 0) {
    return;
  }

  const fragment = document.createDocumentFragment();

  for (const group of state.groups) {
    const button = document.createElement("button");
    const isActive = group.date === state.activeDate;
    button.className = "date-tab";
    button.type = "button";
    button.dataset.date = group.date;
    button.setAttribute("aria-pressed", String(isActive));

    const date = document.createElement("time");
    date.dateTime = group.date;
    date.textContent = group.label;

    const count = document.createElement("span");
    count.className = "date-count";
    count.dataset.dateCount = group.date;
    count.textContent = getDateCountText(group);

    button.append(date, count);
    button.addEventListener("click", () => selectDate(group.date));
    fragment.append(button);
  }

  els.dateTabs.append(fragment);
}

function renderCodeGroups() {
  els.codeGroups.replaceChildren();

  if (state.groups.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = "目前沒有可顯示的序號。";
    els.codeGroups.append(empty);
    updateStats();
    return;
  }

  const fragment = document.createDocumentFragment();
  const group = getActiveGroup();

  if (group) {
    fragment.append(createDateSection(group));
  }

  els.codeGroups.append(fragment);
  updateStats();
}

function createDateSection(group) {
  const section = document.createElement("section");
  section.className = "date-section";
  section.setAttribute("aria-labelledby", `date-${hashString(group.date)}`);

  const tag = document.createElement("h3");
  tag.className = "date-tag";
  tag.id = `date-${hashString(group.date)}`;

  const date = document.createElement("time");
  date.dateTime = group.date;
  date.textContent = group.label;

  const count = document.createElement("span");
  count.className = "date-count";
  count.dataset.dateCount = group.date;
  count.textContent = getDateCountText(group);

  tag.append(date, count);

  const list = document.createElement("ul");
  list.className = "code-list";

  for (const item of group.codes) {
    list.append(createCodeRow(group, item));
  }

  section.append(tag, list);
  return section;
}

function createCodeRow(group, item) {
  const row = document.createElement("li");
  row.className = "code-row";
  row.classList.toggle("is-claimed", Boolean(state.claimed[item.key]));

  const label = document.createElement("label");
  label.className = "claim-toggle";

  const checkbox = document.createElement("input");
  checkbox.className = "claim-input";
  checkbox.type = "checkbox";
  checkbox.checked = Boolean(state.claimed[item.key]);
  checkbox.setAttribute("aria-label", `標記 ${item.code} 已領取`);

  const checkmark = document.createElement("span");
  checkmark.className = "checkmark";
  checkmark.setAttribute("aria-hidden", "true");
  checkmark.textContent = "✓";

  const claimText = document.createElement("span");
  claimText.textContent = "已領取";

  checkbox.addEventListener("change", () => {
    setClaimed(item.key, checkbox.checked);
    row.classList.toggle("is-claimed", checkbox.checked);
    updateDateCount(group);
    updateStats();
  });

  label.append(checkbox, checkmark, claimText);

  const code = document.createElement("code");
  code.className = "code-value";
  code.textContent = item.code;

  const button = document.createElement("button");
  button.className = "copy-button";
  button.type = "button";
  button.setAttribute("aria-label", `複製序號 ${item.code}`);
  button.innerHTML = `${copyIcon()}<span>複製</span>`;
  button.addEventListener("click", () => copyCode(item.code, button));

  row.append(label, code, button);
  return row;
}

function getDateCountText(group) {
  const claimed = group.codes.filter((item) => state.claimed[item.key]).length;
  return `${claimed}/${group.codes.length} 已領取`;
}

function updateDateCount(group) {
  const counts = document.querySelectorAll("[data-date-count]");

  for (const count of counts) {
    if (count.dataset.dateCount !== group.date) {
      continue;
    }

    count.textContent = getDateCountText(group);
  }
}

function updateStats() {
  const group = getActiveGroup();
  const total = group?.codes.length ?? 0;
  const claimed = group?.codes.filter((item) => state.claimed[item.key]).length ?? 0;
  const remaining = Math.max(total - claimed, 0);

  els.totalCodes.textContent = String(total);
  els.claimedCodes.textContent = String(claimed);
  els.remainingCodes.textContent = String(remaining);

  els.dateSummary.textContent = group ? `${group.label}，${getDateCountText(group)}` : "沒有日期分組";
}

function setClaimed(key, isClaimed) {
  if (isClaimed) {
    state.claimed[key] = true;
  } else {
    delete state.claimed[key];
  }

  persistClaimedState();
}

async function copyCode(code, button) {
  const label = button.querySelector("span");
  const originalLabel = label.textContent;

  try {
    await writeClipboard(code);
    button.classList.add("is-copied");
    label.textContent = "已複製";
    setNotice("序號已複製");
  } catch (error) {
    setNotice("無法複製序號，請手動選取文字。", "is-error");
  } finally {
    window.setTimeout(() => {
      button.classList.remove("is-copied");
      label.textContent = originalLabel;
    }, 1400);
  }
}

async function writeClipboard(text) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch (error) {
      // Fall through to the legacy path when browser permissions block Clipboard API.
    }
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  textarea.style.top = "0";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  textarea.setSelectionRange(0, text.length);

  try {
    const succeeded = document.execCommand("copy");
    if (!succeeded) {
      throw new Error("execCommand copy failed");
    }
  } finally {
    textarea.remove();
  }
}

function readClaimedState() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch (error) {
    return {};
  }
}

function persistClaimedState() {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state.claimed));
  } catch (error) {
    setNotice("瀏覽器目前無法寫入 localStorage。", "is-error");
  }
}

function createClaimKey(date, code) {
  return `${date}::${code}`;
}

function hashString(value) {
  let hash = 2166136261;

  for (const char of value) {
    hash ^= char.codePointAt(0);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0).toString(36);
}

function updateSourceStatus(text, className) {
  els.sourceStatus.className = "source-pill";
  els.sourceStatus.classList.add(className);
  els.sourceStatus.textContent = text;
}

function setNotice(message, className = "") {
  els.notice.className = className ? `notice ${className}` : "notice";
  els.notice.textContent = message;
}

function copyIcon() {
  return `
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M8 8.5A2.5 2.5 0 0 1 10.5 6h6A2.5 2.5 0 0 1 19 8.5v8A2.5 2.5 0 0 1 16.5 19h-6A2.5 2.5 0 0 1 8 16.5v-8Z" fill="none" stroke="currentColor" stroke-width="1.8"/>
      <path d="M5 15.5v-8A2.5 2.5 0 0 1 7.5 5h6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
    </svg>
  `;
}
