import * as fs from "fs";

export function rootFn (dir: string): string {
    const items = fs.readdirSync(dir);

    if (items.includes('package.json'))
        return dir;
    else
        return rootFn(dir.split(/[\/\\]/g).slice(0, -1).join('/'));
}

export function getTimeString(): string {
    const time = new Date();

    return `${time.getDate().toString().padStart(2, '0')}.${time.getMonth().toString().padStart(2, '0')}.${time.getFullYear()} ${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}:${time.getSeconds().toString().padStart(2, '0')}`;
}