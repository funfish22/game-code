const toolbar = document.querySelector(".liquid-toolbar");
const indicator = toolbar?.querySelector(".liquid-indicator");
const selectableButtons = toolbar?.querySelectorAll(".toolbar-group:first-of-type .toolbar-button") ?? [];

function updateIndicator() {
  const active = toolbar?.querySelector(".toolbar-button.is-active");
  if (!toolbar || !indicator || !active) return;

  const toolbarRect = toolbar.getBoundingClientRect();
  const activeRect = active.getBoundingClientRect();

  indicator.style.setProperty("--x", `${activeRect.left - toolbarRect.left}px`);
  indicator.style.setProperty("--y", `${activeRect.top - toolbarRect.top}px`);
  indicator.style.setProperty("--w", `${activeRect.width}px`);
  indicator.style.setProperty("--h", `${activeRect.height}px`);
  toolbar.classList.add("is-ready");
}

selectableButtons.forEach((button) => {
  button.addEventListener("click", () => {
    selectableButtons.forEach((item) => {
      const isActive = item === button;
      item.classList.toggle("is-active", isActive);
      item.setAttribute("aria-selected", String(isActive));
    });
    updateIndicator();
  });
});

document.querySelector(".primary-button")?.addEventListener("click", () => {
  document.querySelector(".primary-button").textContent = "已完成";
});

window.addEventListener("resize", updateIndicator);
document.fonts?.ready.then(updateIndicator);
updateIndicator();
