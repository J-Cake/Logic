import * as fs from "fs";
import * as path from "path";

import * as express from 'express';

import getFile, {DBUser} from "../getFile";
import {verifyUser} from "../User";
import {rootFn} from "../utils";
import sql from "../sql";

const router = express.Router();

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
        ownerEmail: (await sql.sql_get<{email: string}>(`SELECT email from users where userToken == ?`, [userId])).email,
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
                           date('now'))`, [userId, fileName, circuitId, name, circuitToken]);

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

// router.put('/circuit/save/:circuit', async function (req, res) { // File Save
//
// });

export default router;