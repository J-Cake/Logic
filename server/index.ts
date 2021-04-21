import express from 'express';
import morgan from 'morgan';

import vhost from 'vhost';
import 'source-map-support/register';

import API from './API';
import App from './App';
import Admin from './Admin';

import {getPort, liveReload, rootFn} from './util/utils';
import bodyParser from "body-parser";

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

app.use(vhost('*', await App()));
app.use(vhost('api.*', await API()));
app.use(vhost('admin.*', await Admin()));

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