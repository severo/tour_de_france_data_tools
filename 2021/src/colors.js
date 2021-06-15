const { createCanvas, loadImage } = require("canvas");
const d3 = require("d3");

// See https://observablehq.com/@severo/main-colors-from-image
async function mainColors(
  url,
  { maxColors, minOpacity = 0, minDistance = 0 } = {}
) {
  const image = await loadImage(url);
  const imageData = getImageData(image);

  const colors = new Map();
  for (let i = 0; i < imageData.length; i += 4) {
    const color = d3.rgb(
      imageData[i],
      imageData[i + 1],
      imageData[i + 2],
      imageData[i + 3] / 255 // opacity
    );
    const h = color.formatHex();
    if (!colors.has(h)) {
      colors.set(h, { color, pixels: 0 });
    }
    colors.get(h).pixels += 1;
  }
  const sorted = [...colors.values()]
    .sort((a, b) => b.pixels - a.pixels)
    .filter((d) => d.color.opacity >= +minOpacity);

  if (minDistance === 0) {
    return sorted
      .slice(0, maxColors || sorted.length)
      .map((d) => d.color.formatHex());
  }

  // Remove colors, one by one
  const selected = [];
  for (const candidate of sorted) {
    const nearestIdx = d3.leastIndex(
      selected.map((d) => d.color),
      (a, b) => distance(a, candidate.color) - distance(b, candidate.color)
    );

    if (
      !selected.length ||
      nearestIdx === -1 ||
      distance(selected[nearestIdx].color, candidate.color) >= minDistance
    ) {
      selected.push(candidate);
    } else {
      selected[nearestIdx].pixels += candidate.pixels;
    }
  }

  return selected
    .slice(0, maxColors || selected.length)
    .map((d) => d.color.formatHex());
}

function getImageData(image) {
  const ctx = createCanvas(image.naturalWidth, image.naturalHeight).getContext(
    "2d"
  );
  ctx.drawImage(image, 0, 0);
  const data = ctx.getImageData(0, 0, image.naturalWidth, image.naturalHeight);
  return data.data;
}

// See https://observablehq.com/@severo/color-distance
const sin = (x) => Math.sin((x * Math.PI) / 180);
const cos = (x) => Math.cos((x * Math.PI) / 180);
const atan2 = (y, x) => (Math.atan2(y, x) * 180) / Math.PI;
const sqrt = Math.sqrt;
const exp = Math.exp;
const abs = Math.abs;
function distance(color1, color2) {
  const labColor1 = d3.lab(color1);
  const labColor2 = d3.lab(color2);

  const L_1 = labColor1.l;
  const a_1 = labColor1.a;
  const b_1 = labColor1.b;
  const L_2 = labColor2.l;
  const a_2 = labColor2.a;
  const b_2 = labColor2.b;

  const k_L = 1;
  const k_H = 1;
  const k_C = 1;

  const C_1 = Math.sqrt(a_1 ** 2 + b_1 ** 2);
  const C_2 = Math.sqrt(a_2 ** 2 + b_2 ** 2);
  const ΔLp = L_2 - L_1;

  const L_ = (L_1 + L_2) / 2;
  const C_ = (C_1 + C_2) / 2;
  const ap_1 = a_1 + (a_1 / 2) * (1 - sqrt(C_ ** 7 / (C_ ** 7 + 25 ** 7)));
  const ap_2 = a_2 + (a_2 / 2) * (1 - sqrt(C_ ** 7 / (C_ ** 7 + 25 ** 7)));

  const Cp_1 = sqrt(ap_1 ** 2 + b_1 ** 2);
  const Cp_2 = sqrt(ap_2 ** 2 + b_2 ** 2);
  const Cp_ = (Cp_1 + Cp_2) / 2;
  const ΔCp = Cp_2 - Cp_1;

  const hp_1 = (atan2(b_1, ap_1) + 360) % 360;
  const hp_2 = (atan2(b_2, ap_2) + 360) % 360;
  const Δhp =
    abs(hp_1 - hp_2) <= 180
      ? hp_2 - hp_1
      : hp_2 <= hp_1
      ? hp_2 - hp_1 + 360
      : hp_2 - hp_1 - 360;

  const ΔHp = 2 * sqrt(Cp_1 * Cp_2) * sin(Δhp / 2);
  const Hp_ =
    abs(hp_1 - hp_2) <= 180
      ? (hp_1 + hp_2) / 2
      : hp_1 + hp_2 < 360
      ? (hp_1 + hp_2 + 360) / 2
      : (hp_1 + hp_2 - 360) / 2;
  const T =
    1 -
    0.17 * cos(Hp_ - 30) +
    0.24 * cos(2 * Hp_) +
    0.32 * cos(3 * Hp_ + 6) -
    0.2 * cos(4 * Hp_ - 63);
  const S_L = 1 + (0.015 * (L_ - 50) ** 2) / sqrt(20 + (L_ - 50) ** 2);
  const S_C = 1 + 0.045 * Cp_;
  const S_H = 1 + 0.015 * Cp_ * T;
  const R_T =
    -2 *
    sqrt(Cp_ ** 7 / (Cp_ ** 7 + 25 ** 7)) *
    sin(60 * exp(-(((Hp_ - 275) / 25) ** 2)));

  return sqrt(
    (ΔLp / (k_L * S_L)) ** 2 +
      (ΔCp / (k_C * S_C)) ** 2 +
      (ΔHp / (k_H * S_H)) ** 2 +
      R_T * (ΔCp / (k_C * S_C)) * (ΔHp / (k_H * S_H))
  );
}

module.exports = { mainColors };
