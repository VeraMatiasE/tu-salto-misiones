export interface PaginationParams {
  page?: number
  limit?: number
  search?: string
  orderBy?: string
  orderDirection?: 'asc' | 'desc'
}

export interface PaginationMeta {
  currentPage: number
  totalPages: number
  total: number
  limit: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

export interface PaginatedResponse<T> {
  data: T
  pagination: PaginationMeta
}