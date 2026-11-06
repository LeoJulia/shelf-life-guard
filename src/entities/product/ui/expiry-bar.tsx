import { Field, FieldLabel } from "@/shared/ui/field";
import { Progress } from "@/shared/ui/progress";
import { TProduct } from "../model";
import { getExpiryProgress } from "../lib/expiry";

export const ExpiryBar = ({ product }: { product: TProduct }) => {
  if (!(product?.expiry_date && !product.finished_at)) {
    return null;
  }

  const progress = getExpiryProgress(product);

  return (
    <Field className='mt-4'>
      <FieldLabel
        htmlFor='progress-expiry'
        className='flex items-center justify-between text-xs text-muted-foreground'
      >
        <span>Срок годности</span>
        <span className='font-medium text-foreground'>
          {new Date(product.expiry_date).toLocaleDateString("ru-RU", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}{" "}
          {progress}%
        </span>
      </FieldLabel>
      <Progress value={progress} id='progress-expiry' />
    </Field>
  );
};
