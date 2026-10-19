"use client";

import {
  createContext,
  useContext,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Edit, Pencil, Save } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Rating } from "@/entities/product/ui/rating";
import { RatingStars } from "./rating-stars";
import { updateProductRating } from "../api/update-product-rating";

interface RatingEditContextValue {
  isEditing: boolean;
  value: number | null;
  isPending: boolean;
  error: string | null;
  setValue: (value: number | null) => void;
  startEditing: () => void;
  cancel: () => void;
  save: () => void;
}

const RatingEditContext = createContext<RatingEditContextValue | null>(null);

const useRatingEdit = () => {
  const context = useContext(RatingEditContext);

  if (!context) {
    throw new Error("useRatingEdit must be used within RatingEditProvider");
  }

  return context;
};

export const RatingEditProvider = ({
  product,
  children,
}: {
  product: { id: string; rating: number | null };
  children: ReactNode;
}) => {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState<number | null>(product.rating ?? null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const startEditing = () => {
    setValue(product.rating ?? null);
    setError(null);
    setIsEditing(true);
  };

  const cancel = () => {
    setError(null);
    setIsEditing(false);
  };

  const save = () => {
    setError(null);
    startTransition(async () => {
      try {
        await updateProductRating(product.id, value);
        setIsEditing(false);
        router.refresh();
      } catch (e) {
        setError(
          e instanceof Error ? e.message : "Не удалось сохранить рейтинг",
        );
      }
    });
  };

  return (
    <RatingEditContext.Provider
      value={{
        isEditing,
        value,
        isPending,
        error,
        setValue,
        startEditing,
        cancel,
        save,
      }}
    >
      {children}
    </RatingEditContext.Provider>
  );
};

export const RatingField = ({ rating }: { rating?: number | null }) => {
  const { isEditing, value, setValue, startEditing, isPending } =
    useRatingEdit();

  if (isEditing) {
    return (
      <div className='mt-1.5 mb-2 flex items-center'>
        <RatingStars value={value} onChange={setValue} />
      </div>
    );
  }

  return (
    <div className='mt-1.5 mb-2 flex items-center gap-1'>
      <Rating rating={rating} className='mt-0 mb-0' />
      <Button
        type='button'
        variant='ghost'
        size='icon'
        className='size-7 text-muted-foreground'
        aria-label='Редактировать рейтинг'
        onClick={startEditing}
        disabled={isPending}
      >
        <Pencil className='size-4' />
      </Button>
    </div>
  );
};

export const RatingFooterButton = ({ editHref }: { editHref: string }) => {
  const { isEditing, isPending, error, save, cancel } = useRatingEdit();

  if (isEditing) {
    return (
      <div className='flex items-center gap-3'>
        <Button type='button' onClick={save} disabled={isPending}>
          <Save />
          {isPending ? "Сохранение..." : "Сохранить"}
        </Button>
        <Button
          type='button'
          variant='secondary'
          onClick={cancel}
          disabled={isPending}
        >
          Отмена
        </Button>
        {error && <span className='text-xs text-destructive'>{error}</span>}
      </div>
    );
  }

  return (
    <Link href={editHref}>
      <Button>
        <Edit />
        Редактировать
      </Button>
    </Link>
  );
};
