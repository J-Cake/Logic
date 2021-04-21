declare namespace Express {
    export interface Request {
        userToken?: string
    }
}

declare module 'function-threads' {
    export function run<T>(fn: () => T): Promise<T>;
}

declare module 'mammoth' {
    
}