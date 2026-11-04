import type { TMonthGroup } from "../api/get-monthly-photos";
import { RoutinePhotoCard } from "./routine-photo-card";

export const PhotosGallery = ({ groups }: { groups: TMonthGroup[] }) => (
  <div className='flex flex-col gap-8'>
    {groups.map((group) => (
      <section key={group.monthKey} className='flex flex-col gap-3'>
        <h2 className='text-xl font-semibold'>{group.label}</h2>
        <div className='grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4'>
          {group.routines.map((routine) => (
            <RoutinePhotoCard key={routine.routineId} routine={routine} />
          ))}
        </div>
      </section>
    ))}
  </div>
);
