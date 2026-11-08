import { Suspense } from "react";
import { Pagination } from "@/shared/ui/pagination";
import { getMonthlyPhotos } from "../api/get-monthly-photos";
import { PHOTOS_PAGE_SIZE } from "../config";
import { PhotosGallery } from "./photos-gallery";

export const PhotosSection = async ({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) => {
  const { groups, total, page, pageSize, pageCount } = await getMonthlyPhotos(
    await searchParams,
    { pageSize: PHOTOS_PAGE_SIZE },
  );

  return (
    <div className='flex flex-col gap-6'>
      <h1 className='text-2xl font-bold'>Фотографии</h1>
      {groups.length === 0 ? (
        <p className='text-muted-foreground text-sm'>
          Фотографий пока нет — добавьте фото в рутинах, и они появятся здесь.
        </p>
      ) : (
        <>
          <PhotosGallery groups={groups} />
          <Suspense fallback={null}>
            <Pagination
              page={page}
              pageCount={pageCount}
              total={total}
              pageSize={pageSize}
            />
          </Suspense>
        </>
      )}
    </div>
  );
};
