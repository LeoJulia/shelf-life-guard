import {
  routinePhotoSeries,
  routinePhotoSeriesOrder,
  routinePhotoSlotOrder,
  type TRoutinePhoto,
} from "@/entities/routine";
import { RoutinePhotoSlot } from "./routine-photo-slot";

/** Две серии по семь фиксированных ракурсов; пустые слоты — пунктирные места. */
export const RoutinePhotoGrid = ({
  routineId,
  photos,
}: {
  routineId: string;
  photos: TRoutinePhoto[];
}) => {
  const byKey = new Map(
    photos.map((photo) => [`${photo.series}:${photo.slot}`, photo]),
  );

  return (
    <div className='flex flex-col gap-4'>
      {routinePhotoSeriesOrder.map((series) => (
        <section key={series} className='flex flex-col gap-2'>
          <h3 className='text-foreground text-sm font-semibold'>
            {routinePhotoSeries[series]}
          </h3>
          <div className='grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7'>
            {routinePhotoSlotOrder.map((slot) => (
              <RoutinePhotoSlot
                key={slot}
                routineId={routineId}
                series={series}
                slot={slot}
                photo={byKey.get(`${series}:${slot}`)}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
};
