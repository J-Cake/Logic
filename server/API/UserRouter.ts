import express from 'express';
import _ from "lodash";

import * as actions from "../App/Auth/UserActions";
import {attempt} from "../../app/util";
import {defaultPreferences} from "../../app/src/Enums";
import authenticate from "./lib/authenticate";
import sql from "../util/sql";

const router: express.Router = express.Router();

router.get('/search-users', async function (req, res) {
    const recordsPerPage = 25;
    const {count} = await sql.sql_get<{ count: number }>(`SELECT COUNT(*) as count
                                                          from users`);
    const page = Math.min(Math.max(Number(req.query.page || '0') ?? 0, 0), Math.ceil(count / recordsPerPage));

    res.json({
        users: await sql.sql_all(`SELECT email, identifier, "userId"
                                  from users
                                  where identifier like $1
                                     or email like $1
                                  LIMIT $2 OFFSET $3`, [`%${req.query.q ?? ''}%`, recordsPerPage, page * recordsPerPage]),
        page: page + 1,
        records: count,
        recordsPerPage: recordsPerPage,
        pages: Math.ceil(count / recordsPerPage)
    });
});

router.use(authenticate());

router.get('/preferences', async function (req, res) {
    if (actions.isLoggedIn(req)) {
        const usr = await actions.verifyUser(req.userToken);

        if (!usr) {
            res.status(401);
            res.end('Unverified request');
        } else if (await attempt(async function () {
            res.json(await actions.getPreferencesForUser(req.userToken as string));
        })) res.end('Insufficient permissions');
    } else {
        res.status(401);
        res.json(defaultPreferences);
    }
});

router.post('/preferences', async function (req, res) {
    const usr = await actions.verifyUser(req.userToken as string);

    if (!usr) {
        res.status(401);
        res.end('Unverified request');
    } else if (await attempt(async function () {
        await actions.writePreferences(_.merge(await actions.getPreferencesForUser(req.userToken as string), actions.convertFromHTMLForm(req.body)), req.userToken as string);
        res.end('Success');
    })) res.end('Insufficient permissions');
});

export default router;