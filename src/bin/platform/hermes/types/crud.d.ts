// types/crud.types.ts
export interface PaginationParams {
  page: number
  size: number
  sort?: string
  direction?: 'asc' | 'desc'
}

export interface PageResponse<T> {
  content: T[]
  page: {
    number: number
    size: number
    totalPages: number
    totalElements: number
  }
  _embedded?: Record<string, T[]>
}

export interface SearchParams {
  [key: string]: string | number | boolean | undefined
}

export interface CrudOptions {
  showSuccess?: boolean
  showErrors?: boolean
  baseURL?: string
}

export interface ApiResponse<T> {
  data: T
  message?: string
  success: boolean
}
