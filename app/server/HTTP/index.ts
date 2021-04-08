import * as path from 'path';

import * as express from 'express';
import * as morgan from 'morgan';
import * as sm from 'source-map-support';
import * as body from 'body-parser';
import * as cookies from 'cookie-parser';

import UserRouter from "./UserRouter";
import DocumentRouter from "./DocumentRouter";
import ComponentRouter from "./ComponentRouter";
import ApplicationRouter from './ApplicationRouter';
import ResourceRouter from './ResourceRouter';
import WebRouter from './WebRouter';

import {rootFn} from "../utils";
import {liveReload} from "./util";
import configureFiles from '../configureFile';

sm.install();

export const app = express();

export const port: number = (function(): number {
    const _p = process.argv.find(i => /^--port=\d+$/.test(i))?.match(/^--port=(\d+)$/);
    return Number(_p ? _p[1] : '2560');
})();
export const reloadPort = liveReload();

export default async function init(port: number) {
    app.use(morgan(process.argv.includes('--dev') ? 'dev' : 'combined'));

    app.set("view engine", "pug");
    app.set("views", path.join(await rootFn(), 'app', 'views'));

    app.use(cookies());
    app.use(body.urlencoded({extended: true}));
    app.use(body.json({}));

    await configureFiles();

    app.use("/app", express.static(path.join(await rootFn(), "./build/final")));

    app.use("/user", UserRouter);
    app.use("/component", ComponentRouter);

    app.use(WebRouter);
    app.use(DocumentRouter);
    app.use(ApplicationRouter);
    app.use("/res", ResourceRouter);

    app.use(function (req, res, next) {
        res.status(404).render('site/404');
    });

    app.listen(port, function () {
        console.log('listening on port', port);
    });
}

init(port);