const toolbar = document.querySelector(".liquid-toolbar");
const indicator = toolbar?.querySelector(".liquid-indicator");
const selectableButtons = toolbar?.querySelectorAll(".toolbar-group:first-of-type .toolbar-button") ?? [];
let filterSignature = "";

const glassFilter = {
  thickness: 28,
  bezel: 12,
  ior: 1.38,
  blur: 0.24,
  saturation: 1.35,
  specularOpacity: 0.24,
  scaleRatio: 0.26,
};

function updateIndicator() {
  const active = toolbar?.querySelector(".toolbar-button.is-active");
  if (!toolbar || !indicator || !active) return;

  const toolbarRect = toolbar.getBoundingClientRect();
  const activeRect = active.getBoundingClientRect();

  indicator.style.setProperty("--x", `${activeRect.left - toolbarRect.left}px`);
  indicator.style.setProperty("--y", `${activeRect.top - toolbarRect.top}px`);
  indicator.style.setProperty("--w", `${activeRect.width}px`);
  indicator.style.setProperty("--h", `${activeRect.height}px`);
  rebuildLiquidFilter(Math.round(activeRect.width), Math.round(activeRect.height));
  toolbar.classList.add("is-ready");
}

function convexSquircle(x) {
  const t = Math.max(0, Math.min(1, x));
  return Math.pow(1 - Math.pow(1 - t, 4), 0.25);
}

function calculateProfile(thickness, bezel, ior, samples = 80) {
  const eta = 1 / ior;
  const profile = new Float64Array(samples);

  function refract(nx, ny) {
    const dot = ny;
    const k = 1 - eta * eta * (1 - dot * dot);
    if (k < 0) return null;
    const sq = Math.sqrt(k);
    return [-(eta * dot + sq) * nx, eta - (eta * dot + sq) * ny];
  }

  for (let i = 0; i < samples; i++) {
    const x = i / samples;
    const y = convexSquircle(x);
    const y2 = convexSquircle(Math.min(1, x + 0.0001));
    const derivative = (y2 - y) / 0.0001;
    const magnitude = Math.sqrt(derivative * derivative + 1);
    const ref = refract(-derivative / magnitude, -1 / magnitude);
    profile[i] = ref && ref[1] !== 0 ? ref[0] * ((y * bezel + thickness) / ref[1]) : 0;
  }

  return profile;
}

function createMap(width, height) {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, width);
  canvas.height = Math.max(1, height);
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  return ctx ? { canvas, ctx } : null;
}

function roundedEdgeGeometry(xPos, yPos, width, height, radius) {
  const widthBody = width - radius * 2;
  const heightBody = height - radius * 2;
  const x = xPos < radius ? xPos - radius : xPos >= width - radius ? xPos - radius - widthBody : 0;
  const y = yPos < radius ? yPos - radius : yPos >= height - radius ? yPos - radius - heightBody : 0;
  return { x, y, distanceSq: x * x + y * y };
}

function generateDisplacement(width, height, radius, bezel, profile, maxDisplacement) {
  const map = createMap(width, height);
  if (!map) return "";

  const image = map.ctx.createImageData(width, height);
  const data = image.data;
  for (let i = 0; i < data.length; i += 4) {
    data[i] = 128;
    data[i + 1] = 128;
    data[i + 2] = 0;
    data[i + 3] = 255;
  }

  const rSq = radius * radius;
  const rOuterSq = (radius + 1) ** 2;
  const rBezelSq = Math.max(radius - bezel, 0) ** 2;

  for (let yPos = 0; yPos < height; yPos++) {
    for (let xPos = 0; xPos < width; xPos++) {
      const geom = roundedEdgeGeometry(xPos, yPos, width, height, radius);
      if (geom.distanceSq > rOuterSq || geom.distanceSq < rBezelSq) continue;

      const distance = Math.sqrt(geom.distanceSq);
      if (distance === 0) continue;

      const fromSide = radius - distance;
      const opacity = geom.distanceSq < rSq
        ? 1
        : 1 - (distance - Math.sqrt(rSq)) / (Math.sqrt(rOuterSq) - Math.sqrt(rSq));
      if (opacity <= 0) continue;

      const index = (yPos * width + xPos) * 4;
      const sampleIndex = Math.min(((fromSide / bezel) * profile.length) | 0, profile.length - 1);
      const displacement = profile[sampleIndex] || 0;
      data[index] = (128 + ((-geom.x / distance) * displacement / maxDisplacement) * 127 * opacity + 0.5) | 0;
      data[index + 1] = (128 + ((-geom.y / distance) * displacement / maxDisplacement) * 127 * opacity + 0.5) | 0;
    }
  }

  map.ctx.putImageData(image, 0, 0);
  return map.canvas.toDataURL();
}

function generateSpecular(width, height, radius, bezel, angle = Math.PI / 3) {
  const map = createMap(width, height);
  if (!map) return "";

  const image = map.ctx.createImageData(width, height);
  const data = image.data;
  data.fill(0);

  const rSq = radius * radius;
  const rOuterSq = (radius + 1) ** 2;
  const rBezelSq = Math.max(radius - bezel, 0) ** 2;
  const light = [Math.cos(angle), Math.sin(angle)];

  for (let yPos = 0; yPos < height; yPos++) {
    for (let xPos = 0; xPos < width; xPos++) {
      const geom = roundedEdgeGeometry(xPos, yPos, width, height, radius);
      if (geom.distanceSq > rOuterSq || geom.distanceSq < rBezelSq) continue;

      const distance = Math.sqrt(geom.distanceSq);
      if (distance === 0) continue;

      const fromSide = radius - distance;
      const opacity = geom.distanceSq < rSq
        ? 1
        : 1 - (distance - Math.sqrt(rSq)) / (Math.sqrt(rOuterSq) - Math.sqrt(rSq));
      if (opacity <= 0) continue;

      const dot = Math.abs((geom.x / distance) * light[0] + (-geom.y / distance) * light[1]);
      const edge = Math.sqrt(Math.max(0, 1 - (1 - fromSide) ** 2));
      const color = (255 * dot * edge) | 0;
      const alpha = (color * dot * edge * opacity) | 0;
      const index = (yPos * width + xPos) * 4;
      data[index] = color;
      data[index + 1] = color;
      data[index + 2] = color;
      data[index + 3] = alpha;
    }
  }

  map.ctx.putImageData(image, 0, 0);
  return map.canvas.toDataURL();
}

function rebuildLiquidFilter(width, height) {
  const defs = document.getElementById("liquid-filter-defs");
  if (!defs || width < 8 || height < 8) return;

  const radius = Math.min(width / 2, height / 2);
  const bezel = Math.max(2, Math.min(glassFilter.bezel, radius - 1, width / 2 - 1, height / 2 - 1));
  const signature = [
    width,
    height,
    Math.round(radius * 100) / 100,
    bezel,
    glassFilter.thickness,
    glassFilter.ior,
    glassFilter.blur,
    glassFilter.saturation,
    glassFilter.specularOpacity,
  ].join(":");

  if (signature === filterSignature) return;

  const profile = calculateProfile(glassFilter.thickness, bezel, glassFilter.ior);
  const maxDisplacement = Math.max(...Array.from(profile, Math.abs)) || 1;
  const displacementUrl = generateDisplacement(width, height, radius, bezel, profile, maxDisplacement);
  const specularUrl = generateSpecular(width, height, radius, bezel * 2.3);
  if (!displacementUrl || !specularUrl) return;

  const scale = Math.max(2, maxDisplacement * glassFilter.scaleRatio);
  defs.innerHTML = `
    <filter id="liquid-toolbar-filter" x="0%" y="0%" width="100%" height="100%">
      <feGaussianBlur in="SourceGraphic" stdDeviation="${glassFilter.blur}" result="blurred_source"></feGaussianBlur>
      <feImage href="${displacementUrl}" x="0" y="0" width="${width}" height="${height}" result="disp_map"></feImage>
      <feDisplacementMap in="blurred_source" in2="disp_map" scale="${scale}" xChannelSelector="R" yChannelSelector="G" result="displaced"></feDisplacementMap>
      <feColorMatrix in="displaced" type="saturate" values="${glassFilter.saturation}" result="displaced_sat"></feColorMatrix>
      <feImage href="${specularUrl}" x="0" y="0" width="${width}" height="${height}" result="spec_layer"></feImage>
      <feComponentTransfer in="spec_layer" result="spec_faded">
        <feFuncA type="linear" slope="${glassFilter.specularOpacity}"></feFuncA>
      </feComponentTransfer>
      <feBlend in="displaced_sat" in2="spec_faded" mode="normal"></feBlend>
    </filter>
  `;
  filterSignature = signature;
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
