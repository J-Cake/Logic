import path from 'path';

import express from 'express';

import sql from '../util/sql';
import {rootFn} from '../util/utils';
import ScriptRouter from '../App/ScriptRouter';
import * as FS from '../util/files';
import searchComponents from '../App/Document/searchComponents';
import authenticate from "./lib/authenticate";

const router: express.Router = express.Router();

export interface DBComponent {
    componentId: number,
    ownerId: number,
    componentName: string,
    location: string,
    componentToken: string,
    source: string
}

router.get('/find', async function (req, res) {
    if (req.query['q'])
        res.json(await searchComponents(req.query['q'] as string));
    else
        res.json([]);
});

router.use(authenticate());

router.get("/:componentToken", async function (req, res) {
    if (req.params.componentToken.startsWith("$")) {
        const file = path.join(await rootFn(), "lib", "components", req.params.componentToken.toLowerCase().slice(1) + ".json");
        if (await FS.exists(file)) {
            res.header("Content-type", "application/json");
            res.end(await FS.readFile(file));
        } else {
            res.status(404);
            res.end("component was not found");
        }
    } else {
        const component = await sql.sql_get<DBComponent>(`SELECT *
                                                          from components
                                                          WHERE "componentToken" = $1
                                                            and (public is TRUE or "ownerId" = (SELECT "userId" from users where "userToken" = $2))`, [req.params.componentToken, req.userToken || ""]);

        if (!component) {
            res.status(404);
            res.end("component was not found or you do not have access to it");
        } else {
            res.end(component.source);
        }
    }
});

export default router;