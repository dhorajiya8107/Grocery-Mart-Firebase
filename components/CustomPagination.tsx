"use client";

import { cn } from "@/lib/utils";
import { ReactNode } from "react";
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationNext, PaginationPrevious, } from "./ui/pagination";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "./ui/select";

export interface CustomPaginationProps {
  totalCount: number;
  pageSize: number;
  page: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
}

export function CustomPagination({
  totalCount,
  pageSize,
  page,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions,
}: CustomPaginationProps) {
  const totalPageCount = Math.ceil(totalCount / pageSize);

  const renderPageNumbers = () => {
    const items: ReactNode[] = [];
    const maxVisiblePages = 5;

    if (totalPageCount <= maxVisiblePages) {
      for (let i = 1; i <= totalPageCount; i++) {
        items.push(
          <PaginationItem key={i}>
            <button
              onClick={() => onPageChange(i)}
              className={cn(
                "px-3 py-1 rounded",
                page === i ? "text-green-700 font-bold" : "text-gray-500"
              )}
            >
              {i}
            </button>
          </PaginationItem>
        );
      }
    } else {
      items.push(
        <PaginationItem key={1}>
          <button
            onClick={() => onPageChange(1)}
            className={cn(
              "px-3 py-1 rounded",
              page === 1 ? "text-green-700 font-bold" : "text-gray-500"
            )}
          >
            1
          </button>
        </PaginationItem>
      );

      if (page > 3) {
        items.push(
          <PaginationItem key="ellipsis-start">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }

      const start = Math.max(2, page - 1);
      const end = Math.min(totalPageCount - 1, page + 1);

      for (let i = start; i <= end; i++) {
        items.push(
          <PaginationItem key={i}>
            <button
              onClick={() => onPageChange(i)}
              className={cn(
                "px-3 py-1 rounded",
                page === i ? "text-green-700 font-bold" : "text-gray-500"
              )}
            >
              {i}
            </button>
          </PaginationItem>
        );
      }

      if (page < totalPageCount - 2) {
        items.push(
          <PaginationItem key="ellipsis-end">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }

      items.push(
        <PaginationItem key={totalPageCount}>
          <button
            onClick={() => onPageChange(totalPageCount)}
            className={cn(
              "px-3 py-1 rounded",
              page === totalPageCount
                ? "text-green-700 font-bold"
                : "text-gray-500"
            )}
          >
            {totalPageCount}
          </button>
        </PaginationItem>
      );
    }

    return items;
  };

  return (
    <div className="flex flex-col md:flex-row items-center justify-between gap-4 w-full mt-4">
      {pageSizeOptions && onPageSizeChange && (
        <div className="flex items-center md:justify-start w-full gap-4">
          <span className="whitespace-nowrap text-sm ml-2">Show :</span>
          <Select
            value={String(pageSize)}
            onValueChange={(value) => onPageSizeChange(Number(value))}
          >
            <SelectTrigger>
              <SelectValue>{String(pageSize)}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {pageSizeOptions.map((option) => (
                <SelectItem key={option} value={String(option)}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      <Pagination className={cn({ "md:justify-end": !!pageSizeOptions })}>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={() => onPageChange(Math.max(page - 1, 1))}
              className={page === 1 ? "pointer-events-none opacity-50" : ""}
            />
          </PaginationItem>
          {renderPageNumbers()}
          <PaginationItem>
            <PaginationNext
              onClick={() => onPageChange(Math.min(page + 1, totalPageCount))}
              className={page === totalPageCount ? "pointer-events-none opacity-50 mr-2" : "mr-2"}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}
