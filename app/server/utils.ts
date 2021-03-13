import * as path from "path";
import * as FS from './FS';

export async function rootFn (): Promise<string> {
    let dir = __dirname;
    let items = await FS.readdir(dir);

    while (!items.includes('package.json'))
        items = await FS.readdir(dir = path.dirname(dir));

    return dir;
    // if (items.includes('package.json'))
    //     return __dirname;
    // else
    //     return rootFn(path.dirname(__dirname));
}

export function getTimeString(): string {
    const time = new Date();

    return `${time.getDate().toString().padStart(2, '0')}.${time.getMonth().toString().padStart(2, '0')}.${time.getFullYear()} ${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}:${time.getSeconds().toString().padStart(2, '0')}`;
}