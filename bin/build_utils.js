import fs from "fs";
import path from "path";
import childProcess from "child_process";
import url from "url";

export const awaitProc = cli => new Promise(function (resolve, reject) {
    const proc = childProcess.exec(cli);

    proc.stdout.on("data", function (data) {
        process.stdout.write(data.split("\n").map(i => `\t${i}`).join("\n"));
    });

    proc.stderr.on("data", function (data) {
        process.stderr.write(data.split("\n").map(i => `\t${i}`).join("\n"));
    });

    proc.on('exit', function (code) {
        if (code === 0)
            resolve();
        else
            reject(code);
    });
});

export const copy = function (loc, dest) {
    if (fs.existsSync(loc)) {
        if (fs.lstatSync(loc).isDirectory()) {
            const items = fs.readdirSync(loc);

            if (!fs.existsSync(dest))
                fs.mkdirSync(dest, {recursive: true});

            for (const item of items) {
                if (fs.lstatSync(path.join(loc, item)).isDirectory())
                    copy(path.join(loc, item), dest);
                else
                    fs.copyFileSync(path.join(loc, item), path.join(dest, item));
            }
        } else
            fs.copyFileSync(path.join(loc, item), dest);
    } else
        throw {
            msg: `The item doesn't exist`,
            item: loc,
            destination: dest
        };
}

export function find(dir, file) {
    if (!fs.statSync(dir).isDirectory())
        return find(path.dirname(dir), file);

    if (fs.readdirSync(dir).includes(file))
        return dir;
    else if (dir.split(path.sep).length >= 2)
        return find(path.dirname(dir), file);
    else
        return null;
}

export const root = find(url.fileURLToPath(import.meta.url), 'package.json');
const app = path.join(root, 'app'),
    build = path.join(root, 'build'),
    tsOutput = path.join(build, 'app'),
    finalOutput = path.join(build, 'final')
export const dirs = {
    root: root,
    app: app,
    build: build,
    tsOutput: tsOutput,
    finalOutput: finalOutput,
}