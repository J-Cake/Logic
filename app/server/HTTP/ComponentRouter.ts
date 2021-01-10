import * as path from 'path';
import * as fs from 'fs';

import {Router} from 'express';

import sql from "../sql";
import {rootFn} from "../utils";

const router = Router();

export interface DBComponent {
    componentId: number,
    ownerId: number,
    componentName: string,
    location: string,
    componentToken: string
}

router.use(async function (req, res, next) {
    req.userId = req.cookies.userId ?? req.header("userId");

    next();
})

router.get("/:componentToken", async function (req, res) {
    const component = await sql.sql_get<DBComponent>(`SELECT *
                                                      from components
                                                      WHERE componentToken == ?
                                                        and (public == true or ownerId == (SELECT userId from users where userToken == ?))`, [req.params.componentToken, req.userId || ""]);

    if (!component) {
        res.status(404);
        res.end("component was not found or you do not have access to it");
    } else {
        const file = path.join(rootFn(process.cwd()), "Data", "components", component.location);

        res.header("Content-type", "application/json");
        fs.createReadStream(file).pipe(res);
    }
});

router.get("/std/:name", function (req, res) {
    const file = path.join(rootFn(process.cwd()), "Data", "components", "std", req.params.name.toLowerCase() + ".json");

    if (fs.existsSync(file)) {
        res.header("Content-type", "application/json");
        res.end(fs.readFileSync(file, 'utf8').toString());
        // fs.createReadStream(file).pipe(res);
    } else {
        res.status(404);
        res.end("component was not found");
    }
});

// router.post("/:name", async function (req, res) {
//
// });

export default router;