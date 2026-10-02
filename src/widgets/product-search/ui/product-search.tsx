"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";
import type { TFilterOptions } from "@/entities/filter";
import { Control } from "./control";
import { SearchLoading } from "./search-loading";

export const ProductSearch = ({
  filterOptions,
  children,
}: {
  filterOptions: TFilterOptions;
  children: React.ReactNode;
}) => {
  const searchParams = useSearchParams();
  const pathname = usePathname() ?? "";
  const { replace } = useRouter();

  const [isSearching, setIsSearching] = useState(false);
  const pendingParams = useRef<string | null>(null);
  const currentParams = searchParams?.toString() ?? "";

  useEffect(() => {
    if (isSearching && currentParams === pendingParams.current) {
      pendingParams.current = null;
      setIsSearching(false);
    }
  }, [currentParams, isSearching]);

  const navigate = useCallback(
    (params: URLSearchParams) => {
      const query = params.toString();

      if (query === currentParams) {
        return;
      }

      pendingParams.current = query;
      setIsSearching(true);

      replace(query ? `${pathname}?${query}` : pathname);
    },
    [currentParams, pathname, replace],
  );

  const handleSearch = useDebouncedCallback((search: string) => {
    const params = new URLSearchParams(searchParams?.toString());

    if (search) {
      params.set("query", search);
    } else {
      params.delete("query");
    }

    navigate(params);
  }, 300);

  return (
    <>
      <Control
        filterOptions={filterOptions}
        isPending={isSearching}
        onSearch={handleSearch}
        onNavigate={navigate}
      />
      <div className='relative'>
        {children}
        {isSearching ? (
          <div className='absolute -inset-x-6 -inset-y-2 z-10 bg-background'>
            <SearchLoading />
          </div>
        ) : null}
      </div>
    </>
  );
};
