import fs from 'fs';

export function readFile(path: string): Promise<string> {
    return new Promise<string>((resolve, reject) => fs.readFile(path, 'utf8', (err, data) => err ? reject(err) : resolve(data)))
}

export function writeFile(path: string, body: any): Promise<void> {
    return new Promise<void>(function (resolve, reject) {
        if (typeof body === "string")
            fs.writeFile(path, body, (err) => err ? reject(err) : resolve());
        else
            fs.writeFile(path, JSON.stringify(body, null, 4), (err) => err ? reject(err) : resolve());
    });
}

export function readdir(path: string): Promise<string[]> {
    return new Promise((resolve, reject) => fs.readdir(path, (err, data) => err ? reject(err) : resolve(data)));
}


export function stat(path: string): Promise<fs.Stats> {
    return new Promise<fs.Stats>((resolve, reject) => fs.stat(path, ((err, stats) => err ? reject(err) : resolve(stats))));
}

export function exists(path: string): Promise<boolean> {
    return new Promise<boolean>(resolve => fs.exists(path, exists => resolve(exists)))
}

export function readStream(path: string): fs.ReadStream {
    return fs.createReadStream(path);
}

export function writeStream(path: string): fs.WriteStream {
    return fs.createWriteStream(path);
}