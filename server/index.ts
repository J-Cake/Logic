import os from 'os';

import express from 'express';
import morgan from 'morgan';
import _ from 'lodash';
import 'source-map-support/register';

import API from './API';
import App from './App';
import Admin from './Admin';

import {getPort, liveReload, rootFn} from './util/utils';
import bodyParser from "body-parser";
import host from "./host";

export const port: number = getPort();
export const devMode: boolean = process.argv.includes('--dev');

export const app: express.Application = express();

app.use(morgan(devMode ? 'dev' : 'combined'));
app.use(bodyParser.json());

app.enable("trust proxy");

app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, HEAD');
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', '*');

    if (req.method.toLowerCase() === 'options')
        res.end();
    else
        next();
});

// console.log(os.networkInterfaces())
// const baseAddr = _.map(os.networkInterfaces(), i => i.map(j => j.address));

app.use(host('api', await API()));
app.use(host('admin', await Admin()));
app.use(host(['api', 'admin'], await App()));

app.listen(port, async function () {
    if (devMode) {
        console.log("-- Dev Mode");
        const reloadPort = liveReload(app);
        console.log("---- Enabling Live-Reload on port", reloadPort);
    }
    console.log('-- Listening on port', port);
    console.log('-- Root:', await rootFn());
    console.log();
});