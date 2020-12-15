import * as path from 'path';

import * as express from 'express';
import * as sm from 'source-map-support';
import * as body from 'body-parser';
import * as cookies from 'cookie-parser';

import UserRouter from "./UserRouter";
import DocumentRouter from "./DocumentRouter";
import App from './app';
import Res from './res';

import {getTimeString, rootFn} from "../utils";

sm.install();

const app = express();

app.set("view engine", "pug");
app.set("views", path.join(rootFn(process.cwd()), 'app', 'views'));

app.use(cookies());
app.use(body.urlencoded({extended: true}));
app.use(body.json({}));

app.use(function (req, res, next) {
    console.log(getTimeString(), req.method.toUpperCase(), req.path);
    next();
});

app.use(express.static(path.join(process.cwd(), "./build/final")));

app.get('/app', function (req, res) {
    res.render('app');
})

app.use("/user", UserRouter);
app.use(DocumentRouter);

app.use(App);
app.use("/res/", Res);

const port = Number(process.argv[2]) || 3500;
app.listen(port, function () {
    console.log('listening on port', port);
})
