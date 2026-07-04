export const ProductRow = ({
  field,
  value,
}: {
  field: string;
  value?: string | number | null;
}) => (
  <div className='grid grid-cols-2 gap-2'>
    <span className='font-mono'>{field}:</span>
    <span>{value ?? "-"}</span>
  </div>
);
