import {Router} from 'express';

import {isLoggedIn, verifyUser} from "../User";
import sql from "../sql";

import {reloadPort} from "./index";
import getFile from "../getFile";
import searchComponents from "../searchComponents";

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
        // const own =
        // const shared =
        // const components = ;

        res.render("dashboard", {
            own: await sql.sql_all<{ documentToken: number, documentTitle: string }>(`SELECT *
                                                                                         from documents
                                                                                         where ownerId == (SELECT userId from users where userToken == ?)`, [userToken]) || [],
            shared: await sql.sql_all<{ documentToken: number, documentTitle: string }>(`SELECT *
                                                                                            from documents
                                                                                            where documentId ==
                                                                                                  (SELECT documentId
                                                                                                   from access
                                                                                                   where userId == (SELECT userId from users where userToken == ?))`, [userToken]) || [],
            comps: await sql.sql_all<{componentToken: string, componentName: string}>(`SELECT componentToken, componentName
                                                  from components
                                                  where ownerId == (SELECT userId from users where userToken == ?)`, [userToken]) || [],
            title: "Dashboard",
            isLoggedIn: isLoggedIn(req)
        });
    }
});

router.get('/edit/:circuit', function (req, res) {
    res.render("app", {
        circuit: req.params.circuit,
        devMode: reloadPort,
        title: `Editing ${req.params.circuit}`,
        isLoggedIn: isLoggedIn(req)
    });
});
router.get('/view/:circuit', function (req, res) {
    res.render("viewer", {
        circuit: req.params.circuit,
        devMode: reloadPort,
        title: `Editing ${req.params.circuit}`,
        isLoggedIn: isLoggedIn(req)
    });
});

router.get('/components/:circuit/', async function (req, res) {
    const userId: string = req.userId || "";
    const file = await getFile(userId, req.params.circuit);
    await file?.fetchInfo();

    if (file)
        res.render("componentMenu", {
            components: file.components,
            devMode: reloadPort,
            title: `Components`,
            isLoggedIn: isLoggedIn(req)
        });
    else {
        res.status(403);
        res.end('Access to the requested document was denied');
    }
});
router.get('/find/:circuit/', async function (req, res) {
    const userId: string = req.userId || "";
    const file = await getFile(userId, req.params.circuit);
    await file?.fetchInfo();

    if (file)
        if (req.query['q'])
            res.render("findComponents", {
                foundComponents: await searchComponents(req.query['q'] as string),
                devMode: reloadPort,
                title: `Explore`,
                isLoggedIn: isLoggedIn(req)
            });
        else
            res.render("findComponents", {
                foundComponents: [],
                devMode: reloadPort,
                title: `Explore`,
                isLoggedIn: isLoggedIn(req)
            });
    else {
        res.status(403);
        res.end('Access to the requested document was denied');
    }
});

export default router;