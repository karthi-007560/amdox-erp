
import type { AuthenticatedUser } from "./auth.js";

declare global {
    namespace Express {
        interface Request {
            auth?: AuthenticatedUser;
            tenantId?: string;
        }
    }
}

export {};
