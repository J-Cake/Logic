import * as express from 'express';
import * as bcrypt from 'bcrypt';
import sql from "../sql";
import {DBUser} from "../getFile";
import {getTimeString} from "../utils";

const router = express.Router();

router.get('/login', async function (req, res) { // These are pages
    res.render("login", {err: req.cookies.error});
});

router.get('/signup', async function (req, res) { // These are pages
    res.render("signup", {err: req.cookies.error});
});

router.post("/login", async function (req, res) {
    const email: string = req.body.email;
    const password: string = req.body.password;

    if (email && password) {
        const db = await sql.sql_get<Partial<DBUser>>(`SELECT *
                                                       from users
                                                       where email == ?`, [email])

        if (!db) {
            res.status(400);
            res.cookie("error", 'the email address is invalid');
            res.redirect("/user/login");
        } else if (await bcrypt.compare(password, <string>db.password)) {
            res.cookie('userId', db.userToken);
            res.redirect("/dashboard");
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
                                           where email == ?`, [email]);

    if (password !== passwordConfirm) {
        res.status(400);
        res.cookie('error', 'passwords don\'t match');
        res.redirect('/user/signup');
    } else if (usr && usr.password) {
        if (await bcrypt.compare(password, usr.password)) {
            // Make token only last for 24 h
            res.cookie('userId', usr.userToken);
            res.status(202);
            res.redirect("/dashboard");
        } else {
            res.status(409);
            res.cookie("error", "email is already in use");
            res.redirect('/user/signup');
        }
    } else {
        const userId: number = 1 + (await sql.sql_get<{userId: number}>(`SELECT max(userId) as userId from users`)).userId;
        const token = bcrypt.hashSync(`${name}:${email}:${getTimeString()}`, 1);

        await sql.sql_query(`INSERT into users VALUES (?, ?, date('now'), ?, ?, ?)`, [userId, email, bcrypt.hashSync(password, 10), name, token]);

        // console.log("Done");
        res.cookie('userId', token);
        res.status(201);
        res.redirect('/dashboard');
    }
});

router.get('/logout', function (req, res) {
    res.clearCookie("userId");
    res.redirect("/");
});

export default router;