export const authToken: string = document.cookie.match(/auth-token=(.[^;$]+)/)?.[1] ?? "";

export * as user from './user';
export * as circuit from './circuit';
export * as component from './component';
export * as app from './app';