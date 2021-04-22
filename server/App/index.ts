import path from 'path';

import express from 'express';
import cookies from 'cookie-parser';
import body from 'body-parser';

import ApplicationRouter from "./ApplicationRouter";
import UserRouter from "./Auth/UserRouter";
import WebRouter from "./WebRouter";

import {dirs, rootFn} from '../util/utils';
import ScriptRouter from "./ScriptRouter";
import WikiRouter from "./WikiRouter";

export default async function(): Promise<express.Application> {
    const app: express.Application = express();

    app.set("view engine", "pug");
    app.set("views", path.join(await rootFn(), 'app', 'views'));

    app.use(cookies());
    app.use(body.urlencoded({extended: true}));
    app.use(body.json({}));

    app.use('/app', express.static(dirs.finalOutput));

    app.use('/', WebRouter);
    app.use('/user', UserRouter);
    app.use('/', ApplicationRouter);
    app.use('/wiki', WikiRouter);

    app.use('/component/src', ScriptRouter);

    return app;
}