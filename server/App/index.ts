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
import ResourceRouter from "./ResourceRouter";
import {verifyUser} from "./Auth/UserActions";
import sql from "../util/sql";
import {Theme} from "../../app/document-editor/Enums";

export default async function (): Promise<express.Application> {
    const app: express.Application = express();

    app.set("view engine", "pug");
    app.set("views", path.join(await rootFn(), 'server', 'App', 'views'));

    app.use(cookies());
    app.use(body.urlencoded({extended: true}));
    app.use(body.json({}));

    app.get('/app/css/colours.css', async function (req, res) {
        const themeFiles: Record<Theme, string> = {
            [Theme.System]: 'system.css',
            [Theme.Dark]: 'dark.css',
            [Theme.Light]: 'light.css',
            [Theme.DarkRed]: 'dark-red.css',
            [Theme.DarkOrange]: 'dark-orange.css',
            [Theme.DarkBlue]: 'dark-blue.css'
        };

        const userToken = req.userToken = req?.cookies?.['auth-token'] ?? req.header('auth-token') ?? (typeof req.query['auth-token'] === 'string' ? req.query['auth-token'] as string : '');

        res.contentType('text/css');
        res.status(200);

        if (userToken && await verifyUser(userToken)) {
            const {theme} = await sql.sql_get<{ theme: Theme }>(`SELECT theme
                                                                  from user_preferences
                                                                  where "userId" = (SELECT "userId" from users where "userToken" = $1)`, [userToken]);

            res.sendFile(path.join(dirs.finalOutput, 'css', 'themes', themeFiles[theme ?? 0]));
        } else
            res.sendFile(path.join(dirs.finalOutput, 'css', 'themes', themeFiles[Theme.System]));
    });

    app.use('/app', express.static(dirs.finalOutput));

    app.use('/wiki', WikiRouter);
    app.use('/', WebRouter);
    app.use('/res', ResourceRouter);
    app.use('/user', UserRouter);
    app.use('/', ApplicationRouter);

    app.use('/component/src', ScriptRouter);

    return app;
}