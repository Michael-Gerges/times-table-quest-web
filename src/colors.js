/** Convert HSV (0-1) to hex color string. */
export function hsvToHex(h, s, v) {
  const f = (n, k = (n + h * 6) % 6) => v - v * s * Math.max(Math.min(k, 4 - k, 1), 0);
  const r = Math.round(f(5) * 255);
  const g = Math.round(f(3) * 255);
  const b = Math.round(f(1) * 255);
  return `#${r.toString(16).padStart(2, "0")}${g
    .toString(16)
    .padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

export const QUESTION_PALETTE = [
  "#ff66cc", "#ffd166", "#7dd3fc", "#a78bfa", "#22c55e", "#ffa726",
  "#60a5fa", "#ef5350", "#cddc39", "#26a69a", "#e91e63", "#ffc107",
];

/**
 * Stable mapping so each (a,b) question has a fixed text color.
 */
export function stableQuestionColor(a, b) {
  const idx = (a * 31 + b * 7) % QUESTION_PALETTE.length;
  return QUESTION_PALETTE[idx];
}
