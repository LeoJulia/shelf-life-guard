import Image from "next/image";
import {
  routinePhotoSlotOrder,
  routinePhotoSlots,
  type TRoutinePhoto,
} from "@/entities/routine";

/**
 * «До» и «после» рядом по одинаковым ракурсам.
 *
 * Показываются только слоты, заполненные в обеих сериях: сравнивать разные
 * ракурсы бессмысленно — в этом и была идея фиксированных слотов.
 */
export const RoutinePhotoCompare = ({
  photos,
}: {
  photos: TRoutinePhoto[];
}) => {
  const withImage = photos.filter((photo) => photo.imageUrl);
  const start = new Map(
    withImage.filter((photo) => photo.series === "start").map((photo) => [photo.slot, photo]),
  );
  const end = new Map(
    withImage.filter((photo) => photo.series === "end").map((photo) => [photo.slot, photo]),
  );

  const slots = routinePhotoSlotOrder.filter(
    (slot) => start.has(slot) && end.has(slot),
  );

  if (slots.length === 0) {
    return null;
  }

  return (
    <section className='flex flex-col gap-2'>
      <h3 className='text-foreground text-sm font-semibold'>
        Сравнение «до» и «после»
      </h3>
      <div className='grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3'>
        {slots.map((slot) => {
          const before = start.get(slot);
          const after = end.get(slot);

          if (!before?.imageUrl || !after?.imageUrl) {
            return null;
          }

          return (
            <div key={slot} className='flex flex-col gap-1'>
              <span className='text-muted-foreground text-xs font-medium'>
                {routinePhotoSlots[slot]}
              </span>
              <div className='grid grid-cols-2 gap-1'>
                <Image
                  src={before.imageUrl}
                  alt={`${routinePhotoSlots[slot]} — начало`}
                  width={240}
                  height={240}
                  className='aspect-square size-full rounded-lg object-cover'
                />
                <Image
                  src={after.imageUrl}
                  alt={`${routinePhotoSlots[slot]} — конец`}
                  width={240}
                  height={240}
                  className='aspect-square size-full rounded-lg object-cover'
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
