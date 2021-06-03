import _ from 'lodash';
import express from 'express';

import {convertFromHTMLForm, getPreferencesForUser, isLoggedIn, verifyUser, writePreferences} from './Auth/UserActions';
import sql from '../util/sql';

import getFile, {DBDocument, DBPreferenceMap} from './Document/getFile';
import searchComponents from './Document/searchComponents';
import {attempt} from '../util/utils';
import docToComponent from './Document/Component';
import {PreferenceDescriptor, PreferenceType} from '../../app/src/Enums';
import {devMode} from "../index";

const router: express.Router = express.Router();

router.use(async function (req, res, next) {
    const userToken = req.cookies['auth-token'] ?? req.header("auth-token");
    req.userToken = userToken;

    if (!userToken || !await verifyUser(userToken))
        res.redirect('/user/login');
    else next();
})

router.get('/dashboard', async function (req, res) {
    const userToken = req.userToken || "";

    if (await verifyUser(userToken)) {

        res.render("dashboard", {
            own: await sql.sql_all<{ documentToken: number, documentTitle: string }>(`SELECT *
                                                                                      from documents
                                                                                      where "ownerId" = (SELECT "userId" from users where "userToken" = $1)`, [userToken]) || [],
            shared: await sql.sql_all<{ documentToken: number, documentTitle: string }>(`SELECT *
                                                                                         from documents
                                                                                         where "documentId" =
                                                                                               (SELECT "documentId"
                                                                                                from access
                                                                                                where "userId" = (SELECT "userId" from users where "userToken" = $1))`, [userToken]) || [],
            comps: await sql.sql_all<{ componentToken: string, componentName: string }>(`SELECT "componentToken", "componentName"
                                                                                         from components
                                                                                         where "ownerId" = (SELECT "userId" from users where "userToken" = $1)`, [userToken]) || [],
            title: "Dashboard",
            isLoggedIn: isLoggedIn(req)
        });
    }
});

router.get('/edit/:circuit', async function (req, res) {
    const userToken: string = req.userToken || "";
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
            devMode: devMode,
            isLoggedIn: isLoggedIn(req)
        });
    })) res.render('site/403');
});
router.get('/view/:circuit', async function (req, res) {
    const userToken: string = req.userToken || "";
    const usr = await verifyUser(userToken);

    if (!usr) {
        res.status(401);
        res.end('Unverified request');
    } else if (await attempt(async function () {
        const file = await getFile(userToken, req.params.circuit);
        await file.fetchInfo();

        res.render("viewer", {
            circuit: req.params.circuit,
            devMode: devMode,
            title: `Peeking ${file.info.circuitName}`,
            isLoggedIn: isLoggedIn(req)
        });
    })) res.render('site/403');
});

router.get('/components/:circuit/', async function (req, res) {
    const userToken: string = req.userToken || "";
    const usr = await verifyUser(userToken);

    if (!usr) {
        res.status(401);
        res.end('Unverified request');
    } else if (await attempt(async function () {
        const file = await getFile(userToken, req.params.circuit);
        await file.fetchInfo();

        res.render("componentMenu", {
            components: await file.componentIdStringToNames(),
            devMode: devMode,
            title: `Components`,
            isLoggedIn: isLoggedIn(req)
        });
    }, err => console.error(err))) {
        res.status(403);
        res.end('Access to the requested document was denied');
    }

});
router.get('/find/:circuit/', async function (req, res) {
    const userToken: string = req.userToken || "";
    const file = await getFile(userToken, req.params.circuit);
    await file?.fetchInfo();

    if (file)
        if (req.query['q'])
            res.render("findComponents", {
                search: await searchComponents(req.query['q'] as string),
                yourComponents: await sql.sql_all<{ componentToken: string, componentName: string }>(`SELECT "componentToken", "componentName"
                                                                                                      from components
                                                                                                      where "ownerId" = (SELECT "userId" from users where "userToken" = $1)`, [userToken]) || [],
                doc: req.params.circuit,
                devMode: devMode,
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
                yourComponents: await sql.sql_all<{ componentToken: string, componentName: string }>(`SELECT "componentToken", "componentName"
                                                                                                      from components
                                                                                                      where "ownerId" = (SELECT "userId" from users where "userToken" = $1)`, [userToken]) || [],
                doc: req.params.circuit,
                devMode: devMode,
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
    const userToken: string = req.userToken || "";
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
    const userToken: string = req.userToken || "";
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
                                                                                          where "ownerId" = (SELECT "userId" from users where "userToken" = $1)`, [userToken]) || [],
                shared: await sql.sql_all<{ documentToken: number, documentTitle: string }>(`SELECT *
                                                                                             from documents
                                                                                             where "documentId" =
                                                                                                   (SELECT "documentId"
                                                                                                    from access
                                                                                                    where "userId" = (SELECT "userId" from users where "userToken" = $1))`, [userToken]) || [],
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
    const userToken: string = req.userToken || "";
    const file = await getFile(userToken, req.params.circuit);
    await file?.fetchInfo();

    if (file)
        res.render('collab', {
            collabs: await sql.sql_all(`SELECT email, identifier, users."userId", "dateGranted", "canEdit"
                                        from users
                                                 inner join access a on users."userId" = a."userId"
                                        WHERE users."userId" in (SELECT "userId"
                                                                 from access
                                                                 where "documentId" =
                                                                       (SELECT "documentId" from documents where "documentToken" = $1))`, [req.params.circuit])
        });
    else {
        res.status(403);
        res.end('Access to the requested document was denied');
    }
});

router.get('/settings', async function (req, res) {
    const userToken: string = req.userToken || "";
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
    const userToken: string = (req.cookies['auth-token'] ?? req.header("auth-token")) || "";
    const usr = await verifyUser(userToken);

    if (!usr) {
        res.status(401);
        res.end('Unverified request');
    } else if (await attempt(async function () {
        const prefs = _.merge(await getPreferencesForUser(userToken), convertFromHTMLForm(req.body)) as DBPreferenceMap
        await writePreferences(prefs, userToken);
        res.redirect('/settings');
    })) res.end('Insufficient permissions');
});

export default router;