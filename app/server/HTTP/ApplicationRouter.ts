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
            comps: await sql.sql_all<{ componentToken: string, componentName: string }>(`SELECT componentToken, componentName
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

router.get('/collab/:circuit/', async function (req, res) {
    const userId: string = req.userId || "";
    const file = await getFile(userId, req.params.circuit);
    await file?.fetchInfo();

    res.render('collab', {
        collabs: await sql.sql_all(`SELECT email, identifier, users.userId, dateGranted, canEdit
                                    from users
                                             inner join access a on users.userId = a.userId
                                    WHERE users.userId in (SELECT userId
                                                           from access
                                                           where documentId == (SELECT documentId from documents where documentToken == ?))`, [req.params.circuit])
    });
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

export default router;