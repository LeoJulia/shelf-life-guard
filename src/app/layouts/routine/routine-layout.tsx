import { Suspense } from "react";
import { ErrorBoundary } from "next/dist/client/components/error-boundary";
import { NotFoundRoutine } from "@/pages/routine";

export const RoutineLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => (
  <Suspense fallback='loading...'>
    <ErrorBoundary errorComponent={NotFoundRoutine}>{children}</ErrorBoundary>
  </Suspense>
);
