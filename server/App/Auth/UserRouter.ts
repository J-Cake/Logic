import express from 'express';
import bcrypt from 'bcrypt';
import _ from 'lodash';

import sql from '../../util/sql';
import {DBUser} from '../Document/getFile';
import {attempt} from '../../util/utils';
import {convertFromHTMLForm, getPreferencesForUser, isLoggedIn, verifyUser, writePreferences} from './UserActions';
import {defaultPreferences} from '../../../app/src/Enums';

const router: express.Router = express.Router();

router.get('/login', async function (req, res) { // These are pages
    res.render("login", {
        err: req.cookies.error,
        isLoggedIn: isLoggedIn(req)
    });
});

router.get('/signup', async function (req, res) { // These are pages
    res.render("signup", {
        err: req.cookies.error,
        isLoggedIn: isLoggedIn(req)
    });
});

router.post("/login", async function (req, res) {
    const email: string = req.body.email;
    const password: string = req.body.password;

    if (email && password) {
        const db = await sql.sql_get<Partial<DBUser>>(`SELECT *
                                                       from users
                                                       where email = $1`, [email])

        if (!db) {
            res.status(400);
            res.cookie("error", 'the email address is invalid');
            res.redirect("/user/login");
        } else if (await bcrypt.compare(password, <string>db.password)) {
            res.cookie('auth-token', db.userToken);
            res.redirect("/dashboard#own");
        } else {
            res.status(403);
            res.cookie("error", 'the password is incorrect');
            res.redirect("/user/login")
        }
    } else {
        res.status(400);
        res.end("invalid data");
    }
});

router.post("/signup", async function (req, res) {
    const email: string = req.body.email;
    const name: string = req.body.name;
    const password: string = req.body.password;
    const passwordConfirm: string = req.body.passwordConfirm;

    const usr = await sql.sql_get<DBUser>(`SELECT *
                                           from users
                                           where email = $1`, [email]);

    if (password !== passwordConfirm) {
        res.status(400);
        res.cookie('error', 'passwords don\'t match');
        res.redirect('/user/signup');
    } else if (usr && usr.password) {
        if (await bcrypt.compare(password, usr.password)) {
            // Make token only last for 24 h
            res.cookie('auth-token', usr.userToken);
            res.status(202);
            res.redirect("/dashboard#own");
        } else {
            res.status(409);
            res.cookie("error", "email is already in use");
            res.redirect('/user/signup');
        }
    } else {
        const token = await (async function() {
            let token = '';

            do
                token = Math.floor(Math.random() * 11e17).toString(36);
            while (await sql.sql_get<{userToken: string}>(`SELECT "userToken" from users where "userToken" = $1`, [token]));

            return token;
        })();

        await sql.sql_query(`INSERT into users (email, password, joined, identifier, "userToken")
                             VALUES ($1, $2, date('now'), $3, $4)`, [email, bcrypt.hashSync(password, 10), name, token]);
        await sql.sql_query(`INSERT INTO user_preferences ("userId")
                             values ((SELECT "userId" from users where "userToken" = $1))`, [token])
        res.cookie('auth-token', token);
        res.status(201);
        res.redirect('/dashboard#own');
    }
});

router.get('/logout', function (req, res) {
    res.clearCookie('auth-token');
    res.redirect("/");
});

export default router;