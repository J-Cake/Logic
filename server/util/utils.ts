import path from 'path';
import url from 'url';

import express from 'express';
import WebSocket from 'ws';

import * as FS from './files';

import {port} from '../index';

export {dirs} from '../../bin/build_utils';

export async function rootFn(): Promise<string> {
    let dir = path.dirname(url.fileURLToPath(import.meta.url));
    let items = await FS.readdir(dir);

    while (!items.includes('package.json'))
        items = await FS.readdir(dir = path.dirname(dir));

    return dir;
}

export function getTimeString(): string {
    const time = new Date();

    return `${time.getDate().toString().padStart(2, '0')}.${time.getMonth().toString().padStart(2, '0')}.${time.getFullYear()} ${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}:${time.getSeconds().toString().padStart(2, '0')}`;
}

export {attempt, attemptSync} from '../../app/util';

export function liveReload(app: express.Application): number | null {
    const wss = new WebSocket.Server({port: port + 1});
    app.head('/api/reload-local', function (req: express.Request, res: express.Response) {
        for (const client of wss.clients)
            client.send('reload');

        res.status(200);
        res.end();
    });

    return port + 1;
}

export interface Pref {
    startingComponents: string[]
}

export function getPort(): number {
    if (process.env.LB_USE_PORT) {
        console.log('---- Port Override specified:', Number(process.env.LB_USE_PORT));
        return Number(process.env.LB_USE_PORT);
    }
    const _p = process.argv.find(i => /^--port=\d+$/.test(i))?.match(/^--port=(\d+)$/);
    return Number(_p ? _p[1] : '2560');
}