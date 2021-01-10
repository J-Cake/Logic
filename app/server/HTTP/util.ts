import * as WebSocket from "ws";
import {app, port} from "./index";

export function liveReload(): number | null {
    if (process.argv.includes('--dev')) {
        console.log('Enabling Live-Reload');
        const wss = new WebSocket.Server({port: port + 1});
        app.head('/api/reload-local', (req, res) => res.end(wss.clients.forEach(i => i.send('reload'))));
        return port + 1;
    } else
        return null;
}