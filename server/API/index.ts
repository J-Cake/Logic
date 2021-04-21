import express from 'express';

import ComponentRouter from './ComponentRouter';
import DocumentRouter from './DocumentRouter';
import UserRouter from "./UserRouter";

export default async function (): Promise<express.Application> {
    const app: express.Application = express();

    app.use('/component', ComponentRouter);
    app.use('/document', DocumentRouter);
    app.use('/user', UserRouter);

    return app;
}