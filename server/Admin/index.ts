import express from 'express';

export default async function (): Promise<express.Application> {
    const app: express.Application = express();


    return app;
}