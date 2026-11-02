
import type { Types } from "mongoose";

export type MongoId = Types.ObjectId | string;

export interface BaseDocument {
    _id: MongoId;
    createdAt: Date;
    updatedAt: Date;
}

export interface TenantScopedDocument extends BaseDocument {
    tenantId: Types.ObjectId;
}

export interface SoftDeletableDocument {
    isDeleted: boolean;
    deletedAt?: Date | null;
}

export interface DatabasePagination {
    page: number;
    limit: number;
    skip: number;
}

export interface DatabaseQueryOptions {
    sort?: Record<string, 1 | -1>;
    select?: string | string[];
    populate?: string | string[];
    lean?: boolean;
}

export interface DatabaseResult<T> {
    data: T;
    success: boolean;
}
