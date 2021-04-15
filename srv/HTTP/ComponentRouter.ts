import * as path from 'path';

import * as express from 'express';

import sql from "../sql";
import {rootFn} from "../utils";
import ScriptRouter from "./ScriptRouter";
import * as FS from "../FS";
import searchComponents from "../App/searchComponents";

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

router.use(async function (req, res, next) {
    req.userId = req.cookies.userId ?? req.header("userId");

    next();
})

router.use(ScriptRouter);

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
                                                          WHERE componentToken == ?
                                                            and (public == true or ownerId == (SELECT userId from users where userToken == ?))`, [req.params.componentToken, req.userId || ""]);

        if (!component) {
            res.status(404);
            res.end("component was not found or you do not have access to it");
        } else {
            res.end(component.source);
        }
    }
});

export default router;