import { getTagsWithColors } from "@/entities/tag";
import { TagsCard } from "./tags-card";

export const TagsSection = async () => {
  const tags = await getTagsWithColors();

  return (
    <div className='flex flex-col gap-6'>
      <h1 className='text-2xl font-bold'>Теги</h1>
      <TagsCard tags={tags} />
    </div>
  );
};
