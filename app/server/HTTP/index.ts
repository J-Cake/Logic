import * as path from 'path';

import * as express from 'express';
import * as sm from 'source-map-support';
import * as body from 'body-parser';
import * as cookies from 'cookie-parser';

import UserRouter from "./UserRouter";
import DocumentRouter from "./DocumentRouter";
import {getTimeString} from "../utils";

sm.install();

const app = express();

app.use(cookies());
app.use(body.urlencoded({extended: true}));

app.use(function (req, res, next) {
    console.log(getTimeString(), req.method.toUpperCase(), req.path);
    next();
});

app.use(express.static(path.join(process.cwd(), "./build/final")));

app.use("/user", UserRouter);
app.use(DocumentRouter);

const port = Number(process.argv[2]) || 3500;
app.listen(port, function () {
    console.log('listening on port', port);
})
