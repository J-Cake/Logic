import express from 'express';
import _ from "lodash";

import * as actions from "../App/Auth/UserActions";
import {attempt} from "../../app/util";
import authenticate from "./lib/authenticate";
import sql from "../util/sql";
import respond, {Action, Status} from "./lib/Api";
import {DBPreferenceMap} from "../App/Document/getFile";

const router: express.Router = express.Router();

export type userSearch = {
    users: {
        email: string,
        identifier: string,
        userId: number
    }[],
    page: number,
    records: number,
    recordsPerPage: number,
    pages: number
};

router.get('/search-users', async function (req, res) {
    res.json(await respond(Action.App_SearchUsers, async function (props): Promise<userSearch> {
        props.res = res;

        const recordsPerPage = 25;
        const {count} = await sql.sql_get<{ count: number }>(`SELECT COUNT(*) as count
                                                              from users`);
        const page = Math.min(Math.max(Number(req.query.page || '0') ?? 0, 0), Math.ceil(count / recordsPerPage));

        return {
            users: await sql.sql_all<{ email: string, identifier: string, userId: number }>(`SELECT email, identifier, "userId"
                                                                                             from users
                                                                                             where identifier like $1
                                                                                                or email like $1
                                                                                             LIMIT $2 OFFSET $3`, [`%${req.query.q ?? ''}%`, recordsPerPage, page * recordsPerPage]),
            page: page + 1,
            records: count,
            recordsPerPage: recordsPerPage,
            pages: Math.ceil(count / recordsPerPage)
        };
    }));
});

router.use(authenticate());

router.get('/preferences', async function (req, res) {
    res.json(await respond(Action.User_Get_Preferences, function (props, error): Promise<DBPreferenceMap> {
        return new Promise(async function (resolve) {
            props.res = res;

            if (await attempt(async () => resolve(await actions.getPreferencesForUser(req.userToken as string))))
                error(Status.No_Change, 'An unknown error occurred.');
        });
    }));
});

router.post('/preferences', async function (req, res) {
    res.json(await respond(Action.User_Change_Preferences, async function (props, error): Promise<void> {
        if (await attempt(async () => await actions.writePreferences(_.merge(await actions.getPreferencesForUser(req.userToken as string), actions.convertFromHTMLForm(req.body)), req.userToken as string)))
            error(Status.Not_Authenticated, 'You are not permitted to perform this action.');
    }));
});

export default router;