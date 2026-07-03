import { Field, FieldLabel } from "@/shared/ui/field";
import { Progress } from "@/shared/ui/progress";

export const ExpiryBar = ({ product }: { product: any }) => {
  let remaining = 1;
  let total = 90 * 8.64e7;

  if (product?.expiry_date) {
    remaining = new Date(product?.expiry_date).getTime() - new Date().getTime();
  }

  if (product?.expiry_date && product?.created_at) {
    total =
      new Date(product?.expiry_date).getTime() -
      new Date(product?.opened_at ?? product?.created_at).getTime();
  }

  const progress = product?.expiry_date
    ? Math.round(
        Math.max(0, Math.min(100, Math.round((remaining / total) * 100))),
      )
    : 0;

  if (!(product?.expiry_date && !product.finished_at)) {
    return null;
  }

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
