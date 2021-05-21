import path from 'path';

import express from 'express';

import sql from '../util/sql';
import {rootFn} from '../util/utils';
import * as FS from '../util/files';
import searchComponents, {paginatedSearchQuery} from '../App/Document/searchComponents';
import authenticate from "./lib/authenticate";
import respond, {Action, Status} from "./lib/Api";
import {ApiComponent} from "../../app/src/Logic/io/ComponentFetcher";

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
    res.json(await respond<paginatedSearchQuery, Action.Component_Find>(Action.Component_Find, async function (props, error): Promise<paginatedSearchQuery> {
        props.res = res;

        if (req.query['q'])
            return await searchComponents(req.query['q'] as string);
        else return {
            foundComponents: {}, page: 0, resultsPerPage: 0
        };
    }));
});

router.use(authenticate());

router.get("/:componentToken", async function (req, res) {
    res.json(await respond(Action.Component_Get, async function (props, error): Promise<ApiComponent> {
        props.res = res;

        if (req.params.componentToken.startsWith("$")) {
            const file = path.join(await rootFn(), "lib", "components", req.params.componentToken.toLowerCase().slice(1) + ".json");
            if (await FS.exists(file))
                return JSON.parse(await FS.readFile(file));
            else
                error(Status.Component_Not_Exists, 'Component was not found.');
        } else {
            const component = await sql.sql_get<DBComponent>(`SELECT *
                                                              from components
                                                              WHERE "componentToken" = $1
                                                                and (public is TRUE or
                                                                     "ownerId" = (SELECT "userId" from users where "userToken" = $2))`, [req.params.componentToken, req.userToken || ""]);

            if (!component)
                error(Status.Component_Not_Exists, 'The component does not exist');
            else
                return JSON.parse(component.source);
        }

        return {} as ApiComponent; // Keeps the compiler happy.
    }))
});

export default router;