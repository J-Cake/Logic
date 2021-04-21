export const authToken: string = document.cookie.split(';').find(i => /^auth-token=.+$/)?.split('=')[1] ?? '';

export * as user from './user';
export * as circuit from './circuit';
export * as component from './component';
export * as app from './app';