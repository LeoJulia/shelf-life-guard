import { getMonthlyPhotos } from "../api/get-monthly-photos";
import { PhotosGallery } from "./photos-gallery";

export const PhotosSection = async () => {
  const groups = await getMonthlyPhotos();

  return (
    <div className='flex flex-col gap-6'>
      <h1 className='text-2xl font-bold'>Фотографии</h1>
      {groups.length === 0 ? (
        <p className='text-muted-foreground text-sm'>
          Фотографий пока нет — добавьте фото в рутинах, и они появятся здесь.
        </p>
      ) : (
        <PhotosGallery groups={groups} />
      )}
    </div>
  );
};
