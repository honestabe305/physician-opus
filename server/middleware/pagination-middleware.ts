import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

// Pagination configuration constants
export const PAGINATION_CONFIG = {
  DEFAULT_LIMIT: 25,
  MAX_LIMIT: 100,
  DEFAULT_OFFSET: 0,
  DEFAULT_PAGE: 1
};

// Pagination query schema for validation
export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(PAGINATION_CONFIG.DEFAULT_PAGE),
  limit: z.coerce.number().int().min(1).max(PAGINATION_CONFIG.MAX_LIMIT).default(PAGINATION_CONFIG.DEFAULT_LIMIT),
  offset: z.coerce.number().int().min(0).optional(),
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).default('desc'),
  search: z.string().optional(),
  filter: z.string().optional()
}).transform((data) => {
  // Calculate offset from page if not provided
  if (!data.offset) {
    data.offset = (data.page - 1) * data.limit;
  }
  return data;
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

// Pagination response wrapper
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    offset: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  meta?: {
    sort?: string;
    order?: 'asc' | 'desc';
    search?: string;
    filter?: string;
  };
}

// Helper function to create paginated response
export function createPaginatedResponse<T>(
  data: T[],
  total: number,
  query: PaginationQuery
): PaginatedResponse<T> {
  const totalPages = Math.ceil(total / query.limit);
  
  return {
    data,
    pagination: {
      page: query.page,
      limit: query.limit,
      offset: query.offset!,
      total,
      totalPages,
      hasNextPage: query.page < totalPages,
      hasPreviousPage: query.page > 1
    },
    meta: {
      sort: query.sort,
      order: query.order,
      search: query.search,
      filter: query.filter
    }
  };
}

// Middleware to parse and validate pagination parameters
export function paginationMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const validatedQuery = paginationQuerySchema.parse(req.query);
    
    // Attach validated pagination data to request
    (req as any).pagination = validatedQuery;
    
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Invalid pagination parameters',
        details: error.errors
      });
    }
    
    return res.status(400).json({
      error: 'Invalid pagination parameters'
    });
  }
}

// Helper function for cursor-based pagination (for large datasets)
export interface CursorPaginationQuery {
  cursor?: string;
  limit: number;
  order: 'asc' | 'desc';
}

export const cursorPaginationSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(PAGINATION_CONFIG.MAX_LIMIT).default(PAGINATION_CONFIG.DEFAULT_LIMIT),
  order: z.enum(['asc', 'desc']).default('desc')
});

export interface CursorPaginatedResponse<T> {
  data: T[];
  pagination: {
    limit: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    nextCursor?: string;
    previousCursor?: string;
  };
}

// Middleware for cursor-based pagination
export function cursorPaginationMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const validatedQuery = cursorPaginationSchema.parse(req.query);
    
    // Attach validated cursor pagination data to request
    (req as any).cursorPagination = validatedQuery;
    
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Invalid cursor pagination parameters',
        details: error.errors
      });
    }
    
    return res.status(400).json({
      error: 'Invalid cursor pagination parameters'
    });
  }
}

// Helper function to create cursor-based paginated response
export function createCursorPaginatedResponse<T extends { id: string; createdAt?: Date }>(
  data: T[],
  query: CursorPaginationQuery
): CursorPaginatedResponse<T> {
  const hasNextPage = data.length === query.limit;
  const hasPreviousPage = !!query.cursor;
  
  let nextCursor: string | undefined;
  let previousCursor: string | undefined;
  
  if (hasNextPage && data.length > 0) {
    // Use the last item's ID as the next cursor
    nextCursor = data[data.length - 1].id;
  }
  
  if (hasPreviousPage && data.length > 0) {
    // Use the first item's ID as the previous cursor
    previousCursor = data[0].id;
  }
  
  return {
    data,
    pagination: {
      limit: query.limit,
      hasNextPage,
      hasPreviousPage,
      nextCursor,
      previousCursor
    }
  };
}

// Advanced search and filter types
export interface SearchFilter {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'ilike' | 'in' | 'between';
  value: any;
}

export const searchFilterSchema = z.object({
  field: z.string(),
  operator: z.enum(['eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'like', 'ilike', 'in', 'between']),
  value: z.any()
});

// Advanced filtering middleware
export function advancedFilterMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const filters: SearchFilter[] = [];
    
    // Parse filters from query string
    if (req.query.filters && typeof req.query.filters === 'string') {
      const parsedFilters = JSON.parse(req.query.filters);
      if (Array.isArray(parsedFilters)) {
        for (const filter of parsedFilters) {
          filters.push(searchFilterSchema.parse(filter));
        }
      }
    }
    
    // Attach validated filters to request
    (req as any).filters = filters;
    
    next();
  } catch (error) {
    return res.status(400).json({
      error: 'Invalid filter parameters',
      details: error instanceof z.ZodError ? error.errors : 'Invalid JSON format'
    });
  }
}