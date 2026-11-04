import { Tables, TProductTag } from "@/shared/model";

export type TTag = Tables<"tags">;

export type TTagSummary = Pick<TTag, "id" | "name" | "color">;

export type { TProductTag };
