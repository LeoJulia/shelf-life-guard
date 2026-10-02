const clamp255 = (value: number): number =>
  Math.max(0, Math.min(255, Math.round(value)));

const toHexPair = (value: number): string =>
  clamp255(value).toString(16).padStart(2, "0");

const parseHex = (hex: string): [number, number, number] | null => {
  const clean = hex.replace("#", "").trim();
  const full =
    clean.length === 3
      ? clean
          .split("")
          .map((char) => char + char)
          .join("")
      : clean;

  if (!/^[0-9a-fA-F]{6}$/.test(full)) {
    return null;
  }

  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ];
};

export const darkenHex = (hex: string, factor = 0.35): string => {
  const rgb = parseHex(hex);

  if (!rgb) {
    return "#1f1f1f";
  }

  const [r, g, b] = rgb;

  return `#${toHexPair(r * factor)}${toHexPair(g * factor)}${toHexPair(b * factor)}`;
};
