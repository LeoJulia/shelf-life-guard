import { createServerClient } from "@/shared/server";

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

const generatePastelColor = (): string =>
  hslToHex(Math.floor(Math.random() * 360), 75, 85);

export const syncProductTags = async (
  productId: string,
  tagNames: string[],
): Promise<void> => {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Sync product tags error: user is not authenticated");
  }

  const { error: deleteError } = await supabase
    .from("product_tags")
    .delete()
    .eq("product_id", productId);

  if (deleteError) {
    throw new Error("Error deleting product tags", { cause: deleteError });
  }

  const names = tagNames
    .map((name) => name.trim())
    .filter((name) => name.length > 0);

  if (names.length === 0) {
    return;
  }

  const { data: existingTags, error: existingError } = await supabase
    .from("tags")
    .select("id, name")
    .eq("user_id", user.id);

  if (existingError) {
    throw new Error("Error fetching tags", { cause: existingError });
  }

  const tagIdByName = new Map<string, string>();
  existingTags.forEach(({ id, name }) => tagIdByName.set(name.toLowerCase(), id));

  const namesToCreate: string[] = [];
  const seen = new Set<string>();

  names.forEach((name) => {
    const key = name.toLowerCase();

    if (tagIdByName.has(key) || seen.has(key)) {
      return;
    }

    seen.add(key);
    namesToCreate.push(name);
  });

  if (namesToCreate.length > 0) {
    const { data: createdTags, error: createError } = await supabase
      .from("tags")
      .insert(
        namesToCreate.map((name) => ({
          name,
          user_id: user.id,
          color: generatePastelColor(),
        })),
      )
      .select("id, name");

    if (createError) {
      throw new Error("Error creating tags", { cause: createError });
    }

    createdTags.forEach(({ id, name }) =>
      tagIdByName.set(name.toLowerCase(), id),
    );
  }

  const tagIds = Array.from(
    new Set(
      names
        .map((name) => tagIdByName.get(name.toLowerCase()))
        .filter((id): id is string => id !== undefined),
    ),
  );

  const { error: linkError } = await supabase
    .from("product_tags")
    .insert(tagIds.map((tagId) => ({ product_id: productId, tag_id: tagId })));

  if (linkError) {
    throw new Error("Error linking product tags", { cause: linkError });
  }
};
