import * as path from "path";
import * as FS from './FS';
import * as WebSocket from "ws";
import {app, port} from "./HTTP";

export async function rootFn(): Promise<string> {
    let dir = __dirname;
    let items = await FS.readdir(dir);

    while (!items.includes('package.json'))
        items = await FS.readdir(dir = path.dirname(dir));

    return dir;
}

export function getTimeString(): string {
    const time = new Date();

    return `${time.getDate().toString().padStart(2, '0')}.${time.getMonth().toString().padStart(2, '0')}.${time.getFullYear()} ${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}:${time.getSeconds().toString().padStart(2, '0')}`;
}

export function attempt(fn: () => Promise<any>, fail?: (err: any) => void): Promise<boolean> {
    return new Promise(function (resolve) {
        try {
            fn().then(() => resolve(false)).catch(err => {
                if (fail)
                    fail(err);
                resolve(true);
            });
        } catch (err) {
            if (fail)
                fail(err);
            resolve(true);
        }
    });
}

export function attemptSync(fn: () => any, fail?: (err: any) => void): boolean {
    try {
        fn();
        return false
    } catch (err) {
        if (fail)
            fail(err);
        return true;
    }
}

export function liveReload(): number | null {
    if (process.argv.includes('--dev')) {
        console.log('Enabling Live-Reload');
        const wss = new WebSocket.Server({port: port + 1});
        app.head('/api/reload-local', (req, res) => res.end(wss.clients.forEach(i => i.send('reload'))));
        return port + 1;
    } else
        return null;
}