import { Star } from "lucide-react";

export const Rating = ({ rating }: { rating?: number | null }) => {
  const stars = new Array(5).fill("");

  return (
    <div className='mt-1.5 mb-2 flex items-center gap-1'>
      {stars.map((i, index) => (
        <Star
          key={index}
          className={
            index >= (rating ?? 0)
              ? "fill-muted text-muted"
              : "fill-primary text-primary"
          }
        />
      ))}
    </div>
  );
};
