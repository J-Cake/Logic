import path from 'path';

import express from 'express';
import bodyParser from 'body-parser';

import getFile, {userTokenToId} from '../App/Document/getFile';
import {attempt, Pref, rootFn} from '../util/utils';
import sql from '../util/sql';
import Document, {CircuitObj} from '../App/Document/Document';

import * as FS from '../util/files';
import authenticate from "./lib/authenticate";
import respond, {Action, Status} from "./lib/Api";

const router: express.Router = express.Router();

router.use(bodyParser.json({}));

router.use(authenticate());

// TODO: Handle a bunch of edge-cases everywhere.

router.post("/make", async function (req, res) {
    res.json(await respond(Action.Document_Create, async function (props, error): Promise<string> {
        props.res = res;

        const userToken: string = req.userToken || "";

        const name = (req.query.name || "").toString() || Math.floor(Math.random() * 11e17).toString(36);

        const documentToken: string = await (async function () {
            let token = '';

            do
                token = Math.floor(Math.random() * 11e17).toString(36);
            while (await sql.sql_get<{ userToken: string }>(`SELECT "documentToken"
                                                             from documents
                                                             where "documentToken" = $1`, [token]));

            return token;
        })();

        const document: CircuitObj = {
            circuitName: name,
            ownerEmail: (await sql.sql_get<{ email: string }>(`SELECT email
                                                               from users
                                                               where "userToken" = $1`, [userToken])).email,
            components: (JSON.parse(await FS.readFile(path.join(await rootFn(), 'lib', 'pref.json'))) as Pref).startingComponents,
            content: {}
        };

        await sql.sql_query(`INSERT INTO documents ("ownerId", "documentTitle", "documentToken", source)
                             VALUES ((SELECT "userId" from users where "userToken" = $1), $2, $3, $4)`, [userToken, name, documentToken, JSON.stringify(document)]);

        return documentToken;
    }));
});

router.get('/:circuit', async function (req, res) {
    res.json(await respond(Action.Document_Read, function (props, error): Promise<CircuitObj> {
        return new Promise(async function (resolve) {
            props.res = res;

            const userToken: string = req.userToken ?? "";

            if (await attempt(async function () {
                const file = await getFile(userToken, req.params.circuit);
                resolve(await file.fetchInfo());
            }))
                error(Status.Document_Not_Exists, 'Access to the document was denied.');
        });
    }));
});

router.put('/:circuit', async function (req, res) { // File Save
    res.json(await respond(Action.Document_Write, async function (props, error): Promise<void> {
        props.res = res;

        const userToken: string = req.userToken || "";

        if (await attempt(async function () {
            const file: Document = await getFile(userToken, req.params.circuit);
            await file.info;

            if (['circuitName', 'content', 'components', 'ownerEmail'].map(i => i in req.body).includes(false))
                error(Status.Bad_Data, 'The file appears to be malformed.');
            else
                return void await file.writeContents(req.body as CircuitObj);

        }))
            error(Status.Insufficient_Access, 'Access to the document was denied.');
    }));
});

router.delete('/:circuit', async function (req, res) {
    res.json(await respond(Action.Document_Delete, async function (props, error): Promise<void> {
        props.res = res;
        const userToken: string = req.userToken || "";

        if (await attempt(async function () {
            const file = await getFile(userToken, req.params.circuit);
            await file.fetchInfo();

            if (await attempt(async () => file.delete(await userTokenToId(userToken))))
                error(Status.Undefined, 'Deleting failed for unknown reasons');
        }))
            error(Status.Insufficient_Access, 'You do not have access to this document.');
    }));
});

router.put('/:circuit/collaborator', async function (req, res) {
    res.json(await respond(Action.Document_Collaborator_Add, async function (props, error): Promise<boolean> {
        return new Promise<boolean>(async function (resolve) {
            props.res = res;

            const userToken: string = req.userToken || "";

            if (await attempt(async function () {
                const file = await getFile(userToken, req.params.circuit);
                await file.fetchInfo();

                if (req.query.user) {
                    const alreadyExists = file.collaborators.includes(await userTokenToId(userToken));
                    if (alreadyExists && 'can-edit' in req.query)
                        resolve(await file.changeAccess(await userTokenToId(userToken), Number(req.query.user), req.query['can-edit'] === 'true'));
                    else if (!alreadyExists)
                        resolve(await file.addCollaborator(await userTokenToId(userToken), Number(req.query.user), req.query['can-edit'] === 'true'));
                    else {
                        props.status = Status.User_Not_Exists;
                        resolve(false);
                    }
                } else
                    error(Status.No_Change, 'User not specified.');
            }, err => console.error(err)))
                error(Status.Insufficient_Access, 'You do not have access to this document.');
            return void 0 as unknown as boolean;
        });
    }));
});

router.delete('/:circuit/collaborator', async function (req, res) {
    res.json(await respond(Action.Document_Collaborator_Remove, async function (props, error): Promise<void> {
        props.res = res;
        const userToken: string = req.userToken || "";

        if (await attempt(async function () {
            const file = await getFile(userToken, req.params.circuit);
            await file.fetchInfo();

            if (req.query.user)
                await file.removeCollaborator(await userTokenToId(userToken), Number(req.query.user));
            else
                error(Status.User_Not_Member, 'User not specified.');
        }))
            error(Status.Insufficient_Access, 'You do not have access to this document.');
    }));
});

router.put('/:circuit/component', async function (req, res) {
    res.json(await respond(Action.Document_Component_Add, async function (props, error): Promise<void> {
        props.res = res;
        const userToken: string = req.userToken || "";

        if (await attempt(async function () {
            const file = await getFile(userToken, req.params.circuit);
            await file.fetchInfo();

            if (await attempt(async function () {
                if (req.query.component && typeof req.query.component === 'string')
                    if (await sql.sql_get(`SELECT exists(select "componentId"
                                                         from components
                                                         where "componentToken" = $1)`, [req.query.component])) {
                        if (!file.info.components.includes(req.query.component)) {
                            file.info.components.push(req.query.component);
                            await file.writeContents(file.info);
                            props.status = Status.Done;
                        } else
                            error(Status.Component_Exists, 'The component is already included');
                    }
            }))
                error(Status.No_Change, 'An unknown error occurred.');
        }))
            error(Status.Insufficient_Access, 'You do not have access to this document');
    }));
});

router.delete('/:circuit/component', async function (req, res) {
    res.json(await respond(Action.Document_Component_Remove, async function (props, error): Promise<void> {
        props.res = res;
        const userToken: string = req.userToken || "";

        if (await attempt(async function () {
            const file = await getFile(userToken, req.params.circuit);
            await file.fetchInfo();

            if (await attempt(async function () {
                if (req.query.component && typeof req.query.component === 'string')
                    if (await sql.sql_get(`SELECT exists(select "componentId"
                                                         from components
                                                         where "componentToken" = $1)`, [req.query.component])) {
                        if (file.info.components.includes(req.query.component)) {
                            file.info.components.splice(file.info.components.indexOf(req.query.component), 1);
                            await file.writeContents(file.info);
                            props.status = Status.Done;
                        } else
                            error(Status.Component_Not_Member, 'The component is does not exist');
                    }
            }))
                error(Status.No_Change, 'An unknown error occurred.');
        }))
            error(Status.Insufficient_Access, 'You do not have access to this document');
    }));
});

router.get('/:circuit/rename', async function (req, res) {
    res.json(await respond(Action.Document_Rename, async function (props, error): Promise<string> {
        return new Promise<string>(async function (resolve) {
            props.res = res;

            const userToken: string = req.userToken || "";

            if (await attempt(async function () {
                const file = await getFile(userToken, req.params.circuit);
                await file.fetchInfo();

                if ('name' in req.query) {
                    void await file.changeDocumentName(await userTokenToId(userToken), req.query['name'] as string)
                    resolve(req.query['name'] as string);
                } else
                    error(Status.Done, 'No name provided.');
            })) error(Status.Done, 'An unknown error occurred.');
        });
    }))
});

router.delete('/:circuit/leave', async function (req, res) {
    res.json(await respond(Action.Document_Collaborator_Leave, async function (props, error): Promise<void> {
        props.res = res;

        const userToken: string = req.userToken || "";

        if (await attempt(async function () {
            const file = await getFile(userToken, req.params.circuit);
            await file.fetchInfo();
            await file.removeCollaborator(await userTokenToId(userToken), await userTokenToId(userToken));
            return;
        }))
            error(Status.User_Not_Member, 'User is not listed as member');
    }));
});

export default router;
