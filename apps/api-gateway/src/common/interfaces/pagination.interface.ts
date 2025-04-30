export interface PaginationMeta {
  totalRecords: number;
  currentPage: number;
  totalPages: number;
  nextPage: number | null;
  prevPage: number | null;
}

export interface Paginated<T> {
  data: T[];
  pagination: PaginationMeta;
}
