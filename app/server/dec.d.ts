declare namespace Express {
    export interface Request {
        userId?: string
    }
}

declare module 'function-threads' {
    export function run<T>(fn: () => T): Promise<T>;
}

declare module 'mammoth' {
    
}