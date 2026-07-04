import { NotFoundProduct } from "@/pages/product";
import { ErrorBoundary } from "next/dist/client/components/error-boundary";
import { Suspense } from "react";

export const ProductLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => (
  <Suspense fallback='loading...'>
    <ErrorBoundary errorComponent={NotFoundProduct}>{children}</ErrorBoundary>
  </Suspense>
);
