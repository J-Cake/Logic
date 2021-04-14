import * as _ from "lodash";
import * as express from "express";

import {convertFromHTMLForm, getPreferencesForUser, isLoggedIn, verifyUser, writePreferences} from "../User";
import sql from "../sql";

import {reloadPort} from "./index";
import getFile, {DBPreferenceMap} from "../getFile";
import searchComponents from "../App/searchComponents";
import {attempt} from "../utils";
import docToComponent from "../App/Component";
import {PreferenceDescriptor, PreferenceType} from "../../src/Enums";

const router: express.Router = express.Router();

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
            comps: await sql.sql_all<{ componentToken: string, componentName: string }>(`SELECT componentToken, componentName
                                                                                         from components
                                                                                         where ownerId == (SELECT userId from users where userToken == ?)`, [userToken]) || [],
            title: "Dashboard",
            isLoggedIn: isLoggedIn(req)
        });
    }
});

router.get('/edit/:circuit', async function (req, res) {
    const userToken: string = req.userId || "";
    const usr = await verifyUser(userToken);

    if (!usr) {
        res.status(401);
        res.end('Unverified request');
    } else if (await attempt(async function () {
        const file = await getFile(userToken, req.params.circuit);
        await file.fetchInfo();

        res.render("app", {
            circuit: req.params.circuit,
            title: `Editing ${file.info.circuitName}`,
            devMode: reloadPort,
            isLoggedIn: isLoggedIn(req)
        });
    })) res.render('site/403');
});
router.get('/view/:circuit', async function (req, res) {
    const userToken: string = req.userId || "";
    const usr = await verifyUser(userToken);

    if (!usr) {
        res.status(401);
        res.end('Unverified request');
    } else if (await attempt(async function () {
        const file = await getFile(userToken, req.params.circuit);
        await file.fetchInfo();

        res.render("viewer", {
            circuit: req.params.circuit,
            devMode: reloadPort,
            title: `Peeking ${file.info.circuitName}`,
            isLoggedIn: isLoggedIn(req)
        });
    })) res.render('site/403');
});

router.get('/components/:circuit/', async function (req, res) {
    const userToken: string = req.userId || "";
    const usr = await verifyUser(userToken);

    if (!usr) {
        res.status(401);
        res.end('Unverified request');
    } else if (await attempt(async function () {
        const file = await getFile(userToken, req.params.circuit);
        await file.fetchInfo();

        res.render("componentMenu", {
            components: await file.componentIdStringToNames(),
            devMode: reloadPort,
            title: `Components`,
            isLoggedIn: isLoggedIn(req)
        });
    }, err => console.error(err))) {
        res.status(403);
        res.end('Access to the requested document was denied');
    }

});
router.get('/find/:circuit/', async function (req, res) {
    const userToken: string = req.userId || "";
    const file = await getFile(userToken, req.params.circuit);
    await file?.fetchInfo();

    if (file)
        if (req.query['q'])
            res.render("findComponents", {
                search: await searchComponents(req.query['q'] as string),
                yourComponents: await sql.sql_all<{ componentToken: string, componentName: string }>(`SELECT componentToken, componentName
                                                                                                      from components
                                                                                                      where ownerId == (SELECT userId from users where userToken == ?)`, [userToken]) || [],
                doc: req.params.circuit,
                devMode: reloadPort,
                title: `Explore`,
                isLoggedIn: isLoggedIn(req),
                query: req.query['q'] as string,
                msg: req.cookies['error'] ?? ''
            });
        else
            res.render("findComponents", {
                search: {
                    foundComponents: [],
                    page: 0,
                },
                yourComponents: await sql.sql_all<{ componentToken: string, componentName: string }>(`SELECT componentToken, componentName
                                                                                                      from components
                                                                                                      where ownerId == (SELECT userId from users where userToken == ?)`, [userToken]) || [],
                doc: req.params.circuit,
                devMode: reloadPort,
                title: `Explore`,
                isLoggedIn: isLoggedIn(req),
                msg: req.cookies['error'] ?? ''
            });
    else {
        res.status(403);
        res.end('Access to the requested document was denied');
    }
});

router.post('/doc-to-component/:circuit', async function (req, res) {
    const userToken: string = req.userId || "";
    const usr = await verifyUser(userToken);

    if (!usr) {
        res.status(401);
        res.end('Unverified request');
    } else if (await attempt(async function () {
        const file = await getFile(userToken, req.params.circuit);
        await file.fetchInfo();

        if (file) {
            if (req.body.document)
                if (await attempt(async function () {
                    if (await attempt(async () => docToComponent(req.body.document, userToken, !!req.body.stateful), function (msg: string) {
                        res.cookie('error', msg ?? 'failed to convert document to component');
                        res.redirect(`/find/${req.params.circuit}`);
                    })) return;

                    res.clearCookie('error');
                    res.cookie('componentToken', '');
                    res.redirect(`/find/${req.params.circuit}`);
                })) {
                    res.status(403);
                    res.redirect(`/import-document/${req.params.circuit}`);
                }
        } else {
            res.status(403);
            res.end('Access to the requested document was denied');
        }
    })) {
        res.status(403);
        res.end('You do not have access to this document');
    }
});

router.get('/import-document/:circuit', async function (req, res) {
    const userToken: string = req.userId || "";
    const usr = await verifyUser(userToken);

    if (!usr) {
        res.status(401);
        res.end('Unverified request');
    } else if (await attempt(async function () {
        const file = await getFile(userToken, req.params.circuit);
        await file.fetchInfo();

        if (file)
            res.render('import-document', {
                own: await sql.sql_all<{ documentToken: number, documentTitle: string }>(`SELECT *
                                                                                          from documents
                                                                                          where ownerId == (SELECT userId from users where userToken == ?)`, [userToken]) || [],
                shared: await sql.sql_all<{ documentToken: number, documentTitle: string }>(`SELECT *
                                                                                             from documents
                                                                                             where documentId ==
                                                                                                   (SELECT documentId
                                                                                                    from access
                                                                                                    where userId == (SELECT userId from users where userToken == ?))`, [userToken]) || [],
                doc: req.params.circuit
            });
        else {
            res.status(403);
            res.end('Access to the requested document was denied');
        }
    })) {
        res.status(403);
        res.end('You do not have access to this document');
    }
});

router.get('/collab/:circuit/', async function (req, res) {
    const userId: string = req.userId || "";
    const file = await getFile(userId, req.params.circuit);
    await file?.fetchInfo();

    if (file)
        res.render('collab', {
            collabs: await sql.sql_all(`SELECT email, identifier, users.userId, dateGranted, canEdit
                                        from users
                                                 inner join access a on users.userId = a.userId
                                        WHERE users.userId in (SELECT userId
                                                               from access
                                                               where documentId == (SELECT documentId from documents where documentToken == ?))`, [req.params.circuit])
        });
    else {
        res.status(403);
        res.end('Access to the requested document was denied');
    }
});

router.get('/search-users', async function (req, res) {
    const recordsPerPage = 25;
    const {count} = await sql.sql_get<{ count: number }>(`SELECT COUNT(*) as count
                                                          from users`);
    const page = Math.min(Math.max(Number(req.query.page || '0') ?? 0, 0), Math.ceil(count / recordsPerPage));
    res.json({
        users: await sql.sql_all(`SELECT email, identifier, userId
                                  from users
                                  where identifier like ?1
                                     or email like ?1
                                  LIMIT ?2 * ?3, ?3`, [`%${req.query.q ?? ''}%`, page, recordsPerPage]),
        page: page + 1,
        records: count,
        recordsPerPage: recordsPerPage,
        pages: Math.ceil(count / recordsPerPage)
    });
});

router.get('/settings', async function (req, res) {
    const userToken: string = req.userId || "";
    const usr = await verifyUser(userToken);

    if (!usr) {
        res.status(401);
        res.end('Unverified request');
    } else if (await attempt(async function () {
        res.render("preferences", {
            preferences: await getPreferencesForUser(userToken),
            PreferenceDescriptor,
            Type: PreferenceType
        });
    })) res.render('site/403')
});

router.post('/settings', async function (req, res) {
    const userToken: string = (req.cookies.userId ?? req.header("userId")) || "";
    const usr = await verifyUser(userToken);

    if (!usr) {
        res.status(401);
        res.end('Unverified request');
    } else if (await attempt(async function () {
        const prefs = _.merge(await getPreferencesForUser(userToken), convertFromHTMLForm(req.body)) as DBPreferenceMap
        console.log("prefs", prefs, "incoming", req.body);
        await writePreferences(prefs, userToken);
        res.redirect('/settings');
    })) res.end('Insufficient permissions');
});

export default router;