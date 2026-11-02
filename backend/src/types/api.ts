
export interface ApiResponse<T = unknown> {
    success: boolean;
    message: string;
    data?: T;
}

export interface ApiErrorResponse {
    success: false;
    message: string;
    error?: string;
    errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T> {
    items: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export interface PaginationQuery {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
}

export interface ApiSuccessResponse<T> {
    success: true;
    message: string;
    data: T;
}
