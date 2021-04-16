import * as path from "path";

import * as express from 'express';
import * as bodyParser from 'body-parser';

import getFile, {userTokenToId} from "../getFile";
import {verifyUser} from "../User";
import {attempt, attemptSync, Pref, rootFn} from "../utils";
import sql from "../sql";
import Circuit, {CircuitObj} from "../App/Circuit";

import * as FS from "../FS";

const router: express.Router = express.Router();

router.use(bodyParser.json({}));

router.use('/', async function (req, res, next) {
    const userId = req.cookies.userId ?? req.header("userId");
    req.userId = userId;

    if (!userId || !await verifyUser(userId))
        res.redirect('/user/login');
    else next();
})

router.post("/make", async function (req, res) {
    const userToken: string = req.userId || "";

    const name = (req.query.name || "").toString() || Math.floor(Math.random() * 11e17).toString(36);

    const documentToken: string = await (async function() {
        let token = '';

        do
            token = Math.floor(Math.random() * 11e17).toString(36);
        while (await sql.sql_get<{userToken: string}>(`SELECT "documentToken" from documents where "documentToken" = $1`, [token]));

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

    res.status(200);
    res.end(documentToken);
});

router.get('/circuit/:circuit', async function (req, res) {
    const userId: string = req.userId || "";
    const usr = await verifyUser(userId);

    if (!usr) {
        res.status(401);
        res.end('Unverified request');
    } else if (await attempt(async function () {
        const file = await getFile(userId, req.params.circuit);
        await file.fetchInfo();
        res.json(file.info);
    })) {
        res.status(403);
        res.end('Access to the requested document was denied');
    }
});

router.put('/circuit/:circuit', async function (req, res) { // File Save
    const userId: string = req.userId || "";
    const usr = await verifyUser(userId);

    if (!usr) {
        res.status(401);
        res.end('Unverified request');
    } else if (await attempt(async function () {
        const file: Circuit = await getFile(userId, req.params.circuit);
        await file.info;

        if (['circuitName', 'content', 'components', 'ownerEmail'].map(i => i in req.body).includes(false)) {
            res.status(400);
            res.end('The file is invalid as it may be malformed. Confirm the correctness of the file before saving again');
        } else {
            await file.writeContents(req.body as CircuitObj);
            res.status(200);
            res.end('Success');
        }
    })) {
        res.status(403);
        res.end('Access to the requested document was denied');
    }
});

router.delete('/circuit/:circuit', async function (req, res) {
    const userToken: string = req.userId || "";
    const usr = await verifyUser(userToken);

    if (!usr) {
        res.status(401);
        res.end('Unverified request');
    } else if (await attempt(async function () {
        const file = await getFile(userToken, req.params.circuit);
        await file.fetchInfo();

        if (attemptSync(async () => file.delete(await userTokenToId(userToken)))) {
            res.status(500);
            res.end('Deleting failed for unknown reasons');
        } else {
            res.status(200);
            res.end('Success');
        }
    })) {
        res.status(403);
        res.end('You do not have access to this document');
    }

});

router.put('/circuit/:circuit/collaborator', async function (req, res) {
    const userToken: string = req.userId || "";
    const usr = await verifyUser(userToken);

    if (!usr) {
        res.status(401);
        res.end('Unverified request');
    } else if (await attempt(async function () {
        const file = await getFile(userToken, req.params.circuit);
        await file.fetchInfo();

        if (req.query.user) {
            const alreadyExists = file.collaborators.includes(await userTokenToId(userToken));
            if (alreadyExists && 'can-edit' in req.query) {
                await file.changeAccess(await userTokenToId(userToken), Number(req.query.user), req.query['can-edit'] === 'true');
                res.status(200);
                res.end('Success');
            } else if (!alreadyExists) {
                await file.addCollaborator(await userTokenToId(userToken), Number(req.query.user), req.query['can-edit'] === 'true')
                res.status(200);
                res.end('Success');
            } else {
                res.status(204);
                res.end('User already added');
            }
        } else {
            res.status(400);
            res.end('User not specified under ./?user');
        }
    }, err => console.error(err))) {
        res.status(403);
        res.end('You do not have access to this document');
    }
});

router.delete('/circuit/:circuit/collaborator', async function (req, res) {
    const userToken: string = req.userId || "";
    const usr = await verifyUser(userToken);

    if (!usr) {
        res.status(401);
        res.end('Unverified request');
    } else if (await attempt(async function () {
        const file = await getFile(userToken, req.params.circuit);
        await file.fetchInfo();

        if (req.query.user) {
            await file.removeCollaborator(await userTokenToId(userToken), Number(req.query.user));
            res.end('Success');

        } else {
            res.status(400);
            res.end('User not specified under ./?user');
        }
    })) {
        res.status(403);
        res.end('You do not have access to this document');
    }
});

router.put('/circuit/:circuit/add-component', async function (req, res) {
    const userToken: string = req.userId || "";
    const usr = await verifyUser(userToken);

    if (!usr) {
        res.status(401);
        res.end('Unverified request');
    } else if (await attempt(async function () {
        const file = await getFile(userToken, req.params.circuit);
        await file.fetchInfo();

        if (await attempt(async function () {
            if (req.query.component && typeof req.query.component === 'string')
                if (await sql.sql_get(`SELECT exists(select "componentId"
                                                     from components
                                                     where "componentToken" = $1)`, [req.query.component])) {
                    // if (await sql.sql_get(`SELECT exists(select componentId
                    //                                      from components
                    //                                      where componentToken == $tok)`, {
                    //     $tok: req.query.component
                    // })) {
                    file.info.components.push(req.query.component);
                    await file.writeContents(file.info);

                    res.status(200);
                    res.end('Success');
                }
        })) {
            res.status(500);
            res.end('An error occurred writing the change');
        }
    })) {
        res.status(403);
        res.end('You do not have access to this document');
    }
})

router.post('/circuit/:circuit/', async function (req, res) {
    const userToken: string = req.userId || "";
    const usr = await verifyUser(userToken);

    if (!usr) {
        res.status(401);
        res.end('Unverified request');
    } else if (await attempt(async function () {
        const file = await getFile(userToken, req.params.circuit);
        await file.fetchInfo();

        if ('name' in req.query)
            file.changeDocumentName(await userTokenToId(userToken), req.query['name'] as string).then(_ => {
                res.status(200);
                res.end('Success');
            });
        else if ('public' in req.query)
            file.changeVisibility(await userTokenToId(userToken), req.query.public === 'true').then(_ => {
                res.status(200);
                res.end('Success');
            });
        else {
            res.status(400);
            res.end('Unknown options given');
        }
    })) {
        res.status(403);
        res.end('You do not have access to this document');
    }
});
router.delete('/circuit/:circuit/leave', async function (req, res) {
    const userToken: string = req.userId || "";
    const usr = await verifyUser(userToken);

    if (!usr) {
        res.status(401);
        res.end('Unverified request');
    } else if (await attempt(async function () {
        const file = await getFile(userToken, req.params.circuit);
        await file.fetchInfo();
        await file.removeCollaborator(await userTokenToId(userToken), await userTokenToId(userToken));
        res.status(200);
        res.end('success')
    })) {
        res.status(403);
        res.end('You do not have access to this document');
    }
});

export default router;