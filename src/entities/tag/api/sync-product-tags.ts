const hslToHex = (h: number, s: number, l: number): string => {
  const sN = s / 100;
  const lN = l / 100;
  const c = (1 - Math.abs(2 * lN - 1)) * sN;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = lN - c / 2;

  const [r, g, b] =
    h < 60
      ? [c, x, 0]
      : h < 120
        ? [x, c, 0]
        : h < 180
          ? [0, c, x]
          : h < 240
            ? [0, x, c]
            : h < 300
              ? [x, 0, c]
              : [c, 0, x];

  const toHex = (v: number) =>
    Math.round((v + m) * 255)
      .toString(16)
      .padStart(2, "0");

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

export const generatePastelColor = (): string =>
  hslToHex(Math.floor(Math.random() * 360), 75, 85);

export const buildProductTags = (tagNames: string[]) => {
  const seen = new Set<string>();

  return tagNames
    .map((name) => name.trim())
    .filter((name) => {
      const key = name.toLowerCase();

      if (!key || seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    })
    .map((name) => ({ name, color: generatePastelColor() }));
};
