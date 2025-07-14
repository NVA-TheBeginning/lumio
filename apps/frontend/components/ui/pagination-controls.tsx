import React from "react";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  handlePageChange: (page: number) => void;
  isFetching: boolean;
  isLoading: boolean;
}

const PaginationControls: React.FC<PaginationControlsProps> = ({
  currentPage,
  totalPages,
  handlePageChange,
  isFetching,
  isLoading,
}) => {
  const hasMore = currentPage < totalPages;

  return (
    totalPages > 1 && (
      <div className="flex flex-col items-center gap-2 mt-4">
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => handlePageChange(currentPage - 1)}
                className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                aria-disabled={currentPage === 1}
              />
            </PaginationItem>

            {(() => {
              const visiblePages = Math.min(5, totalPages);
              const pages: (number | null)[] = [];

              if (currentPage > 3 && totalPages > visiblePages) {
                pages.push(1, null);
              }

              let start = Math.max(1, currentPage - Math.floor((visiblePages - 1) / 2));
              const end = Math.min(totalPages, start + visiblePages - 1);

              if (end === totalPages) {
                start = Math.max(1, end - visiblePages + 1);
              }

              for (let i = start; i <= end; i++) {
                pages.push(i);
              }

              if (end < totalPages - 1) {
                pages.push(null, totalPages);
              } else if (end === totalPages - 1) {
                pages.push(totalPages);
              }

              return pages.map((pageNum) =>
                pageNum === null ? (
                  <PaginationItem key={`ellipsis-${Math.random()}`}>
                    <PaginationEllipsis />
                  </PaginationItem>
                ) : (
                  <PaginationItem key={pageNum}>
                    <PaginationLink
                      isActive={pageNum === currentPage}
                      onClick={() => handlePageChange(pageNum)}
                      className="cursor-pointer"
                    >
                      {pageNum}
                    </PaginationLink>
                  </PaginationItem>
                ),
              );
            })()}

            <PaginationItem>
              <PaginationNext
                onClick={() => handlePageChange(currentPage + 1)}
                className={!hasMore ? "pointer-events-none opacity-50" : "cursor-pointer"}
                aria-disabled={!hasMore}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>

        <div className="flex items-center gap-2">
          {isFetching && !isLoading && <span className="text-sm text-muted-foreground">(Chargement...)</span>}
        </div>
      </div>
    )
  );
};

export default PaginationControls;
