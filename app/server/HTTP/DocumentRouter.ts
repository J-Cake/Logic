import * as fs from "fs";
import * as path from "path";

import * as express from 'express';
import * as bodyParser from 'body-parser';

import getFile, {DBUser} from "../getFile";
import {verifyUser} from "../User";
import {rootFn} from "../utils";
import sql from "../sql";
import Circuit, {CircuitObj} from "../Circuit";

const router = express.Router();

router.use(bodyParser.json({}));

router.use(async function (req, res, next) {
    const userId = req.cookies.userId ?? req.header("userId");
    req.userId = userId;

    if (!userId || !await verifyUser(userId))
        res.redirect('/user/login');
    else next();
})

router.get("/make", async function (req, res) {
    const userId: string = req.userId || "";

    const name = (req.query.name || "").toString() || Math.floor(Math.random() * 11e17).toString(36);

    const circuitToken: string = Math.floor(Math.random() * 11e17).toString(36);
    const circuitId: number = 1 + (await sql.sql_get<{ documentId: number }>(`SELECT max(documentId) as documentId
                                                                              from documents`)).documentId;

    const user: DBUser = await sql.sql_get<DBUser>(`SELECT *
                                                    from users
                                                    where userToken == ?`, [userId]);

    const fileName: string = `${user.email.split("@").shift()}${user.identifier.toLowerCase()}_${name}.json`;
    const filePath = path.join(rootFn(process.cwd()), 'Data', 'documents', fileName);
    fs.writeFileSync(filePath, JSON.stringify({
        circuitName: name,
        ownerEmail: (await sql.sql_get<{ email: string }>(`SELECT email
                                                           from users
                                                           where userToken == ?`, [userId])).email,
        components: [
            "std/and",
            "std/or",
            "std/not",
            "std/nand",
            "std/nor",
            "std/xnor",
            "std/xor",
            "std/buffer",
            "std/input",
            "std/output"
        ],
        content: {}
    }, null, 4));

    await sql.sql_query(`INSERT INTO documents
                         VALUES ((SELECT userId from users where userToken == ?), ?, ?, ?, false, ?,
                                 date('now'), date('now'))`, [userId, fileName, circuitId, name, circuitToken]);

    res.redirect(`/edit/${circuitToken}`);
});

// TODO: When creating circuits URL encode the file name in case user enters '/' and error occurs attempting to write to a directory that doesn't exist.

router.get('/circuit/raw/:circuit', async function (req, res) {
    const userId: string = req.userId || "";
    const file = await getFile(userId, req.params.circuit);

    await file?.fetchInfo();

    if (file)
        res.json(file?.info);
    else {
        res.status(403);
        res.end('Access to the requested document was denied');
    }
});

router.put('/circuit/raw/:circuit', async function (req, res) { // File Save
    const userId: string = req.userId || "";
    const usr = await verifyUser(userId);
    // const file = await (await getFile(userId, req.params.circuit))?.fetchInfo();

    if (!usr) {
        res.status(403);
        res.end('Access to the requested document was denied');
    } else {
        res.status(501);
        try {
            const file: Circuit | null = await getFile(userId, req.params.circuit);
            await file?.info;
            if (['circuitName', 'content', 'components', 'ownerEmail'].map(i => i in req.body).includes(false)) {
                res.status(400);
                res.end('The file is invalid as it may be malformed. Confirm the correctness of the file before saving again.');
            } else {
                file?.writeContents(req.body as CircuitObj);
                res.status(200);
                res.end('Success');
            }
        } catch (err) {
            res.status(500);
            res.end('Saving failed for unknown reasons.');
        }
    }
});

router.get('/circuit/props/:circuit', async function (req, res) {
    const userId: string = req.userId || "";
    const usr = await verifyUser(userId);

    if (!usr) {
        res.status(403);
        res.end('Unverified request');
    } else {
        res.status(501);
        try {
            const file: Circuit | null = await getFile(userId, req.params.circuit);

            if (file) {
                await file?.fetchInfo();

                res.json({
                    name: file?.circuitName,
                    dateCreated: new Date((await sql.sql_get<{created: string}>(`SELECT (created) FROM documents where documentToken == ?`, [req.params.circuit])).created).getTime()
                });
            } else {
                res.status(403);
                res.end('Access to the requested document was denied');
            }
        } catch (err) {
            res.status(500);
            res.end('Reading failed for unknown reasons.');
        }
    }
});

export default router;