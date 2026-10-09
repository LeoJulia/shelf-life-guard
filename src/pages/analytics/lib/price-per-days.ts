export const pricePerDays = (
  price: number | null,
  days: number | undefined,
  periodDays: number,
) => {
  if (price === null || days === undefined) {
    return undefined;
  }

  return (price / days) * periodDays;
};
