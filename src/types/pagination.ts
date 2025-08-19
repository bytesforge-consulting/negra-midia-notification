export interface PaginationRequest {
  page?: number;
  limit?: number;
  search?: string;
}

export interface PaginatedResponse {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}
