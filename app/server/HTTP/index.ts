import * as path from 'path';
import * as http from 'http';

import * as express from 'express';
import * as sm from 'source-map-support';
import * as body from 'body-parser';
import * as cookies from 'cookie-parser';
import * as WebSocket from 'ws';

import UserRouter from "./UserRouter";
import DocumentRouter from "./DocumentRouter";
import ComponentRouter from "./ComponentRouter";
import ApplicationRouter from './ApplicationRouter';
import ResourceRouter from './ResourceRouter';

import {getTimeString, rootFn} from "../utils";
import {liveReload} from "./util";

sm.install();

export const app = express();

app.set("view engine", "pug");
app.set("views", path.join(rootFn(process.cwd()), 'app', 'views'));

app.use(cookies());
app.use(body.urlencoded({extended: true}));
app.use(body.json({}));

app.use(function (req, res, next) {
    console.log(getTimeString(), req.method.toUpperCase(), req.path);
    next();
});

app.use("/app", express.static(path.join(rootFn(process.cwd()), "./build/final")));

app.get('/app', function (req, res) {
    res.render('app');
})

app.use("/user", UserRouter);
app.use("/component", ComponentRouter);
app.use(DocumentRouter);
app.use(ApplicationRouter);

app.use(ResourceRouter);

export const port = Number(process.argv[2]) || 3500;

export const reloadPort = liveReload();

app.listen(port, function () {
    console.log('listening on port', port);
});
