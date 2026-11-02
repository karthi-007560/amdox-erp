
export type UserRole = "admin" | "manager" | "employee";

export interface RegisterInput {
    name: string;
    email: string;
    password: string;
}

export interface LoginInput {
    email: string;
    password: string;
}

export interface AuthenticatedUser {
    userId: string;
    role: UserRole;
}

export interface JwtPayload {
    sub: string;
    role: UserRole;
}

export interface AuthUserResponse {
    id: string;
    name: string;
    email: string;
    role: UserRole;
}

export interface LoginResponse {
    token: string;
    user: AuthUserResponse;
}
