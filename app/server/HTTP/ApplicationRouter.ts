import {Router} from 'express';

import {verifyUser} from "../User";
import sql from "../sql";

import {reloadPort} from "./index";
import getFile from "../getFile";

const router = Router();

router.use(async function (req, res, next) {
    const userId = req.cookies.userId ?? req.header("userId");
    req.userId = userId;

    if (!userId || !await verifyUser(userId))
        res.redirect('/user/login');
    else next();
})

router.get('/dashboard', async function (req, res) {
    const userToken = req.userId || "";

    if (await verifyUser(userToken)) {
        const own = await sql.sql_all<{ documentToken: number, documentTitle: string }>(`SELECT *
                                                                                         from documents
                                                                                         where ownerId == (SELECT userId from users where userToken == ?)`, [userToken])
        const shared = await sql.sql_all<{ documentToken: number, documentTitle: string }>(`SELECT *
                                                                                            from documents
                                                                                            where documentId ==
                                                                                                  (SELECT documentId
                                                                                                   from access
                                                                                                   where userId == (SELECT userId from users where userToken == ?))`, [userToken])

        res.render("dashboard", {
            own: own || [],
            shared: shared || []
        });
    }
});

router.get('/edit/:circuit', function (req, res) {
    res.render("app", {circuit: req.params.circuit, devMode: reloadPort });
})

router.get('/components/:circuit/', async function (req, res) {
    const userId: string = req.userId || "";
    const file = await getFile(userId, req.params.circuit);
    await file?.fetchInfo();

    if (file)
        res.render("componentMenu", {components: file.components, devMode: reloadPort});
    else {
        res.status(403);
        res.end('Access to the requested document was denied');
    }
})

export default router;