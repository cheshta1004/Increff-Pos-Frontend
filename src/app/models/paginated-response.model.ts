export interface PaginatedResponse<T> {
  content: T[];
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
} 